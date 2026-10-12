/**
 * /api/v1/onboarding — self-registration for partners, volunteers, host organisations
 * and observers; /api/v1/admin — screening review, decisions, ledger, data-subject requests.
 *
 * Screening is automatic (domain ScreeningEngine); every decision is a person's.
 */
import { Hono, type Context } from 'hono';
import { sign } from 'hono/jwt';
import { z } from 'zod';
import {
  AGREEMENTS,
  APPLICATION_KINDS,
  PAYLOAD_SCHEMAS,
  REVIEW_SLA_DAYS,
  TRAINING_MODULES,
  addWorkingDays,
  computeLoopMetrics,
  gradeModule,
  missingAgreements,
  planDecision,
  screenHost,
  screenObserver,
  screenPartner,
  screenVolunteer,
  trainingComplete,
  type AgreementCode,
  type ApplicationDecision,
  type ApplicationKind,
  type ApplicationStatus,
  type PartnerPayload,
  type ScreeningContext,
  type ScreeningResult,
} from '@buoc-tiep/shared';
import type { Env } from '../bindings';
import { authMiddleware, type AuthContext } from '../middleware/auth';
import { sha256Hex } from '../lib/security';

type AppEnv = { Bindings: Env; Variables: { user: AuthContext } };
type Ctx = Context<AppEnv>;

export const onboardingRoutes = new Hono<AppEnv>();
export const adminRoutes = new Hono<AppEnv>();

const nowIso = () => new Date().toISOString();
const newId = (p: string) => `${p}-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
const parse = <T>(v: unknown, f: T): T => {
  if (typeof v !== 'string') return f;
  try {
    return JSON.parse(v) as T;
  } catch {
    return f;
  }
};
const fail = (c: Ctx, status: 400 | 401 | 403 | 404 | 409, code: string, message: string, extra: Record<string, unknown> = {}) =>
  c.json({ error: message, code, ...extra }, status);

async function body<T extends z.ZodTypeAny>(c: Ctx, schema: T): Promise<{ ok: true; data: z.infer<T> } | { ok: false; res: Response }> {
  const raw = await c.req.json().catch(() => ({}));
  const r = schema.safeParse(raw);
  return r.success ? { ok: true, data: r.data } : { ok: false, res: c.json({ error: 'Invalid input', code: 'VALIDATION_ERROR', issues: r.error.issues }, 400) };
}

const isPlatformCoordinator = (u?: AuthContext) => ['admin', 'coordinator'].includes(u?.role ?? '');

// ---------------------------------------------------------------------------
// Public: agreements, training content, host list
// ---------------------------------------------------------------------------

onboardingRoutes.get('/agreements', async (c) => {
  const items = await Promise.all(
    Object.values(AGREEMENTS).map(async (a) => ({ code: a.code, version: a.version, title: a.title, summary: a.summary, sha256: await sha256Hex(a.body) })),
  );
  return c.json({ agreements: items });
});

onboardingRoutes.get('/agreements/:code', async (c) => {
  const a = AGREEMENTS[c.req.param('code') as AgreementCode];
  if (!a) return fail(c, 404, 'NOT_FOUND', 'Agreement not found');
  return c.json({ agreement: { ...a, sha256: await sha256Hex(a.body) } });
});

onboardingRoutes.get('/training', (c) =>
  c.json({
    modules: TRAINING_MODULES.map((m) => ({ ...m, quiz: m.quiz.map(({ correct: _hidden, ...q }) => q) })),
  }),
);

onboardingRoutes.get('/hosts', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT id, legal_name, district FROM nx_orgs WHERE kind = 'HOST' AND status = 'ACTIVE' ORDER BY legal_name").all<any>();
  return c.json({ hosts: (results ?? []).map((h) => ({ id: h.id, name: h.legal_name, district: h.district })) });
});

// ---------------------------------------------------------------------------
// Authenticated applicant
// ---------------------------------------------------------------------------

onboardingRoutes.use('/applications', authMiddleware());
onboardingRoutes.use('/applications/*', authMiddleware());
onboardingRoutes.use('/session', authMiddleware());
onboardingRoutes.use('/training/*', authMiddleware());
onboardingRoutes.use('/me', authMiddleware());

async function screeningContext(db: D1Database, excludeEmail: string): Promise<ScreeningContext> {
  const [orgs, dirs, accts] = await Promise.all([
    db.prepare("SELECT legal_name AS name, website FROM nx_orgs WHERE status != 'REJECTED'").all<any>(),
    db.prepare('SELECT organisation_name AS name, website, phone FROM directory_resources').all<any>(),
    db.prepare('SELECT email FROM nx_accounts WHERE email != ? AND role != ?').bind(excludeEmail, 'applicant').all<any>(),
  ]);
  return {
    existingOrgs: [...(orgs.results ?? []), ...(dirs.results ?? [])].map((o) => ({ name: o.name, website: o.website })),
    existingContacts: [...(dirs.results ?? []).map((d) => ({ phone: d.phone })), ...(accts.results ?? []).map((a) => ({ email: a.email }))],
  };
}

function runScreening(kind: ApplicationKind, payload: any, email: string, ctx: ScreeningContext): ScreeningResult {
  switch (kind) {
    case 'PARTNER':
      return screenPartner(payload, ctx);
    case 'VOLUNTEER':
      return screenVolunteer({ ...payload, email }, ctx);
    case 'HOST':
      return screenHost(payload, ctx);
    case 'OBSERVER':
      return screenObserver(payload, ctx);
  }
}

function eventStmt(db: D1Database, appId: string, from: string | null, to: string, actor: { id: string; name: string }, note?: string | null) {
  return db
    .prepare('INSERT INTO application_events (id, application_id, from_status, to_status, actor_id, actor_name, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(newId('aev'), appId, from, to, actor.id, actor.name, note ?? null, nowIso());
}

const submitSchema = z.object({
  kind: z.enum(APPLICATION_KINDS),
  payload: z.record(z.unknown()),
  signer: z.object({ fullName: z.string().trim().min(2).max(80), title: z.string().trim().max(80).optional().nullable() }),
  acceptedAgreements: z.array(z.object({ code: z.string(), version: z.string(), sha256: z.string() })).min(1),
});

onboardingRoutes.post('/applications', async (c) => {
  const b = await body(c, submitSchema);
  if (!b.ok) return b.res;
  const user = c.get('user');
  if (user.demo) return fail(c, 403, 'DEMO_ACCOUNT', 'Sign in with your own email to apply');
  const { kind, signer, acceptedAgreements } = b.data;

  const payloadParsed = PAYLOAD_SCHEMAS[kind].safeParse({ ...b.data.payload, agreements: acceptedAgreements.map((a) => a.code) });
  if (!payloadParsed.success) return c.json({ error: 'Invalid application', code: 'VALIDATION_ERROR', issues: payloadParsed.error.issues }, 400);

  // Every accepted agreement must be the current text — the hash proves what was read.
  for (const a of acceptedAgreements) {
    const current = AGREEMENTS[a.code as AgreementCode];
    if (!current || current.version !== a.version || (await sha256Hex(current.body)) !== a.sha256) {
      return fail(c, 409, 'AGREEMENT_OUTDATED', `Agreement ${a.code} changed — please re-read and accept`);
    }
  }
  const missing = missingAgreements(kind, acceptedAgreements.map((a) => a.code));
  if (missing.length) return fail(c, 400, 'AGREEMENTS_REQUIRED', 'Required agreements not accepted', { missing });

  const db = c.env.DB;
  const open = await db
    .prepare("SELECT id FROM applications WHERE applicant_email = ? AND kind = ? AND status IN ('SUBMITTED','SCREENED','NEEDS_INFO')")
    .bind(user.email, kind)
    .first();
  if (open) return fail(c, 409, 'ALREADY_PENDING', 'You already have an application under review');

  const payload = payloadParsed.data as any;
  const screening = runScreening(kind, payload, user.email, await screeningContext(db, user.email));
  const id = newId('app');
  const at = new Date();
  const code = `${kind.slice(0, 1)}-${at.toISOString().slice(2, 10).replace(/-/g, '')}-${id.slice(-4).toUpperCase()}`;
  const sla = addWorkingDays(at, REVIEW_SLA_DAYS[kind]).toISOString();
  const ipHash = await sha256Hex(`${c.env.OTP_PEPPER || c.env.JWT_SECRET}:${c.req.header('CF-Connecting-IP') ?? ''}`);
  const system = { id: 'system', name: 'NEXTA screening' };

  await db.batch([
    db
      .prepare(
        `INSERT INTO applications (id, code, kind, applicant_email, applicant_account_id, host_org_id, payload_json, status, screening_json, score, recommendation, sla_due_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'SCREENED', ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, code, kind, user.email, user.userId, kind === 'VOLUNTEER' ? payload.hostOrgId ?? null : null, JSON.stringify(payload), JSON.stringify(screening), screening.score, screening.recommendation, sla, at.toISOString(), at.toISOString()),
    eventStmt(db, id, null, 'SUBMITTED', { id: user.userId, name: signer.fullName }),
    eventStmt(db, id, 'SUBMITTED', 'SCREENED', system, `${screening.recommendation} · ${screening.score}/100`),
    db.prepare('UPDATE nx_accounts SET full_name = COALESCE(full_name, ?), updated_at = ? WHERE id = ?').bind(signer.fullName, at.toISOString(), user.userId),
    ...acceptedAgreements.map((a) =>
      db
        .prepare(
          `INSERT INTO agreement_acceptances (id, agreement_code, agreement_version, agreement_sha256, email, account_id, application_id, org_name, signer_name, signer_title, ip_hash, user_agent)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(newId('acc'), a.code, a.version, a.sha256, user.email, user.userId, id, payload.org?.legalName ?? null, signer.fullName, signer.title ?? null, ipHash, (c.req.header('User-Agent') ?? '').slice(0, 200)),
    ),
  ]);
  return c.json({ application: { id, code, kind, status: 'SCREENED', slaDueAt: sla, recommendation: screening.recommendation } }, 201);
});

function toApplication(r: any, withPayload = true) {
  return {
    id: r.id,
    code: r.code,
    kind: r.kind as ApplicationKind,
    email: r.applicant_email,
    hostOrgId: r.host_org_id,
    status: r.status as ApplicationStatus,
    screening: parse<ScreeningResult | null>(r.screening_json, null),
    score: r.score,
    recommendation: r.recommendation,
    reviewerName: r.reviewer_name,
    decisionNote: r.decision_note,
    decidedAt: r.decided_at,
    slaDueAt: r.sla_due_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    displayName: (() => {
      const pl = parse<any>(r.payload_json, {});
      return pl.org?.legalName ?? pl.fullName ?? r.applicant_email;
    })(),
    ...(withPayload ? { payload: parse<Record<string, unknown>>(r.payload_json, {}) } : {}),
  };
}

onboardingRoutes.get('/applications/me', async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare('SELECT * FROM applications WHERE applicant_email = ? ORDER BY created_at DESC').bind(user.email).all<any>();
  return c.json({ applications: (results ?? []).map((r) => toApplication(r)) });
});

onboardingRoutes.post('/applications/:id/info', async (c) => {
  const b = await body(c, z.object({ payload: z.record(z.unknown()), note: z.string().max(1000).optional() }));
  if (!b.ok) return b.res;
  const user = c.get('user');
  const db = c.env.DB;
  const app = await db.prepare('SELECT * FROM applications WHERE id = ? AND applicant_email = ?').bind(c.req.param('id'), user.email).first<any>();
  if (!app) return fail(c, 404, 'NOT_FOUND', 'Application not found');
  const plan = planDecision(app.kind, app.status, 'resubmit', 'APPLICANT');
  if (!plan.ok) return fail(c, 409, plan.code, plan.message);
  const previous = parse<Record<string, unknown>>(app.payload_json, {});
  const merged = PAYLOAD_SCHEMAS[app.kind as ApplicationKind].safeParse({ ...previous, ...b.data.payload, agreements: previous.agreements });
  if (!merged.success) return c.json({ error: 'Invalid application', code: 'VALIDATION_ERROR', issues: merged.error.issues }, 400);
  const screening = runScreening(app.kind, merged.data, user.email, await screeningContext(db, user.email));
  await db.batch([
    db
      .prepare("UPDATE applications SET payload_json = ?, status = 'SCREENED', screening_json = ?, score = ?, recommendation = ?, updated_at = ? WHERE id = ?")
      .bind(JSON.stringify(merged.data), JSON.stringify(screening), screening.score, screening.recommendation, nowIso(), app.id),
    eventStmt(db, app.id, 'NEEDS_INFO', 'SUBMITTED', { id: user.userId, name: user.name }, b.data.note),
    eventStmt(db, app.id, 'SUBMITTED', 'SCREENED', { id: 'system', name: 'NEXTA screening' }, `${screening.recommendation} · ${screening.score}/100`),
  ]);
  return c.json({ status: 'SCREENED', screening });
});

/** Fresh token reflecting the account's current role (after approval / training). */
onboardingRoutes.post('/session', async (c) => {
  const user = c.get('user');
  if (user.demo) return c.json({ token: null, demo: true });
  const acc = await c.env.DB.prepare('SELECT * FROM nx_accounts WHERE id = ?').bind(user.userId).first<any>();
  if (!acc) return fail(c, 404, 'NOT_FOUND', 'Account not found');
  if (acc.status === 'SUSPENDED') return fail(c, 403, 'SUSPENDED', 'Account suspended');
  const token = await sign(
    { sub: acc.id, email: acc.email, name: acc.full_name || acc.email, role: acc.role, organizationId: acc.org_id || undefined, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 86_400 },
    c.env.JWT_SECRET,
  );
  return c.json({ token, account: { id: acc.id, email: acc.email, fullName: acc.full_name, role: acc.role, orgId: acc.org_id } });
});

onboardingRoutes.get('/me', async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  const [acc, vol, done] = await Promise.all([
    db.prepare('SELECT * FROM nx_accounts WHERE id = ?').bind(user.userId).first<any>(),
    db.prepare('SELECT * FROM volunteer_profiles WHERE account_id = ?').bind(user.userId).first<any>(),
    db.prepare('SELECT DISTINCT module_code FROM training_completions WHERE account_id = ? AND passed = 1').bind(user.userId).all<any>(),
  ]);
  const org = acc?.org_id ? await db.prepare('SELECT id, kind, legal_name, status FROM nx_orgs WHERE id = ?').bind(acc.org_id).first<any>() : null;
  return c.json({
    account: acc ? { id: acc.id, email: acc.email, fullName: acc.full_name, role: acc.role, status: acc.status } : { id: user.userId, email: user.email, role: user.role, demo: user.demo },
    org: org ? { id: org.id, kind: org.kind, name: org.legal_name, status: org.status } : null,
    volunteer: vol ? { status: vol.status, hostOrgId: vol.host_org_id } : null,
    trainingPassed: (done.results ?? []).map((r) => r.module_code),
  });
});

onboardingRoutes.post('/training/:code', async (c) => {
  const b = await body(c, z.object({ answers: z.array(z.number().int().min(0)).min(1) }));
  if (!b.ok) return b.res;
  const user = c.get('user');
  const code = c.req.param('code') as (typeof TRAINING_MODULES)[number]['code'];
  const module = TRAINING_MODULES.find((m) => m.code === code);
  if (!module) return fail(c, 404, 'NOT_FOUND', 'Module not found');
  const grade = gradeModule(code, b.data.answers);
  const db = c.env.DB;
  await db
    .prepare('INSERT INTO training_completions (id, account_id, module_code, module_version, score, passed) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(newId('trn'), user.userId, code, module.version, grade.score, grade.passed ? 1 : 0)
    .run();

  let activated = false;
  if (grade.passed) {
    const passed = await db.prepare('SELECT DISTINCT module_code FROM training_completions WHERE account_id = ? AND passed = 1').bind(user.userId).all<any>();
    const vol = await db.prepare('SELECT status FROM volunteer_profiles WHERE account_id = ?').bind(user.userId).first<any>();
    if (vol?.status === 'TRAINING' && trainingComplete((passed.results ?? []).map((r) => r.module_code))) {
      await db.prepare("UPDATE volunteer_profiles SET status = 'ACTIVE', activated_at = ?, updated_at = ? WHERE account_id = ?").bind(nowIso(), nowIso(), user.userId).run();
      activated = true;
    }
  }
  return c.json({ ...grade, activated });
});

// ---------------------------------------------------------------------------
// Data-subject requests (public — may be filed on someone's behalf)
// ---------------------------------------------------------------------------

onboardingRoutes.post('/privacy/requests', async (c) => {
  const b = await body(
    c,
    z.object({
      kind: z.enum(['ACCESS', 'CORRECT', 'DELETE', 'WITHDRAW_CONSENT', 'OBJECT', 'COMPLAINT']),
      email: z.string().email().optional().nullable(),
      caseAlias: z.string().trim().max(60).optional().nullable(),
      details: z.string().trim().min(5).max(2000),
    }),
  );
  if (!b.ok) return b.res;
  const id = newId('dsr');
  const due = addWorkingDays(new Date(), 10).toISOString();
  await c.env.DB.prepare('INSERT INTO data_subject_requests (id, kind, email, case_alias, details, due_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, b.data.kind, b.data.email ?? null, b.data.caseAlias ?? null, b.data.details, due)
    .run();
  return c.json({ request: { id, dueAt: due } }, 201);
});

// ---------------------------------------------------------------------------
// Transparency (public, aggregate only)
// ---------------------------------------------------------------------------

onboardingRoutes.get('/transparency', async (c) => {
  const db = c.env.DB;
  const [ledger, cases, steps, refs, fus, res, escs, orgs, vols] = await Promise.all([
    db.prepare('SELECT month, direction, category, SUM(amount_vnd) AS total FROM cost_ledger GROUP BY month, direction, category ORDER BY month').all<any>(),
    db.prepare('SELECT id, created_at FROM loop_cases').all<any>(),
    db.prepare('SELECT case_id, status, confirmed_at FROM loop_next_steps').all<any>(),
    db.prepare('SELECT id, case_id, stage FROM loop_referrals').all<any>(),
    db.prepare('SELECT case_id, result, due_at, completed_at FROM loop_follow_ups').all<any>(),
    db.prepare('SELECT verification_status, verified_at, verification_expires_at FROM directory_resources').all<any>(),
    db.prepare('SELECT case_id FROM loop_escalations').all<any>(),
    db.prepare("SELECT kind, COUNT(*) AS n FROM nx_orgs WHERE status = 'ACTIVE' GROUP BY kind").all<any>(),
    db.prepare("SELECT COUNT(*) AS n FROM volunteer_profiles WHERE status = 'ACTIVE'").first<any>(),
  ]);
  const m = computeLoopMetrics({
    cases: (cases.results ?? []).map((r) => ({ id: r.id, createdAt: r.created_at })),
    safeNextSteps: (steps.results ?? []).map((r) => ({ caseId: r.case_id, status: r.status, confirmedAt: r.confirmed_at })),
    referrals: (refs.results ?? []).map((r) => ({ id: r.id, caseId: r.case_id, status: r.stage })),
    followUps: (fus.results ?? []).map((r) => ({ caseId: r.case_id, result: r.result, dueAt: r.due_at, completedAt: r.completed_at })),
    resources: (res.results ?? []).map((r) => ({ verificationStatus: r.verification_status, verifiedAt: r.verified_at, verificationExpiresAt: r.verification_expires_at })),
    escalations: (escs.results ?? []).map((r) => ({ caseId: r.case_id })),
  });
  const rows = ledger.results ?? [];
  const totalOut = rows.filter((r) => r.direction === 'OUT').reduce((s, r) => s + Number(r.total), 0);
  const totalIn = rows.filter((r) => r.direction === 'IN').reduce((s, r) => s + Number(r.total), 0);
  return c.json({
    ledger: rows.map((r) => ({ month: r.month, direction: r.direction, category: r.category, totalVnd: Number(r.total) })),
    totals: { inVnd: totalIn, outVnd: totalOut, balanceVnd: totalIn - totalOut },
    costPerSafeNextStepVnd: m.journeysClosedLoop > 0 ? Math.round(totalOut / m.journeysClosedLoop) : null,
    journeysClosedLoop: m.journeysClosedLoop,
    safeNextStepRate: m.safeNextStepRate,
    activeOrgs: Object.fromEntries((orgs.results ?? []).map((o) => [o.kind, o.n])),
    activeNavigators: vols?.n ?? 0,
    generatedAt: nowIso(),
  });
});

// ---------------------------------------------------------------------------
// Admin — review queue & decisions
// ---------------------------------------------------------------------------

adminRoutes.use('*', authMiddleware());

function reviewerOf(u: AuthContext): 'PLATFORM_COORDINATOR' | 'HOST_ADMIN' | null {
  if (isPlatformCoordinator(u)) return 'PLATFORM_COORDINATOR';
  if (u.role === 'host_admin') return 'HOST_ADMIN';
  return null;
}

adminRoutes.get('/applications', async (c) => {
  const u = c.get('user');
  const reviewer = reviewerOf(u);
  if (!reviewer) return fail(c, 403, 'FORBIDDEN', 'Reviewers only');
  const kind = c.req.query('kind');
  const status = c.req.query('status');
  const where: string[] = [];
  const binds: unknown[] = [];
  if (reviewer === 'HOST_ADMIN') {
    where.push("kind = 'VOLUNTEER' AND host_org_id = ?");
    binds.push(u.organizationId ?? '');
  }
  if (kind) (where.push('kind = ?'), binds.push(kind));
  if (status) (where.push('status = ?'), binds.push(status));
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM applications ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY CASE recommendation WHEN 'HIGH_RISK' THEN 0 WHEN 'REVIEW' THEN 1 ELSE 2 END, sla_due_at ASC LIMIT 300`,
  )
    .bind(...(binds as any[]))
    .all<any>();
  return c.json({ applications: (results ?? []).map((r) => toApplication(r, false)) });
});

adminRoutes.get('/applications/:id', async (c) => {
  const u = c.get('user');
  const reviewer = reviewerOf(u);
  if (!reviewer) return fail(c, 403, 'FORBIDDEN', 'Reviewers only');
  const db = c.env.DB;
  const app = await db.prepare('SELECT * FROM applications WHERE id = ?').bind(c.req.param('id')).first<any>();
  if (!app) return fail(c, 404, 'NOT_FOUND', 'Application not found');
  if (reviewer === 'HOST_ADMIN' && (app.kind !== 'VOLUNTEER' || app.host_org_id !== u.organizationId)) return fail(c, 403, 'FORBIDDEN', 'Not your organisation');
  const [events, acceptances] = await Promise.all([
    db.prepare('SELECT * FROM application_events WHERE application_id = ? ORDER BY created_at ASC').bind(app.id).all<any>(),
    db.prepare('SELECT agreement_code, agreement_version, signer_name, signer_title, accepted_at FROM agreement_acceptances WHERE application_id = ?').bind(app.id).all<any>(),
  ]);
  return c.json({
    application: toApplication(app),
    events: (events.results ?? []).map((e) => ({ fromStatus: e.from_status, toStatus: e.to_status, actorName: e.actor_name, note: e.note, createdAt: e.created_at })),
    acceptances: (acceptances.results ?? []).map((a) => ({ code: a.agreement_code, version: a.agreement_version, signerName: a.signer_name, signerTitle: a.signer_title, acceptedAt: a.accepted_at })),
  });
});

const ROLE_FOR: Record<ApplicationKind, string> = { PARTNER: 'partner', HOST: 'host_admin', OBSERVER: 'observer', VOLUNTEER: 'volunteer' };

adminRoutes.post('/applications/:id/decision', async (c) => {
  const u = c.get('user');
  const reviewer = reviewerOf(u);
  if (!reviewer) return fail(c, 403, 'FORBIDDEN', 'Reviewers only');
  const b = await body(c, z.object({ decision: z.enum(['approve', 'request_info', 'reject', 'suspend', 'reinstate']), note: z.string().trim().max(1000).optional() }));
  if (!b.ok) return b.res;
  const db = c.env.DB;
  const app = await db.prepare('SELECT * FROM applications WHERE id = ?').bind(c.req.param('id')).first<any>();
  if (!app) return fail(c, 404, 'NOT_FOUND', 'Application not found');
  if (reviewer === 'HOST_ADMIN' && app.host_org_id !== u.organizationId) return fail(c, 403, 'FORBIDDEN', 'Not your organisation');

  const plan = planDecision(app.kind, app.status, b.data.decision as ApplicationDecision, reviewer, b.data.note);
  if (!plan.ok) return fail(c, plan.code === 'NOT_ALLOWED' ? 403 : plan.code === 'REASON_REQUIRED' ? 400 : 409, plan.code, plan.message);

  const at = nowIso();
  const payload = parse<any>(app.payload_json, {});
  const stmts: D1PreparedStatement[] = [
    db
      .prepare('UPDATE applications SET status = ?, reviewer_id = ?, reviewer_name = ?, decision_note = ?, decided_at = ?, updated_at = ? WHERE id = ?')
      .bind(plan.to, u.userId, u.name, b.data.note ?? null, at, at, app.id),
    eventStmt(db, app.id, plan.from, plan.to, { id: u.userId, name: u.name }, b.data.note),
  ];
  let orgId: string | null = app.created_org_id;

  if (b.data.decision === 'approve') {
    const kind = app.kind as ApplicationKind;
    if (kind !== 'VOLUNTEER') {
      orgId = orgId ?? newId('org');
      const o = payload.org ?? {};
      stmts.push(
        db
          .prepare(
            `INSERT OR REPLACE INTO nx_orgs (id, kind, legal_name, short_name, legal_form, registration_ref, district, address, website, public_source_url,
              representative_name, representative_title, dpo_contact, safeguarding_contact, status, approved_by, approved_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)`,
          )
          .bind(
            orgId, kind, o.legalName, o.shortName ?? null, o.legalForm ?? null, o.registrationRef ?? null, o.district ?? null, o.address ?? null, o.website ?? null, o.publicSourceUrl ?? null,
            payload.representative?.fullName ?? payload.contact?.fullName ?? null, payload.representative?.title ?? payload.contact?.title ?? null,
            payload.dpoContact ? JSON.stringify(payload.dpoContact) : null, payload.safeguardingContact ? JSON.stringify(payload.safeguardingContact) : null,
            u.name, at, at, at,
          ),
        db.prepare('UPDATE applications SET created_org_id = ? WHERE id = ?').bind(orgId, app.id),
      );
    }
    stmts.push(
      db.prepare("UPDATE nx_accounts SET role = ?, org_id = ?, status = 'ACTIVE', updated_at = ? WHERE email = ?").bind(ROLE_FOR[kind], kind === 'VOLUNTEER' ? app.host_org_id : orgId, at, app.applicant_email),
    );
    if (kind === 'VOLUNTEER') {
      stmts.push(
        db
          .prepare(`INSERT OR REPLACE INTO volunteer_profiles (account_id, host_org_id, district, availability_json, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'TRAINING', ?, ?)`)
          .bind(app.applicant_account_id, app.host_org_id, payload.district ?? null, JSON.stringify(payload.availability ?? {}), at, at),
      );
    }
    if (kind === 'PARTNER') {
      // Services enter the directory UNCONFIRMED: approval of an organisation is not verification of a service.
      for (const s of (payload as PartnerPayload).services) {
        stmts.push(
          db
            .prepare(
              `INSERT INTO directory_resources (id, organisation_name, service_name, category, description, target_group, eligibility_json, service_area_json,
                district, address, phone, website, contact_method, availability_json, accepts_referral, capacity_status, verification_status,
                verification_method, verification_source_url, verification_notes, partner_org_id, keywords, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNKNOWN', 'UNCONFIRMED', 'PARTNER_PORTAL', ?, ?, ?, ?, ?, ?)`,
            )
            .bind(
              newId('dir'), payload.org.legalName, s.serviceName, s.category, s.description, s.targetGroups.join(', ') || 'any',
              JSON.stringify({ minAge: s.minAge ?? null, maxAge: s.maxAge ?? null, targetGroups: s.targetGroups, requiresIdentityDoc: s.requiresIdentityDoc }),
              JSON.stringify(s.serviceArea), payload.org.district, s.address ?? payload.org.address, payload.contact.phone, payload.org.website ?? null,
              `Liên hệ ${payload.contact.fullName} (${payload.contact.title})`, JSON.stringify({ days: s.days, hours: s.hours ?? null }), s.acceptsReferral ? 1 : 0,
              payload.org.publicSourceUrl ?? payload.org.website ?? null, `Self-registered by partner; application ${app.code}. Needs a verification call.`,
              orgId, s.description, at, at,
            ),
        );
      }
    }
  }
  if (b.data.decision === 'suspend') {
    stmts.push(db.prepare("UPDATE nx_accounts SET status = 'SUSPENDED', updated_at = ? WHERE email = ?").bind(at, app.applicant_email));
    if (orgId) stmts.push(db.prepare("UPDATE nx_orgs SET status = 'SUSPENDED', updated_at = ? WHERE id = ?").bind(at, orgId));
  }
  if (b.data.decision === 'reinstate') {
    stmts.push(db.prepare("UPDATE nx_accounts SET status = 'ACTIVE', updated_at = ? WHERE email = ?").bind(at, app.applicant_email));
    if (orgId) stmts.push(db.prepare("UPDATE nx_orgs SET status = 'ACTIVE', updated_at = ? WHERE id = ?").bind(at, orgId));
  }
  await db.batch(stmts);
  return c.json({ status: plan.to, orgId });
});

// ---------------------------------------------------------------------------
// Admin — ledger & data-subject requests (platform coordinators)
// ---------------------------------------------------------------------------

adminRoutes.get('/ledger', async (c) => {
  if (!isPlatformCoordinator(c.get('user'))) return fail(c, 403, 'FORBIDDEN', 'Coordinators only');
  const { results } = await c.env.DB.prepare('SELECT * FROM cost_ledger ORDER BY month DESC, created_at DESC LIMIT 500').all<any>();
  return c.json({
    entries: (results ?? []).map((r) => ({ id: r.id, month: r.month, direction: r.direction, category: r.category, amountVnd: r.amount_vnd, counterparty: r.counterparty, evidenceRef: r.evidence_ref, note: r.note, recordedByName: r.recorded_by_name, createdAt: r.created_at })),
  });
});

export const LEDGER_CATEGORIES = ['NAVIGATOR_STIPEND', 'TRAVEL_COMMS', 'INSURANCE', 'TRAINING', 'COORDINATION', 'TECHNOLOGY', 'PRINTING', 'EMERGENCY_FUND', 'GRANT', 'IN_KIND', 'SERVICE_CONTRACT', 'OTHER'] as const;

adminRoutes.post('/ledger', async (c) => {
  const u = c.get('user');
  if (!isPlatformCoordinator(u)) return fail(c, 403, 'FORBIDDEN', 'Coordinators only');
  const b = await body(
    c,
    z.object({
      month: z.string().regex(/^\d{4}-\d{2}$/),
      direction: z.enum(['IN', 'OUT']),
      category: z.enum(LEDGER_CATEGORIES),
      amountVnd: z.number().int().positive().max(10_000_000_000),
      counterparty: z.string().trim().max(160).optional().nullable(),
      evidenceRef: z.string().trim().min(2).max(160),
      note: z.string().trim().max(500).optional().nullable(),
    }),
  );
  if (!b.ok) return b.res;
  const d = b.data;
  const id = newId('led');
  await c.env.DB.prepare(
    'INSERT INTO cost_ledger (id, month, direction, category, amount_vnd, counterparty, evidence_ref, note, recorded_by, recorded_by_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(id, d.month, d.direction, d.category, d.amountVnd, d.counterparty ?? null, d.evidenceRef, d.note ?? null, u.userId, u.name)
    .run();
  return c.json({ id }, 201);
});

adminRoutes.get('/privacy/requests', async (c) => {
  if (!isPlatformCoordinator(c.get('user'))) return fail(c, 403, 'FORBIDDEN', 'Coordinators only');
  const { results } = await c.env.DB.prepare("SELECT * FROM data_subject_requests ORDER BY CASE status WHEN 'OPEN' THEN 0 ELSE 1 END, due_at ASC").all<any>();
  return c.json({ requests: (results ?? []).map((r) => ({ id: r.id, kind: r.kind, email: r.email, caseAlias: r.case_alias, details: r.details, status: r.status, resolution: r.resolution, dueAt: r.due_at, resolvedAt: r.resolved_at, createdAt: r.created_at })) });
});

adminRoutes.post('/privacy/requests/:id/resolve', async (c) => {
  const u = c.get('user');
  if (!isPlatformCoordinator(u)) return fail(c, 403, 'FORBIDDEN', 'Coordinators only');
  const b = await body(c, z.object({ resolution: z.string().trim().min(5).max(1000) }));
  if (!b.ok) return b.res;
  await c.env.DB.prepare("UPDATE data_subject_requests SET status = 'RESOLVED', handled_by = ?, resolution = ?, resolved_at = ? WHERE id = ?")
    .bind(u.name, b.data.resolution, nowIso(), c.req.param('id'))
    .run();
  return c.json({ ok: true });
});
