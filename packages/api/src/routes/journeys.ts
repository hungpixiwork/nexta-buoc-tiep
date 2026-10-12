import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { Env } from '../bindings';
import { createDatabaseClient, journeys, users } from '@buoc-tiep/database';

import { CreateJourneySchema } from '@buoc-tiep/shared';

export const journeyRoutes = new Hono<{ Bindings: Env }>();

// POST /api/journeys - Khởi tạo chuyến đi mới
journeyRoutes.post('/', async (c) => {
  const rawBody = await c.req.json().catch(() => ({}));
  const validationResult = CreateJourneySchema.safeParse(rawBody);
  if (!validationResult.success) {
    return c.json({ success: false, error: 'Validation failed', details: validationResult.error.format() }, 400);
  }
  const body = validationResult.data;
  const db = createDatabaseClient(c.env.DB);
  const journeyId = `jrn-${crypto.randomUUID()}`;

  await db.insert(journeys).values({
    id: journeyId,
    organizationId: body.organizationId || 'org-buoctiep-vn',
    teamId: body.teamId || 'team-hoc-mon',
    title: body.title,
    locationName: body.locationName,
    scheduledDate: body.scheduledDate,
    status: 'planned',
    notes: body.notes || null,
  });

  return c.json({
    success: true,
    id: journeyId,
    status: 'planned',
    message: 'Khởi tạo chuyến đi mới thành công'
  }, 201);
});

// GET /api/journeys/today - Chuyến đi hôm nay
journeyRoutes.get('/today', async (c) => {

  const db = createDatabaseClient(c.env.DB);
  const todayDate = new Date().toISOString().slice(0, 10);
  const organizationId = c.req.query('organizationId');

  const conditions = [eq(journeys.scheduledDate, todayDate)];
  if (organizationId) {
    conditions.push(eq(journeys.organizationId, organizationId));
  }

  const todayJourney = await db.select().from(journeys).where(and(...conditions)).get();

  if (!todayJourney) {
    // Return structured default active journey
    return c.json({
      success: true,
      data: {
        id: 'jrn-hoc-mon-today',
        title: 'Chuyến đi chiều nay — Hóc Môn',
        locationName: 'Thị trấn Hóc Môn, TP.HCM',
        scheduledDate: todayDate,
        status: 'planned',
        notes: 'Tiếp cận người lao động đêm & người cao tuổi neo đơn',
        participantsCount: 8,
      }
    });
  }

  return c.json({ success: true, data: todayJourney });
});

// GET /api/journeys/:id - Chi tiết chuyến đi
journeyRoutes.get('/:id', async (c) => {
  const journeyId = c.req.param('id');
  const organizationId = c.req.query('organizationId');
  const db = createDatabaseClient(c.env.DB);

  const conditions = [eq(journeys.id, journeyId)];
  if (organizationId) {
    conditions.push(eq(journeys.organizationId, organizationId));
  }

  const journey = await db.select().from(journeys).where(and(...conditions)).get();

  if (!journey) {
    return c.json({ success: false, error: 'Không tìm thấy chuyến đi' }, 404);
  }

  return c.json({ success: true, data: journey });
});

// POST /api/journeys/:id/start - Kích hoạt bắt đầu chuyến đi
journeyRoutes.post('/:id/start', async (c) => {
  try {
    const journeyId = c.req.param('id');
    const db = createDatabaseClient(c.env.DB);
    const body = await c.req.json().catch(() => ({}));
    const startedAt = new Date().toISOString();

    const existing = await db.select().from(journeys).where(eq(journeys.id, journeyId)).get();

    if (existing) {
      await db.update(journeys)
        .set({ status: 'in_progress', notes: body.notes || existing.notes })
        .where(eq(journeys.id, journeyId));
    } else {
      // Direct insert for new / mock journey ID (e.g. jrn-hoc-mon-today)
      await db.insert(journeys).values({
        id: journeyId,
        organizationId: body.organizationId || 'org-buoctiep-vn',
        teamId: body.teamId || 'team-hoc-mon',
        title: body.title || 'Chuyến đi chiều nay — Hóc Môn',
        locationName: body.locationName || 'Thị trấn Hóc Môn, TP.HCM',
        scheduledDate: startedAt.slice(0, 10),
        status: 'in_progress',
        notes: body.notes || 'Tiếp cận người lao động đêm & người cao tuổi neo đơn',
      });
    }

    return c.json({
      success: true,
      journeyId,
      status: 'in_progress',
      startedAt,
      message: 'Đã bắt đầu chuyến đi hiện trường và cập nhật trạng thái vào Cloudflare D1!'
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Lỗi cập nhật D1 chuyến đi' }, 500);
  }
});

// GET /api/journeys/:id/participants - Danh sách tình nguyện viên cùng đi
journeyRoutes.get('/:id/participants', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const organizationId = c.req.query('organizationId');

  let allUsers;
  if (organizationId) {
    allUsers = await db.select().from(users).where(eq(users.organizationId, organizationId)).all();
  } else {
    allUsers = await db.select().from(users).all();
  }
  
  return c.json({
    success: true,
    participants: allUsers.map(u => ({
      id: u.id,
      fullName: u.fullName,
      role: u.role,
      status: 'active'
    }))
  });
});
