import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { Env } from '../bindings';
import { AuthContext } from '../middleware/auth';
import {
  createDatabaseClient,
  cases,
  beneficiaries,
  safeguardingAssessments,
  safeguardingFlags,
  escalations,
  auditLogs,
  timelineEvents,
} from '@buoc-tiep/database';
import { RBACMatrix } from '@buoc-tiep/shared';

export const safeguardingRoutes = new Hono<{ Bindings: Env; Variables: { user?: AuthContext } }>();

// 1. GET /api/v1/safeguarding/queue - Danh sách hàng đợi thẩm định an toàn bảo vệ trẻ em & sự cố nguy cơ
safeguardingRoutes.get('/queue', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');

  const access = RBACMatrix.evaluateAccess('SAFEGUARDING', 'READ', {
    actorId: user?.userId,
    actorRole: user?.role || 'SAFEGUARDING_REVIEWER',
  });

  if (!access.granted) {
    return c.json({ error: { code: 'ACCESS_DENIED', message: access.reason || 'Quyền truy cập bị từ chối' } }, 403);
  }

  const pendingFlags = await db
    .select({
      id: safeguardingFlags.id,
      caseId: safeguardingFlags.caseId,
      reportedBy: safeguardingFlags.reportedBy,
      reason: safeguardingFlags.reason,
      severity: safeguardingFlags.severity,
      status: safeguardingFlags.status,
      escalatedTo111: safeguardingFlags.escalatedTo111,
      createdAt: safeguardingFlags.createdAt,
      aliasName: beneficiaries.aliasName,
      isMinor: beneficiaries.isMinor,
      birthYear: beneficiaries.birthYear,
      currentArea: beneficiaries.currentArea,
      vulnerabilityGroup: beneficiaries.vulnerabilityGroup,
    })
    .from(safeguardingFlags)
    .innerJoin(cases, eq(safeguardingFlags.caseId, cases.id))
    .innerJoin(beneficiaries, eq(cases.beneficiaryId, beneficiaries.id))
    .where(eq(safeguardingFlags.status, 'open'))
    .all();

  return c.json({
    data: pendingFlags.map((item) => ({
      id: item.id,
      caseId: item.caseId,
      aliasName: item.aliasName,
      isMinor: Boolean(item.isMinor),
      birthYear: item.birthYear,
      currentArea: item.currentArea,
      vulnerabilityGroup: item.vulnerabilityGroup,
      reason: item.reason,
      severity: item.severity,
      status: item.status,
      escalatedTo111: Boolean(item.escalatedTo111),
      reportedAt: item.createdAt,
    })),
    meta: { pendingCount: pendingFlags.length, queueType: 'CHILD_SAFEGUARDING_AND_HIGH_RISK' }
  });
});

// 2. GET /api/v1/safeguarding/cases/:caseId - Chi tiết đánh giá an toàn của 1 ca
safeguardingRoutes.get('/cases/:caseId', async (c) => {
  const caseId = c.req.param('caseId');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');

  const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).get();
  if (!caseItem) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ ca' } }, 404);
  }

  const beneficiary = await db.select().from(beneficiaries).where(eq(beneficiaries.id, caseItem.beneficiaryId)).get();
  const flags = await db.select().from(safeguardingFlags).where(eq(safeguardingFlags.caseId, caseId)).all();
  const assessments = await db.select().from(safeguardingAssessments).where(eq(safeguardingAssessments.caseId, caseId)).all();
  const caseEscalations = await db.select().from(escalations).where(eq(escalations.caseId, caseId)).all();

  return c.json({
    data: {
      caseId,
      aliasName: beneficiary?.aliasName,
      isMinor: Boolean(beneficiary?.isMinor),
      birthYear: beneficiary?.birthYear,
      riskLevel: caseItem.riskLevel,
      safeguardingFlags: flags,
      assessments,
      escalations: caseEscalations,
    },
    meta: {}
  });
});

// 3. POST /api/v1/safeguarding/cases/:caseId/review - Thẩm định nhân sự / Phê duyệt đánh giá an toàn
safeguardingRoutes.post('/cases/:caseId/review', async (c) => {
  const caseId = c.req.param('caseId');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const { decision, notes, riskLevel } = body;
  const validDecisions = [
    'PROCEED',
    'PROCEED_WITH_CAUTION',
    'MORE_INFORMATION_REQUIRED',
    'HUMAN_REVIEW_REQUIRED',
    'MANDATORY_ESCALATION',
    'DO_NOT_APPROACH',
  ];

  if (!decision || !validDecisions.includes(decision)) {
    return c.json({ error: { code: 'INVALID_DECISION', message: `Quyết định không hợp lệ. Phải là một trong: ${validDecisions.join(', ')}` } }, 400);
  }

  const nowStr = new Date().toISOString();
  const assessmentId = `sga-${crypto.randomUUID()}`;

  const queries: any[] = [
    db.insert(safeguardingAssessments).values({
      id: assessmentId,
      caseId,
      beneficiaryIsChild: Boolean(body.beneficiaryIsChild),
      riskLevel: riskLevel || 'LOW',
      decision,
      reviewerId: user?.userId || 'usr-reviewer-default',
      reviewedAt: nowStr,
      notes: notes || 'Thẩm định viên hoàn tất đánh giá rủi ro an toàn',
    }),
    db.update(cases).set({
      riskLevel: riskLevel || 'LOW',
      status: decision === 'MANDATORY_ESCALATION' ? 'ESCALATED' : undefined,
    }).where(eq(cases.id, caseId)),
    db.insert(auditLogs).values({
      id: `audit-${crypto.randomUUID()}`,
      userId: user?.userId || 'usr-reviewer-default',
      action: 'SAFEGUARDING_ASSESSMENT_COMPLETED',
      resourceType: 'safeguarding_assessments',
      resourceId: assessmentId,
      metadata: JSON.stringify({ decision, riskLevel, notes }),
      createdAt: nowStr,
    }),
    db.insert(timelineEvents).values({
      id: `tle-${crypto.randomUUID()}`,
      caseId,
      actorId: user?.userId || 'usr-reviewer-default',
      eventType: 'safeguarding_reviewed',
      title: `Thẩm định an toàn: ${decision}`,
      description: notes || `Đã hoàn tất thẩm định bảo vệ với quyết định ${decision}`,
      eventDate: nowStr,
    }),
  ];

  await db.batch(queries as any);

  return c.json({
    data: { id: assessmentId, caseId, decision, riskLevel, reviewedAt: nowStr },
    meta: { message: 'Đã lưu kết quả thẩm định an toàn thành công' }
  });
});

// 4. POST /api/v1/safeguarding/cases/:caseId/escalate - Kích hoạt leo thang an toàn khẩn cấp (Hotline 111 / Cơ quan chức năng)
safeguardingRoutes.post('/cases/:caseId/escalate', async (c) => {
  const caseId = c.req.param('caseId');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const { reason, level, actionTakenSummary } = body;
  const escalationLevel = level || 'HOTLINE_111';
  const nowStr = new Date().toISOString();
  const escalationId = `esc-${crypto.randomUUID()}`;

  const queries: any[] = [
    db.insert(escalations).values({
      id: escalationId,
      caseId,
      reason: reason || 'Báo động nguy cơ bạo lực / bóc lột trẻ em',
      level: escalationLevel,
      status: 'PENDING',
      escalatedBy: user?.userId || 'usr-reviewer-default',
      actionTakenSummary: actionTakenSummary || 'Đã kết nối với đường dây nóng khẩn cấp',
      createdAt: nowStr,
    }),
    db.update(cases).set({
      status: 'ESCALATED',
      riskLevel: 'CRITICAL',
    }).where(eq(cases.id, caseId)),
    db.insert(auditLogs).values({
      id: `audit-${crypto.randomUUID()}`,
      userId: user?.userId || 'usr-reviewer-default',
      action: 'SAFEGUARDING_ESCALATION_TRIGGERED',
      resourceType: 'escalations',
      resourceId: escalationId,
      metadata: JSON.stringify({ escalationLevel, reason }),
      createdAt: nowStr,
    }),
    db.insert(timelineEvents).values({
      id: `tle-${crypto.randomUUID()}`,
      caseId,
      actorId: user?.userId || 'usr-reviewer-default',
      eventType: 'safeguarding_escalated',
      title: `Báo động leo thang khẩn cấp: ${escalationLevel}`,
      description: reason || 'Kích hoạt can thiệp bảo vệ khẩn cấp',
      eventDate: nowStr,
    }),
  ];

  await db.batch(queries as any);

  return c.json({
    data: {
      id: escalationId,
      caseId,
      level: escalationLevel,
      status: 'PENDING',
      reason,
      escalatedAt: nowStr,
    },
    meta: { notice: 'Ca đã được chuyển sang trạng thái ESCALATED. Toàn bộ luồng tạo việc làm bị khóa hoàn toàn.' }
  });
});

// 5. POST /api/v1/safeguarding/incidents/:id/resolve - Đóng / Xử lý hoàn tất sự cố an toàn
safeguardingRoutes.post('/incidents/:id/resolve', async (c) => {
  const id = c.req.param('id');
  const db = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const nowStr = new Date().toISOString();
  const actionTakenSummary = body.actionTakenSummary || body.notes || 'Đã xử lý và đảm bảo an toàn cho đối tượng';

  await db.batch([
    db.update(escalations).set({
      status: 'RESOLVED',
      resolvedBy: user?.userId || 'usr-reviewer-default',
      resolvedAt: nowStr,
      actionTakenSummary,
    }).where(eq(escalations.id, id)),
    db.insert(auditLogs).values({
      id: `audit-${crypto.randomUUID()}`,
      userId: user?.userId || 'usr-reviewer-default',
      action: 'SAFEGUARDING_INCIDENT_RESOLVED',
      resourceType: 'escalations',
      resourceId: id,
      metadata: JSON.stringify({ actionTakenSummary, resolvedAt: nowStr }),
      createdAt: nowStr,
    }),
  ]);

  return c.json({
    data: { id, status: 'RESOLVED', resolvedAt: nowStr, actionTakenSummary },
    meta: { message: 'Đã giải quyết sự cố bảo vệ an toàn thành công' }
  });
});
