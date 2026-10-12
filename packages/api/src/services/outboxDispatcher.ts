import { eq, asc, and, lt } from 'drizzle-orm';
import { Env } from '../bindings';
import { createDatabaseClient, domainOutbox } from '@buoc-tiep/database';
import { resolveQueueForEventType } from '@buoc-tiep/shared';
import { notifyReferralTransition, ReferralTransitionEvent } from './notificationService';

/**
 * outboxDispatcher — Transactional Outbox Pattern dispatcher
 * (Architecture V2 Section 13 — Outbox Pattern, Section 12 — Queue Architecture).
 *
 * `packages/database/src/schema/index.ts` (bảng `domain_outbox`) ghi các domain event
 * trong CÙNG D1 transaction/batch với thao tác mutate aggregate (cases, referrals, ...),
 * đảm bảo "D1 write succeeds but queue send fails" không bao giờ làm mất sự kiện nghiệp vụ.
 *
 * Dispatcher này (được gọi định kỳ qua `/api/cron/outbox-dispatch`, xem `routes/cron.ts`)
 * quét các dòng PENDING và publish chúng đi.
 *
 * GHI CHÚ KIẾN TRÚC QUAN TRỌNG (giống `notificationService.ts`):
 * - `packages/api/wrangler.jsonc` HIỆN CHƯA có Cloudflare Queues binding. Vòng lặp đầy đủ
 *   "domain event → Queue → consumer Worker" theo đúng Section 12 KHÔNG nằm trong phạm vi
 *   MVP hiện tại. Dispatcher này publish trực tiếp (rút gọn MVP hợp lệ) tới đúng side-effect
 *   handler tương ứng với queue đích (`resolveQueueForEventType`), ngay trong cùng request:
 *     - CASE_EVENTS / REFERRAL_EVENTS → best-effort realtime broadcast qua
 *       `notifyReferralTransition` (PartnerInboxRoom) khi payload có đủ trường cần thiết.
 *     - Các queue khác (AI_JOBS, RESOURCE_JOBS, NOTIFICATION_JOBS, ANALYTICS_EVENTS,
 *       RETENTION_JOBS) hiện chưa có consumer riêng — event vẫn được đánh dấu PUBLISHED
 *       (đã "rời khỏi" Outbox thành công) để không chặn các event khác trong hàng đợi;
 *       khuyến nghị nâng cấp: thay đoạn `default` bằng lời gọi Queue Consumer thật khi
 *       Cloudflare Queues binding được provision.
 * - Mỗi dòng được xử lý độc lập (try/catch riêng) — một event lỗi không được chặn cả batch.
 * - `attempt_count` tăng dần; sau `MAX_ATTEMPTS` lần thất bại liên tiếp, event được đánh dấu
 *   FAILED để dừng retry vô hạn và cần can thiệp thủ công/điều tra.
 */

const DEFAULT_BATCH_SIZE = 25;
const MAX_ATTEMPTS = 5;

export interface OutboxDispatchResult {
  scanned: number;
  published: number;
  failed: number;
  skipped: number;
}

interface ReferralTransitionPayload {
  referralId: string;
  caseId: string;
  organisationId: string;
  fromStatus: string | null;
  toStatus: string;
  actorId: string;
  actorType?: ReferralTransitionEvent['actorType'];
  reason?: string;
  correlationId?: string;
  occurredAt?: string;
}

function isReferralTransitionPayload(payload: unknown): payload is ReferralTransitionPayload {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p.referralId === 'string' &&
    typeof p.caseId === 'string' &&
    typeof p.organisationId === 'string' &&
    typeof p.toStatus === 'string' &&
    typeof p.actorId === 'string'
  );
}

/**
 * Publish một dòng domain_outbox theo đúng queue đích (`resolveQueueForEventType`).
 * Trả về true nếu event đã được publish thành công (hoặc xác nhận không có consumer
 * nào cần xử lý thêm), false nếu cần retry ở lần quét tiếp theo.
 */
async function publishOutboxEvent(
  env: Env,
  eventType: string,
  payload: unknown
): Promise<{ delivered: boolean; reason?: string }> {
  const queue = resolveQueueForEventType(eventType);

  switch (queue) {
    case 'case-events':
    case 'referral-events': {
      if (!isReferralTransitionPayload(payload)) {
        // Payload không đủ trường cho realtime broadcast (vd: CASE.CREATED không có
        // organisationId đích) — vẫn coi là "published" vì không có consumer bắt buộc.
        return { delivered: true, reason: 'Không cần realtime broadcast (payload thiếu trường route).' };
      }
      const result = await notifyReferralTransition(env, {
        referralId: payload.referralId,
        caseId: payload.caseId,
        organisationId: payload.organisationId,
        fromStatus: payload.fromStatus,
        toStatus: payload.toStatus,
        actorId: payload.actorId,
        actorType: payload.actorType,
        reason: payload.reason,
        correlationId: payload.correlationId,
        occurredAt: payload.occurredAt,
      });
      // Realtime chỉ là optimisation (Section 25) — D1 remains truth, nên dù broadcast
      // thất bại (DO chưa provision, mạng lỗi...), event vẫn coi là "đã xử lý xong" ở
      // tầng Outbox để không retry vô hạn một kênh phụ trợ không bắt buộc.
      return { delivered: true, reason: result.reason };
    }
    case 'ai-jobs':
    case 'resource-jobs':
    case 'notification-jobs':
    case 'analytics-events':
    case 'retention-jobs':
    default:
      // Chưa có Queue Consumer Worker riêng cho các domain này trong hạ tầng hiện tại.
      // Đánh dấu published để tránh chặn hàng đợi; xem ghi chú nâng cấp ở đầu file.
      return { delivered: true, reason: `Chưa có consumer cho queue '${queue}' (MVP fallback).` };
  }
}

/**
 * Quét tối đa `batchSize` dòng `domain_outbox` đang PENDING, publish từng dòng, và cập
 * nhật status/attempt_count/published_at tương ứng. An toàn để gọi lặp lại (idempotent
 * theo từng dòng: một dòng đã PUBLISHED sẽ không bị quét lại).
 */
export async function dispatchPendingOutboxEvents(
  env: Env,
  batchSize: number = DEFAULT_BATCH_SIZE
): Promise<OutboxDispatchResult> {
  const db = createDatabaseClient(env.DB);

  const pendingRows = await db
    .select()
    .from(domainOutbox)
    .where(eq(domainOutbox.status, 'PENDING'))
    .orderBy(asc(domainOutbox.createdAt))
    .limit(batchSize)
    .all();

  const result: OutboxDispatchResult = {
    scanned: pendingRows.length,
    published: 0,
    failed: 0,
    skipped: 0,
  };

  for (const row of pendingRows) {
    try {
      let payload: unknown;
      try {
        payload = JSON.parse(row.payloadJson);
      } catch {
        payload = undefined;
      }

      const { delivered } = await publishOutboxEvent(env, row.eventType, payload);
      const nowIso = new Date().toISOString();

      if (delivered) {
        await db
          .update(domainOutbox)
          .set({ status: 'PUBLISHED', publishedAt: nowIso, attemptCount: row.attemptCount + 1 })
          .where(eq(domainOutbox.id, row.id));
        result.published++;
      } else {
        result.skipped++;
      }
    } catch (err: unknown) {
      // Một event lỗi không được chặn các event khác trong batch.
      const nextAttemptCount = row.attemptCount + 1;
      const nextStatus = nextAttemptCount >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING';
      console.error(
        `[outboxDispatcher] Lỗi xử lý event ${row.id} (${row.eventType}), lần thử ${nextAttemptCount}:`,
        err instanceof Error ? err.message : err
      );
      await db
        .update(domainOutbox)
        .set({ attemptCount: nextAttemptCount, status: nextStatus })
        .where(eq(domainOutbox.id, row.id));
      if (nextStatus === 'FAILED') {
        result.failed++;
      } else {
        result.skipped++;
      }
    }
  }

  return result;
}

/**
 * Dọn các dòng FAILED quá cũ (> 30 ngày) để tránh phình bảng `domain_outbox` vô thời hạn.
 * Chỉ xoá các event đã FAILED — PENDING/PUBLISHED không bao giờ bị đụng tới ở đây.
 */
export async function pruneStaleFailedOutboxEvents(env: Env): Promise<{ deletedCount: number }> {
  const db = createDatabaseClient(env.DB);
  const cutoffIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const stale = await db
    .select({ id: domainOutbox.id })
    .from(domainOutbox)
    .where(and(eq(domainOutbox.status, 'FAILED'), lt(domainOutbox.createdAt, cutoffIso)))
    .all();

  if (stale.length === 0) {
    return { deletedCount: 0 };
  }

  for (const row of stale) {
    await db.delete(domainOutbox).where(eq(domainOutbox.id, row.id));
  }

  return { deletedCount: stale.length };
}
