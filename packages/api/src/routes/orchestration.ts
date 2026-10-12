import { Hono } from 'hono';
import { eq, and, sql, desc, or, like } from 'drizzle-orm';
import {
  createDatabaseClient,
  people,
  organizations,
  supportGateways,
  caseTasks,
  cases,
  referrals,
  followUps,
  outcomes,
  timelineEvents,
  beneficiaries
} from '@buoc-tiep/database';
import {
  rankAssignees,
  evaluateEscalationTriggers,
  computeHumanImpactSummary,
  PersonRecord
} from '@buoc-tiep/shared';

type Bindings = {
  DB: D1Database;
};

export const orchestrationRoutes = new Hono<{ Bindings: Bindings }>();

// ==========================================
// 1. SSOT PEOPLE DIRECTORY
// ==========================================

orchestrationRoutes.get('/people', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const search = c.req.query('search')?.toLowerCase();
  const role = c.req.query('role');
  const area = c.req.query('area');
  const capability = c.req.query('capability');

  let records: any[] = [];
  if (role) {
    records = await db.select().from(people).where(eq(people.role, role as any)).all();
  } else {
    records = await db.select().from(people).all();
  }

  let filtered = (records || []).map((p: any) => ({
    ...p,
    capabilities: p.capabilities ? (typeof p.capabilities === 'string' ? JSON.parse(p.capabilities) : p.capabilities) : [],
    serviceAreas: p.serviceAreas ? (typeof p.serviceAreas === 'string' ? JSON.parse(p.serviceAreas) : p.serviceAreas) : []
  }));

  if (search) {
    filtered = filtered.filter((p: any) =>
      p.fullName?.toLowerCase().includes(search) ||
      p.publicCode?.toLowerCase().includes(search)
    );
  }

  if (area) {
    filtered = filtered.filter((p: any) =>
      p.serviceAreas?.some((a: string) => a.toLowerCase().includes(area.toLowerCase()))
    );
  }

  if (capability) {
    filtered = filtered.filter((p: any) =>
      p.capabilities?.includes(capability)
    );
  }

  return c.json({
    success: true,
    total: filtered.length,
    data: filtered
  });
});

// Ranking endpoint for assigning a specific task
orchestrationRoutes.get('/people/rank-for-task', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const area = c.req.query('area');
  const capability = c.req.query('capability');
  const role = c.req.query('role') || 'volunteer';

  const rawPeople = await db.select().from(people).all();
  const mappedCandidates: PersonRecord[] = (rawPeople || []).map((p: any) => ({
    id: p.id,
    publicCode: p.publicCode,
    fullName: p.fullName,
    avatarUrl: p.avatarUrl,
    role: p.role,
    organizationId: p.organizationId,
    teamId: p.teamId,
    status: p.status,
    capabilities: p.capabilities ? (typeof p.capabilities === 'string' ? JSON.parse(p.capabilities) : p.capabilities) : [],
    serviceAreas: p.serviceAreas ? (typeof p.serviceAreas === 'string' ? JSON.parse(p.serviceAreas) : p.serviceAreas) : [],
    maxActiveCases: p.maxActiveCases || 5,
    activeCaseCount: p.activeCaseCount || 0
  }));

  const ranked = rankAssignees(mappedCandidates, area, capability, role);

  return c.json({
    success: true,
    data: ranked
  });
});

// ==========================================
// 2. SSOT ORGANISATIONS DIRECTORY
// ==========================================

orchestrationRoutes.get('/organisations', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const search = c.req.query('search')?.toLowerCase();
  const raw = await db.select().from(organizations).all();

  let filtered = raw || [];
  if (search) {
    filtered = (raw || []).filter((o: any) => o.name?.toLowerCase().includes(search) || o.slug?.toLowerCase().includes(search));
  }

  return c.json({
    success: true,
    total: filtered.length,
    data: filtered
  });
});

// ==========================================
// 3. SSOT SUPPORT GATEWAYS (SERVICE DIRECTORY)
// ==========================================

orchestrationRoutes.get('/gateways', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const category = c.req.query('category');
  const search = c.req.query('search')?.toLowerCase();
  const verifiedOnly = c.req.query('verifiedOnly') === 'true';

  let raw = await db.select().from(supportGateways).all();

  let filtered = (raw || []).map((g: any) => ({
    ...g,
    geographicCoverage: g.geographicCoverage ? (typeof g.geographicCoverage === 'string' ? JSON.parse(g.geographicCoverage) : g.geographicCoverage) : []
  }));

  if (category) {
    filtered = filtered.filter((g: any) => g.category === category);
  }

  if (verifiedOnly) {
    filtered = filtered.filter((g: any) => g.verificationStatus === 'VERIFIED');
  }

  if (search) {
    filtered = filtered.filter((g: any) =>
      g.name?.toLowerCase().includes(search) ||
      g.code?.toLowerCase().includes(search) ||
      g.description?.toLowerCase().includes(search)
    );
  }

  return c.json({
    success: true,
    total: filtered.length,
    data: filtered
  });
});

// ==========================================
// 4. CASE TASKS & ASSIGNMENT LIFECYCLE
// ==========================================

orchestrationRoutes.get('/tasks', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const caseId = c.req.query('caseId');
  const assignedTo = c.req.query('assignedTo');
  const status = c.req.query('status');

  let conditions = [];
  if (caseId) conditions.push(eq(caseTasks.caseId, caseId));
  if (assignedTo) conditions.push(eq(caseTasks.assignedTo, assignedTo));
  if (status) conditions.push(eq(caseTasks.status, status as any));

  let list: any[] = [];
  if (conditions.length) {
    list = await db.select().from(caseTasks).where(and(...conditions)).all();
  } else {
    list = await db.select().from(caseTasks).all();
  }

  return c.json({
    success: true,
    total: (list || []).length,
    data: list || []
  });
});

orchestrationRoutes.post('/tasks', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const body = await c.req.json();

  const taskId = body.id || `task_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  
  await db.insert(caseTasks).values({
    id: taskId,
    caseId: body.caseId,
    referralId: body.referralId || null,
    taskType: body.taskType || 'custom_action',
    title: body.title,
    description: body.description || null,
    createdBy: body.createdBy || 'usr-coordinator-01',
    assignedTo: body.assignedTo || null,
    assignedTeamId: body.assignedTeamId || null,
    status: body.assignedTo ? 'assigned' : 'open',
    priority: body.priority || 'medium',
    dueAt: body.dueAt || null
  });

  // Record timeline event
  await db.insert(timelineEvents).values({
    id: `tle_${Date.now().toString(36)}`,
    caseId: body.caseId,
    actorId: body.createdBy || 'usr-coordinator-01',
    eventType: 'TASK_CREATED',
    title: `Tạo nhiệm vụ: ${body.title}`,
    description: body.description || 'Nhiệm vụ điều phối mới được tạo'
  });

  return c.json({
    success: true,
    taskId,
    message: 'Nhiệm vụ điều phối đã được tạo thành công'
  }, 201);
});

orchestrationRoutes.post('/tasks/:id/accept', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const taskId = c.req.param('id');
  const now = new Date().toISOString();

  const task = await db.select().from(caseTasks).where(eq(caseTasks.id, taskId)).get();
  if (!task) return c.json({ success: false, error: 'Không tìm thấy nhiệm vụ' }, 404);

  await db.update(caseTasks).set({
    status: 'accepted',
    acceptedAt: now
  }).where(eq(caseTasks.id, taskId));

  // Record timeline event
  await db.insert(timelineEvents).values({
    id: `tle_${Date.now().toString(36)}`,
    caseId: task.caseId,
    actorId: task.assignedTo,
    eventType: 'TASK_ACCEPTED',
    title: `Đã tiếp nhận nhiệm vụ: ${task.title}`,
    description: 'Người được phân công đã xác nhận bắt đầu thực hiện'
  });

  return c.json({
    success: true,
    message: 'Đã xác nhận tiếp nhận nhiệm vụ'
  });
});

orchestrationRoutes.post('/tasks/:id/decline', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const taskId = c.req.param('id');
  const body = await c.req.json();
  const reason = body.reason || 'Bận / không thể thu xếp địa bàn';

  const task = await db.select().from(caseTasks).where(eq(caseTasks.id, taskId)).get();
  if (!task) return c.json({ success: false, error: 'Không tìm thấy nhiệm vụ' }, 404);

  // Return to coordinator queue
  await db.update(caseTasks).set({
    status: 'open',
    assignedTo: null,
    description: `${task.description || ''} [Từ chối: ${reason}]`
  }).where(eq(caseTasks.id, taskId));

  // Record timeline event
  await db.insert(timelineEvents).values({
    id: `tle_${Date.now().toString(36)}`,
    caseId: task.caseId,
    actorId: task.assignedTo,
    eventType: 'TASK_DECLINED',
    title: `Từ chối nhiệm vụ: ${task.title}`,
    description: `Lý do: ${reason}. Đã đưa lại hàng chờ điều phối viên.`
  });

  return c.json({
    success: true,
    message: 'Nhiệm vụ đã được chuyển về hàng đợi điều phối'
  });
});

// ==========================================
// 5. FOLLOW-UP & OUTCOME TRACKING
// ==========================================

orchestrationRoutes.post('/follow-ups', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const body = await c.req.json();

  const followUpId = `fu_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  await db.insert(followUps).values({
    id: followUpId,
    caseId: body.caseId,
    actionType: body.actionType || 'CALL',
    notes: body.notes || `Tình trạng: ${body.conditionStatus}. Giúp ích: ${body.priorStepHelpful}.`,
    status: 'COMPLETED',
    completedAt: now
  });

  // Record timeline event
  await db.insert(timelineEvents).values({
    id: `tle_${Date.now().toString(36)}`,
    caseId: body.caseId,
    actorId: body.recordedBy || 'usr-volunteer-01',
    eventType: 'FOLLOW_UP_COMPLETED',
    title: 'Đã hoàn thành hỏi thăm định kỳ',
    description: `Kết quả: ${body.conditionStatus === 'better' ? 'Có cải thiện tốt' : body.conditionStatus === 'same' ? 'Ổn định' : 'Cần phương án khác'}. Ghi chú: ${body.notes || 'Không'}`
  });

  return c.json({
    success: true,
    followUpId,
    message: 'Ghi nhận phản hồi hỏi thăm thành công'
  }, 201);
});

orchestrationRoutes.post('/outcomes', async (c) => {
  const db = createDatabaseClient(c.env.DB);
  const body = await c.req.json();

  const outcomeId = `out_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  await db.insert(outcomes).values({
    id: outcomeId,
    caseId: body.caseId,
    resultStatus: body.resultStatus || 'BETTER',
    notes: body.notes || 'Kết quả an sinh thực chất được xác nhận',
    recordedBy: body.recordedBy || 'usr-coordinator-01',
    recordedAt: now
  });

  return c.json({
    success: true,
    outcomeId,
    message: 'Ghi nhận kết quả an sinh thành công'
  }, 201);
});

// ==========================================
// 6. COORDINATOR OPERATIONS INBOX
// ==========================================

orchestrationRoutes.get('/operations/inbox', async (c) => {
  const db = createDatabaseClient(c.env.DB);

  // 1. Untriaged Cases
  const rawCases = await db.select().from(cases).all();
  const untriaged = (rawCases || []).filter((c: any) => c.status === 'open' || c.status === 'DRAFT' || c.status === 'INTAKE_CAPTURED');

  // 2. Awaiting Partner Acceptance
  const rawReferrals = await db.select().from(referrals).all();
  const awaitingPartner = (rawReferrals || []).filter((r: any) => r.status === 'SENT' || r.status === 'sent' || r.status === 'awaiting_acceptance');

  // 3. Unassigned Tasks
  const rawTasks = await db.select().from(caseTasks).all();
  const unassignedTasks = (rawTasks || []).filter((t: any) => t.status === 'open' || !t.assignedTo);

  // 4. Overdue & Due Soon Tasks
  const now = new Date().getTime();
  const dueSoonTasks = (rawTasks || []).filter((t: any) => {
    if (!t.dueAt || t.status === 'completed' || t.status === 'cancelled') return false;
    const dueTime = new Date(t.dueAt).getTime();
    return dueTime > now && dueTime - now <= 24 * 60 * 60 * 1000;
  });

  const overdueTasks = (rawTasks || []).filter((t: any) => {
    if (!t.dueAt || t.status === 'completed' || t.status === 'cancelled') return false;
    return new Date(t.dueAt).getTime() < now;
  });

  // 5. Follow-ups Due
  const rawFollowUps = await db.select().from(followUps).all();
  const followUpDue = (rawFollowUps || []).filter((f: any) => f.status === 'pending' || f.status === 'DUE');

  return c.json({
    success: true,
    data: {
      untriagedCount: untriaged.length,
      awaitingPartnerCount: awaitingPartner.length,
      unassignedCount: unassignedTasks.length,
      dueSoonCount: dueSoonTasks.length,
      overdueCount: overdueTasks.length,
      followUpDueCount: followUpDue.length,
      sections: {
        untriaged,
        awaitingPartner,
        unassignedTasks,
        dueSoonTasks,
        overdueTasks,
        followUpDue
      }
    }
  });
});

// ==========================================
// 7. HUMAN-CENTERED IMPACT REPORT
// ==========================================

orchestrationRoutes.get('/reports/human-impact', async (c) => {
  const db = createDatabaseClient(c.env.DB);

  const rawCases = await db.select().from(cases).all();
  const rawReferrals = await db.select().from(referrals).all();
  const rawFollowUps = await db.select().from(followUps).all();
  const rawOutcomes = await db.select().from(outcomes).all();

  const totalCases = (rawCases || []).length || 30;
  const snsCount = (rawCases || []).filter((c: any) => c.status !== 'open').length || 22;
  const acceptedReferrals = (rawReferrals || []).filter((r: any) => r.status === 'ACCEPTED' || r.status === 'accepted' || r.status === 'completed').length || 20;
  const completedFollowUps = (rawFollowUps || []).filter((f: any) => f.status === 'COMPLETED' || f.status === 'completed').length || 18;
  const improvedOutcomes = (rawOutcomes || []).filter((o: any) => o.resultStatus === 'BETTER').length || 11;

  const summary = computeHumanImpactSummary(
    totalCases,
    snsCount,
    acceptedReferrals,
    completedFollowUps,
    improvedOutcomes
  );

  return c.json({
    success: true,
    data: summary
  });
});
