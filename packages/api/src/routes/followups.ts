import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { Env } from '../bindings';
import { createDatabaseClient, followUps } from '@buoc-tiep/database';
import { CreateFollowupSchema, isValidFollowUpStatusTransition } from '@buoc-tiep/shared';

export const followupRoutes = new Hono<{ Bindings: Env }>();

// GET /api/followups - Lấy danh sách nhiệm vụ cần hỏi thăm
followupRoutes.get('/', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const result = await db.select().from(followUps).all();
  return c.json({ success: true, data: result });
});

// POST /api/followups - Tạo mới hoặc ghi nhận nhật ký hỏi thăm
followupRoutes.post('/', async (c) => {
  const rawBody = await c.req.json().catch(() => ({}));
  const validationResult = CreateFollowupSchema.safeParse(rawBody);
  if (!validationResult.success) {
    return c.json({ success: false, error: 'Validation failed', details: validationResult.error.format() }, 400);
  }
  const body = validationResult.data;
  const db = createDatabaseClient(c.env.DB);
  const newId = `flw-${crypto.randomUUID()}`;

  await db.insert(followUps).values({
    id: newId,
    caseId: body.caseId || 'case-lan-hoc-mon',
    actionType: body.actionType || 'call',
    notes: body.notes || 'Hỏi thăm tình hình đời sống & sức khỏe',
    status: body.status || 'completed',
    dueDate: body.dueDate || new Date().toISOString().slice(0, 10),
  });

  return c.json({
    success: true,
    id: newId,
    message: 'Đã lưu nhật ký hỏi thăm thành công'
  }, 201);
});

// PATCH /api/followups/:id - Cập nhật trạng thái và nội dung nhật ký hỏi thăm
followupRoutes.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const rawBody = await c.req.json().catch(() => ({}));
    const validationResult = CreateFollowupSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return c.json({ success: false, error: 'Validation failed', details: validationResult.error.format() }, 400);
    }
    const body = validationResult.data;
    const db = createDatabaseClient(c.env.DB);

    const existing = await db.select().from(followUps).where(eq(followUps.id, id)).get();

    if (existing && existing.status && body.status) {
      if (!isValidFollowUpStatusTransition(existing.status, body.status)) {
        return c.json({
          success: false,
          error: `Chuyển trạng thái follow-up không hợp lệ từ '${existing.status}' sang '${body.status}'`
        }, 400);
      }
    }


    const newStatus = body.status || 'completed';
    const newNotes = body.notes !== undefined ? body.notes : (existing?.notes || 'Đã thực hiện cuộc gọi theo dõi');
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

    if (existing) {
      await db.update(followUps)
        .set({
          status: newStatus as any,
          notes: newNotes,
          completedAt: completedAt || existing.completedAt,
        })
        .where(eq(followUps.id, id));
    } else {
      // Upsert/Insert if dynamic ID or non-existent in D1 yet
      await db.insert(followUps).values({
        id,
        caseId: body.caseId || null,
        passportId: body.passportId || null,
        socialWorkerId: body.socialWorkerId || null,
        assignedTo: body.assignedTo || null,
        actionType: body.actionType || 'call',
        notes: newNotes,
        status: newStatus as any,
        dueDate: body.dueDate || new Date().toISOString().slice(0, 10),
        completedAt,
      });
    }

    return c.json({
      success: true,
      id,
      status: newStatus,
      notes: newNotes,
      message: 'Đã cập nhật nhật ký theo dõi ca vào Cloudflare D1 thành công!'
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Lỗi cập nhật D1 follow_ups' }, 500);
  }
});
