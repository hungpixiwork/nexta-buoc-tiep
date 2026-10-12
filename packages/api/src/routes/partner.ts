import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { Env } from '../bindings';
import { AuthContext } from '../middleware/auth';
import {
  createDatabaseClient,
  referrals,
  referralEvents,
  referralPartnerSnapshots,
  cases,
  beneficiaries,
  resources,
  organizations,
  resourceCapacityChecks,
  auditLogs,
} from '@buoc-tiep/database';
import { RBACMatrix } from '@buoc-tiep/shared';

export const partnerRoutes = new Hono<{ Bindings: Env; Variables: { user?: AuthContext } }>();

// 1. GET /api/v1/partner/referrals - Danh sách đơn chuyển tuyến gửi đến Partner (Dữ liệu tối thiểu)
partnerRoutes.get('/referrals', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');

  // RBAC Check
  const access = RBACMatrix.evaluateAccess('REFERRAL', 'READ', {
    actorId: user?.userId,
    actorRole: user?.role || 'PARTNER',
    actorPartnerId: user?.organizationId,
  });

  if (!access.granted) {
    return c.json({ error: { code: 'ACCESS_DENIED', message: access.reason || 'Quyền truy cập bị từ chối' } }, 403);
  }

  const partnerOrgId = user?.organizationId;
  const conditions: any[] = [];
  if (partnerOrgId && user?.role !== 'admin') {
    conditions.push(eq(referrals.partnerId, partnerOrgId));
  }

  const query = db.select().from(referrals);
  const results = conditions.length > 0 ? await query.where(and(...conditions)).all() : await query.all();

  // Sanitize to Minimum Necessary Information
  const sanitized = results.map((r) => {
    let payload: any = {};
    try {
      payload = r.payloadJson ? JSON.parse(r.payloadJson as string) : {};
    } catch {}

    return {
      id: r.id,
      caseId: r.caseId,
      type: r.type,
      status: r.status,
      aliasName: payload.aliasName || 'Người thụ hưởng',
      district: payload.district || 'TP.HCM',
      urgency: payload.urgency || 'MEDIUM',
      notes: r.notes || payload.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  });

  return c.json({ data: sanitized, meta: { total: sanitized.length, classification: 'MINIMUM_NECESSARY' } });
});

// 2. GET /api/v1/partner/referrals/:id - Chi tiết 1 referral gửi đến Partner
partnerRoutes.get('/referrals/:id', async (c) => {
  const id = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');

  const referral = await db.select().from(referrals).where(eq(referrals.id, id)).get();
  if (!referral) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ chuyển tuyến' } }, 404);
  }

  const access = RBACMatrix.evaluateAccess('REFERRAL', 'READ', {
    actorId: user?.userId,
    actorRole: user?.role || 'PARTNER',
    actorPartnerId: user?.organizationId,
    referralPartnerId: referral.partnerId || undefined,
  });

  if (!access.granted) {
    return c.json({ error: { code: 'ACCESS_DENIED', message: access.reason } }, 403);
  }

  let payload: any = {};
  try {
    payload = referral.payloadJson ? JSON.parse(referral.payloadJson as string) : {};
  } catch {}

  const snapshot = await db.select().from(referralPartnerSnapshots).where(eq(referralPartnerSnapshots.referralId, id)).get();

  return c.json({
    data: {
      id: referral.id,
      caseId: referral.caseId,
      type: referral.type,
      status: referral.status,
      aliasName: payload.aliasName || 'Người thụ hưởng',
      district: payload.district || 'TP.HCM',
      urgency: payload.urgency || 'MEDIUM',
      observedFacts: payload.observedFacts || [],
      notes: referral.notes || payload.notes,
      createdAt: referral.createdAt,
      acceptedAt: referral.acceptedAt,
      actionTakenAt: referral.actionTakenAt,
      partnerSnapshot: snapshot || null,
    },
    meta: { classification: 'MINIMUM_NECESSARY' }
  });
});

// 3. POST /api/v1/partner/referrals/:id/accept - Partner chấp nhận tiếp nhận ca
partnerRoutes.post('/referrals/:id/accept', async (c) => {
  const id = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const referral = await db.select().from(referrals).where(eq(referrals.id, id)).get();
  if (!referral) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ chuyển tuyến' } }, 404);
  }

  const nowStr = new Date().toISOString();
  await db.batch([
    db.update(referrals).set({
      status: 'ACCEPTED',
      acceptedAt: nowStr,
      notes: body.notes || referral.notes,
      updatedAt: nowStr,
    }).where(eq(referrals.id, id)),
    db.insert(referralEvents).values({
      id: `refe-${crypto.randomUUID()}`,
      referralId: id,
      caseId: referral.caseId,
      eventType: 'ACCEPTED',
      actorId: user?.userId || 'usr-partner-default',
      metadataJson: JSON.stringify({ notes: body.notes, acceptedAt: nowStr }),
      createdAt: nowStr,
    }),
  ]);

  return c.json({ data: { id, status: 'ACCEPTED', acceptedAt: nowStr }, meta: {} });
});

// 4. POST /api/v1/partner/referrals/:id/decline - Partner từ chối tiếp nhận ca (quá tải / không phù hợp)
partnerRoutes.post('/referrals/:id/decline', async (c) => {
  const id = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const referral = await db.select().from(referrals).where(eq(referrals.id, id)).get();
  if (!referral) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ chuyển tuyến' } }, 404);
  }

  const declineReason = body.reason || body.declineReason || 'Đối tác quá tải / Tạm ngưng tiếp nhận';
  const nowStr = new Date().toISOString();

  await db.batch([
    db.update(referrals).set({
      status: 'DECLINED',
      declinedAt: nowStr,
      declineReason,
      updatedAt: nowStr,
    }).where(eq(referrals.id, id)),
    db.insert(referralEvents).values({
      id: `refe-${crypto.randomUUID()}`,
      referralId: id,
      caseId: referral.caseId,
      eventType: 'DECLINED',
      actorId: user?.userId || 'usr-partner-default',
      metadataJson: JSON.stringify({ declineReason, declinedAt: nowStr }),
      createdAt: nowStr,
    }),
  ]);

  return c.json({
    data: { id, status: 'DECLINED', declineReason, declinedAt: nowStr },
    meta: { notice: 'Ca hỗ trợ vẫn mở để Điều phối viên định tuyến nguồn lực thay thế (Scenario 02)' }
  });
});

// 5. POST /api/v1/partner/referrals/:id/action - Partner đánh dấu đã thực hiện hành động hỗ trợ
partnerRoutes.post('/referrals/:id/action', async (c) => {
  const id = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const referral = await db.select().from(referrals).where(eq(referrals.id, id)).get();
  if (!referral) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ chuyển tuyến' } }, 404);
  }

  const actionSummary = body.actionSummary || body.notes || 'Đã thực hiện dịch vụ an sinh cho người thụ hưởng';
  const nowStr = new Date().toISOString();

  await db.batch([
    db.update(referrals).set({
      status: 'ACTION_TAKEN',
      actionTakenAt: nowStr,
      outcome: actionSummary,
      updatedAt: nowStr,
    }).where(eq(referrals.id, id)),
    db.insert(referralEvents).values({
      id: `refe-${crypto.randomUUID()}`,
      referralId: id,
      caseId: referral.caseId,
      eventType: 'ACTION_TAKEN',
      actorId: user?.userId || 'usr-partner-default',
      metadataJson: JSON.stringify({ actionSummary, actionTakenAt: nowStr }),
      createdAt: nowStr,
    }),
  ]);

  return c.json({ data: { id, status: 'ACTION_TAKEN', actionTakenAt: nowStr, actionSummary }, meta: {} });
});

// 6. GET /api/v1/partner/capacity & PUT /api/v1/partner/capacity - Quản lý năng lực tiếp nhận
partnerRoutes.get('/capacity', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const partnerOrgId = user?.organizationId || c.req.query('organizationId') || 'org-default';

  const partnerResources = await db.select().from(resources).where(eq(resources.organizationId, partnerOrgId)).all();

  return c.json({
    data: partnerResources.map((r) => ({
      resourceId: r.id,
      resourceName: r.name,
      capacityStatus: r.capacityStatus,
      capacityCheckedAt: r.capacityCheckedAt,
      verificationStatus: r.verificationStatus,
      verificationExpiresAt: r.verificationExpiresAt,
    })),
    meta: { organizationId: partnerOrgId }
  });
});

partnerRoutes.put('/capacity', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const { resourceId, capacityStatus, slotsAvailable, notes } = body;
  if (!resourceId || !capacityStatus) {
    return c.json({ error: { code: 'INVALID_INPUT', message: 'resourceId và capacityStatus là bắt buộc' } }, 400);
  }

  const nowStr = new Date().toISOString();
  await db.batch([
    db.update(resources).set({
      capacityStatus,
      capacityCheckedAt: nowStr,
    }).where(eq(resources.id, resourceId)),
    db.insert(resourceCapacityChecks).values({
      id: `rcc-${crypto.randomUUID()}`,
      resourceId,
      capacityStatus,
      slotsAvailable: slotsAvailable ? Number(slotsAvailable) : null,
      notes: notes || 'Cập nhật trực tiếp từ Partner Portal',
      checkedBy: user?.userId || 'usr-partner-default',
      checkedAt: nowStr,
    }),
  ]);

  return c.json({
    data: { resourceId, capacityStatus, capacityCheckedAt: nowStr, slotsAvailable },
    meta: { message: 'Đã cập nhật năng lực tiếp nhận đối tác thành công' }
  });
});
