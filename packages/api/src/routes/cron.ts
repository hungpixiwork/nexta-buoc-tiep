import { Hono } from 'hono';
import { eq, lte, and, ne, sql } from 'drizzle-orm';
import { Env } from '../bindings';
import { createDatabaseClient, cases, notifications, timelineEvents, users } from '@buoc-tiep/database';
import { dispatchPendingOutboxEvents, pruneStaleFailedOutboxEvents } from '../services/outboxDispatcher';

export const cronRoutes = new Hono<{ Bindings: Env }>();

/**
 * CORE CRON WORKER SLA 48H REMINDER HANDLER
 * Quét cơ sở dữ liệu D1 tìm tất cả các ca đồng hành có next_follow_up_at <= datetime('now')
 * và tạo thông báo nhắc nhở SLA 48h trực tiếp trong D1 thay vì dùng Cloudflare Workflows đắt đỏ.
 */
export async function handleCronSlaScan(env: Env) {
  const db = createDatabaseClient(env.DB);
  const nowIso = new Date().toISOString();

  // 1. Quét các ca quá hạn hoặc đến hạn SLA (status !== 'closed' AND nextFollowUpAt <= NOW)
  const overdueCases = await db
    .select({
      id: cases.id,
      beneficiaryId: cases.beneficiaryId,
      assignedTo: cases.assignedTo,
      organizationId: cases.organizationId,
      priority: cases.priority,
      status: cases.status,
      nextFollowUpAt: cases.nextFollowUpAt,
    })
    .from(cases)
    .where(
      and(
        ne(cases.status, 'closed'),
        lte(cases.nextFollowUpAt, nowIso)
      )
    )
    .all();

  if (!overdueCases || overdueCases.length === 0) {
    return {
      success: true,
      scannedCount: 0,
      notifiedCount: 0,
      message: 'Không có ca nào quá hạn 48h SLA'
    };
  }

  let notifiedCount = 0;

  // 2. Tạo thông báo nhắc nhở SLA & Timeline Event cho từng ca quá hạn
  for (const caseItem of overdueCases) {
    const targetUserId = caseItem.assignedTo || 'usr-volunteer-default';
    const notificationId = `notif-sla-${crypto.randomUUID()}`;
    const timelineId = `tle-sla-${crypto.randomUUID()}`;

    const priorityLabel = (caseItem.priority || 'medium').toUpperCase();

    await db.batch([
      // Chèn thông báo nhắc nhở SLA 48h vào bảng notifications
      db.insert(notifications).values({
        id: notificationId,
        userId: targetUserId,
        title: `[NHẮC NHỞ SLA 48H - URGENCY ${priorityLabel}] Cần cập nhật ca #${caseItem.id.slice(0, 8)}`,
        message: `Ca đồng hành #${caseItem.id} đã vượt quá hạn chót 48h SLA (${caseItem.nextFollowUpAt}). Vui lòng tiến hành kiểm tra hoặc cập nhật tiến trình mới nhất.`,
        isRead: false,
        createdAt: nowIso
      }),

      // Chèn nhật ký thời gian SLA Reminder vào timeline_events
      db.insert(timelineEvents).values({
        id: timelineId,
        caseId: caseItem.id,
        actorId: 'system-cron-worker',
        eventType: 'sla_reminder_sent',
        title: 'Cảnh báo SLA 48h tự động',
        description: `Hệ thống Cron Worker đã phát cảnh báo nhắc nhở SLA 48h tới Tình nguyện viên/Cán bộ phụ trách.`,
        eventDate: nowIso
      }),

      // Tự động gia hạn nextFollowUpAt thêm 48h để tránh spam thông báo liên tục
      db.update(cases)
        .set({
          nextFollowUpAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
        })
        .where(eq(cases.id, caseItem.id))
    ]);

    notifiedCount++;
  }

  return {
    success: true,
    scannedCount: overdueCases.length,
    notifiedCount,
    message: `Đã quét và phát thông báo nhắc nhở SLA 48h cho ${notifiedCount} ca đồng hành thành công`
  };
}

// Endpoint HTTP GET /api/cron/sla-check cho phép kích hoạt quét Cron thủ công hoặc qua Cloudflare Cron Trigger / External Webhook
cronRoutes.get('/sla-check', async (c) => {
  try {
    const cronSecret = c.env.CRON_SECRET || c.env.JWT_SECRET;
    const authHeader = c.req.header('X-Cron-Secret') || c.req.header('Authorization');
    if (cronSecret && (!authHeader || !authHeader.includes(cronSecret))) {
      return c.json({ success: false, error: 'Unauthorized. Khóa bảo mật Cron Trigger không hợp lệ.' }, 401);
    }
    const result = await handleCronSlaScan(c.env);
    return c.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: errorMsg }, 500);
  }
});

// Endpoint HTTP POST /api/cron/sla-check
cronRoutes.post('/sla-check', async (c) => {
  try {
    const cronSecret = c.env.CRON_SECRET || c.env.JWT_SECRET;
    const authHeader = c.req.header('X-Cron-Secret') || c.req.header('Authorization');
    if (cronSecret && (!authHeader || !authHeader.includes(cronSecret))) {
      return c.json({ success: false, error: 'Unauthorized. Khóa bảo mật Cron Trigger không hợp lệ.' }, 401);
    }
    const result = await handleCronSlaScan(c.env);
    return c.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: errorMsg }, 500);
  }
});

/**
 * CORE CRON WORKER R2 AUDIO RETENTION CLEANUP HANDLER (TODO-10)
 * Tự động quét và dọn dẹp các file ghi âm tạm trên R2 Storage (STORAGE_R2)
 * sau khi hoàn tất phiên âm STT & rà soát an sinh nhằm tuân thủ chính sách quyền riêng tư.
 */
export async function handleR2AudioRetentionClean(env: Env) {
  if (!env.STORAGE_R2) {
    return {
      success: true,
      deletedCount: 0,
      message: 'R2 storage binding (STORAGE_R2) chưa được cấu hình',
    };
  }

  try {
    // Quét các file ghi âm tạm trong R2 bucket buoc-tiep-files
    const listed = await env.STORAGE_R2.list({ prefix: 'audio-temp/' });
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const object of listed.objects) {
      if (object.uploaded.getTime() < sevenDaysAgo) {
        await env.STORAGE_R2.delete(object.key);
        deletedCount++;
      }
    }

    return {
      success: true,
      scannedCount: listed.objects.length,
      deletedCount,
      message: `Đã dọn dẹp thành công ${deletedCount} file ghi âm quá hạn retention 7 ngày trên R2 Storage`,
    };
  } catch (err: any) {
    console.error('Error during R2 audio retention cleanup:', err);
    return {
      success: false,
      error: err.message || 'Lỗi khi dọn dẹp file ghi âm R2',
    };
  }
}

// Endpoint HTTP POST /api/cron/audio-cleanup (TODO-10)
cronRoutes.post('/audio-cleanup', async (c) => {
  try {
    const cronSecret = c.env.CRON_SECRET || c.env.JWT_SECRET;
    const authHeader = c.req.header('X-Cron-Secret') || c.req.header('Authorization');
    if (cronSecret && (!authHeader || !authHeader.includes(cronSecret))) {
      return c.json({ success: false, error: 'Unauthorized. Khóa bảo mật Cron Trigger không hợp lệ.' }, 401);
    }
    const result = await handleR2AudioRetentionClean(c.env);
    return c.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: errorMsg }, 500);
  }
});

/**
 * CORE CRON WORKER OUTBOX DISPATCH HANDLER (Architecture V2 Section 13 — Outbox Pattern)
 * Quét bảng `domain_outbox` (PENDING) và publish từng event theo `outboxDispatcher.ts`.
 * Xem ghi chú kiến trúc chi tiết trong `packages/api/src/services/outboxDispatcher.ts`.
 */
cronRoutes.get('/outbox-dispatch', async (c) => {
  try {
    const cronSecret = c.env.CRON_SECRET || c.env.JWT_SECRET;
    const authHeader = c.req.header('X-Cron-Secret') || c.req.header('Authorization');
    if (cronSecret && (!authHeader || !authHeader.includes(cronSecret))) {
      return c.json({ success: false, error: 'Unauthorized. Khóa bảo mật Cron Trigger không hợp lệ.' }, 401);
    }
    const result = await dispatchPendingOutboxEvents(c.env);
    return c.json({ success: true, ...result });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: errorMsg }, 500);
  }
});

cronRoutes.post('/outbox-dispatch', async (c) => {
  try {
    const cronSecret = c.env.CRON_SECRET || c.env.JWT_SECRET;
    const authHeader = c.req.header('X-Cron-Secret') || c.req.header('Authorization');
    if (cronSecret && (!authHeader || !authHeader.includes(cronSecret))) {
      return c.json({ success: false, error: 'Unauthorized. Khóa bảo mật Cron Trigger không hợp lệ.' }, 401);
    }
    const result = await dispatchPendingOutboxEvents(c.env);
    return c.json({ success: true, ...result });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: errorMsg }, 500);
  }
});

/**
 * CORE CRON WORKER OUTBOX RETENTION CLEANUP HANDLER
 * Xoá các dòng `domain_outbox` đã FAILED quá 30 ngày để tránh phình bảng vô thời hạn.
 */
cronRoutes.post('/outbox-prune', async (c) => {
  try {
    const cronSecret = c.env.CRON_SECRET || c.env.JWT_SECRET;
    const authHeader = c.req.header('X-Cron-Secret') || c.req.header('Authorization');
    if (cronSecret && (!authHeader || !authHeader.includes(cronSecret))) {
      return c.json({ success: false, error: 'Unauthorized. Khóa bảo mật Cron Trigger không hợp lệ.' }, 401);
    }
    const result = await pruneStaleFailedOutboxEvents(c.env);
    return c.json({ success: true, ...result });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: errorMsg }, 500);
  }
});

