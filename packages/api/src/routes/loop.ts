/**
 * /api/v1/loop — NEXTA closed loop (RE:ACT SSOT)
 *
 *   Observe → Consent → Understand → Risk Gate → Match → Safe Next Step
 *   → Referral (partner) → Follow-up → Close / Escalate
 *
 * All business rules come from @buoc-tiep/shared (closed-loop); this file
 * only validates input, persists to the loop_* / directory_* tables and records
 * who did what. Cases hold an alias only.
 */
import { Hono, type Context } from 'hono';
import { z } from 'zod';
import {
  evaluateRiskGate,
  applyHumanReview,
  runMatchPipeline,
  resolveVerificationFreshness,
  planLoopAction,
  availableLoopActions,
  followUpConsequence,
  computeLoopMetrics,
  computeLoopReport,
  suggestFromNote,
  NEED_CATEGORIES,
  PROVENANCE_SOURCES,
  FOLLOW_UP_RESULTS,
  type DirectoryResource,
  type LoopActor,
  type LoopAction,
  type RiskGateResult,
  type RiskFlagCode,
  type LoopStage,
} from '@buoc-tiep/shared';
import type { Env } from '../bindings';
import type { AuthContext } from '../middleware/auth';

type AppEnv = { Bindings: Env; Variables: { user: AuthContext } };
type Ctx = Context<AppEnv>;

export const loopRoutes = new Hono<AppEnv>();

loopRoutes.use('*', async (c, next) => {
  const scope = scopeOf(c.get('user'));
  const path = new URL(c.req.url).pathname;
  if ((scope.kind === 'observer' || scope.kind === 'none') && !(c.req.method === 'GET' && path.endsWith('/metrics'))) {
    return c.json({ error: 'Your role can only view aggregate metrics', code: 'SCOPE_FORBIDDEN' }, 403);
  }
  if (scope.kind === 'partner' && /\/(cases|follow-ups|escalations|assist)/.test(path)) {
    return c.json({ error: 'Partners only see referrals sent to their organisation', code: 'SCOPE_FORBIDDEN' }, 403);
  }
  const caseId = path.match(/\/cases\/([^/]+)/)?.[1];
  if (caseId && !(await canSeeCase(c.env.DB, scope, caseId))) {
    return c.json({ error: 'Not your organisation', code: 'SCOPE_FORBIDDEN' }, 403);
  }
  await next();
});

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const nowIso = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;

export function actorOf(role: string | undefined): LoopActor {
  const r = (role ?? '').toLowerCase();
  if (['partner', 'partner_staff', 'partner_admin'].includes(r)) return 'PARTNER';
  if (['admin', 'coordinator', 'social_worker', 'supervisor', 'host_admin'].includes(r)) return 'COORDINATOR';
  return 'NAVIGATOR';
}

/**
 * Data scope of the signed-in user. Demo tokens and platform coordinators see everything;
 * real accounts only see their own organisation's journeys / referrals.
 */
type Scope = { kind: 'all' } | { kind: 'host'; orgId: string } | { kind: 'partner'; orgId: string } | { kind: 'observer' } | { kind: 'none' };

export function scopeOf(u: AuthContext | undefined): Scope {
  if (!u) return { kind: 'none' };
  const r = (u.role ?? '').toLowerCase();
  if (r === 'observer') return { kind: 'observer' };
  if (r === 'applicant') return { kind: 'none' };
  if (u.demo || ['admin', 'coordinator', 'social_worker', 'supervisor'].includes(r)) return { kind: 'all' };
  if (actorOf(r) === 'PARTNER') return { kind: 'partner', orgId: u.organizationId ?? '' };
  return { kind: 'host', orgId: u.organizationId ?? '' };
}

/** Case của sandbox dùng thử (Mini App) — không bao giờ lẫn vào danh sách, hộp chuyển gửi hay số liệu thật. */
export const TRIAL_CASES_SQL = "(SELECT case_id FROM loop_case_scope WHERE host_org_id LIKE 'trial-%')";

/** SQL fragment restricting loop_cases alias `c` to the caller's host organisation. */
function caseScopeSql(scope: Scope): { sql: string; binds: unknown[] } {
  if (scope.kind === 'host') return { sql: 'c.id IN (SELECT case_id FROM loop_case_scope WHERE host_org_id = ?)', binds: [scope.orgId] };
  return { sql: `c.id NOT IN ${TRIAL_CASES_SQL}`, binds: [] };
}

async function canSeeCase(db: D1Database, scope: Scope, caseId: string): Promise<boolean> {
  if (scope.kind === 'all') return true;
  if (scope.kind === 'host') {
    return Boolean(await db.prepare('SELECT 1 FROM loop_case_scope WHERE case_id = ? AND host_org_id = ?').bind(caseId, scope.orgId).first());
  }
  return false;
}

function userOf(c: Ctx) {
  const u = c.get('user');
  return { id: u?.userId ?? 'anonymous', name: u?.name ?? 'Unknown', actor: actorOf(u?.role) };
}

const parse = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== 'string' || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

function fail(c: Ctx, status: 400 | 403 | 404 | 409, code: string, message: string, extra: Record<string, unknown> = {}) {
  return c.json({ error: message, code, ...extra }, status);
}

async function readBody<T extends z.ZodTypeAny>(c: Ctx, schema: T): Promise<{ ok: true; data: z.infer<T> } | { ok: false; res: Response }> {
  const raw = await c.req.json().catch(() => ({}));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, res: c.json({ error: 'Invalid input', code: 'VALIDATION_ERROR', issues: parsed.error.issues }, 400) };
  }
  return { ok: true, data: parsed.data };
}

export function toDirectoryResource(row: any): DirectoryResource & Record<string, unknown> {
  return {
    id: row.id,
    name: row.organisation_name,
    organisationName: row.organisation_name,
    serviceName: row.service_name,
    category: row.category,
    description: row.description,
    targetGroup: row.target_group,
    district: row.district,
    ward: row.ward,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    website: row.website,
    contactMethod: row.contact_method,
    serviceArea: parse<string[]>(row.service_area_json, []),
    eligibility: parse(row.eligibility_json, {}),
    availability: parse(row.availability_json, {}),
    acceptsReferral: row.accepts_referral === 1 || row.accepts_referral === true,
    capacityStatus: row.capacity_status,
    slotsAvailable: row.slots_available,
    capacityCheckedAt: row.capacity_checked_at,
    verificationStatus: row.verification_status,
    verifiedAt: row.verified_at,
    verificationExpiresAt: row.verification_expires_at,
    verifiedByName: row.verified_by_name,
    verificationMethod: row.verification_method,
    verificationSourceUrl: row.verification_source_url,
    verificationNotes: row.verification_notes,
    keywords: row.keywords,
    partnerOrgId: row.partner_org_id ?? null,
    freshness: resolveVerificationFreshness({
      verificationStatus: row.verification_status,
      verifiedAt: row.verified_at,
      verificationExpiresAt: row.verification_expires_at,
    }),
    updatedAt: row.updated_at,
  };
}

function toCase(row: any) {
  return {
    id: row.id,
    alias: row.alias,
    preferredAddress: row.preferred_address,
    age: row.age,
    isMinor: row.is_minor === 1,
    targetGroup: row.target_group,
    hasIdentityDoc: row.has_identity_doc === null || row.has_identity_doc === undefined ? null : row.has_identity_doc === 1,
    district: row.district,
    ward: row.ward,
    need: row.need_category,
    priorityStatement: row.priority_statement,
    observation: row.observation,
    keywords: parse<string[]>(row.keywords_json, []),
    strengths: parse<string[]>(row.strengths_json, []),
    constraints: parse<{ daytimeOnly?: boolean; weekendOnly?: boolean }>(row.constraints_json, {}),
    urgency: row.urgency,
    consent: parse<Record<string, unknown> | null>(row.consent_json, null),
    consentGivenAt: row.consent_given_at,
    riskDecision: row.risk_decision,
    risk: parse<RiskGateResult | null>(row.risk_json, null),
    riskReviewedAt: row.risk_reviewed_at,
    stage: row.stage,
    status: row.status,
    navigatorId: row.navigator_id,
    navigatorName: row.navigator_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at,
  };
}

async function loadCase(db: D1Database, id: string) {
  return db.prepare('SELECT * FROM loop_cases WHERE id = ?').bind(id).first<any>();
}

async function setCase(db: D1Database, id: string, fields: Record<string, unknown>) {
  const keys = Object.keys(fields);
  const sets = [...keys.map((k) => `${k} = ?`), 'updated_at = ?'].join(', ');
  await db
    .prepare(`UPDATE loop_cases SET ${sets} WHERE id = ?`)
    .bind(...keys.map((k) => fields[k] as any), nowIso(), id)
    .run();
}

function factStmt(db: D1Database, caseId: string, field: string, value: unknown, source: string, user: { id: string; name: string }) {
  return db
    .prepare('INSERT INTO loop_facts (id, case_id, field, value, source, recorded_by, recorded_by_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(newId('fact'), caseId, field, typeof value === 'string' ? value : JSON.stringify(value), source, user.id, user.name, nowIso());
}

function riskText(row: any): string {
  return [row.observation, row.priority_statement, ...parse<string[]>(row.keywords_json, [])].filter(Boolean).join('. ');
}

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

const createCaseSchema = z.object({
  alias: z.string().trim().min(1).max(60),
  observation: z.string().trim().max(4000).default(''),
  keywords: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  captureModes: z.array(z.enum(['note', 'keywords', 'voice', 'photo'])).default(['note']),
});

loopRoutes.post('/cases', async (c) => {
  const body = await readBody(c, createCaseSchema);
  if (!body.ok) return body.res;
  const user = userOf(c);
  const auth = c.get('user');
  const { alias, observation, keywords, captureModes } = body.data;
  if (!auth?.demo && !auth?.trial && (auth?.role ?? '') === 'volunteer') {
    const vol = await c.env.DB.prepare('SELECT status FROM volunteer_profiles WHERE account_id = ?').bind(user.id).first<any>();
    if (vol?.status !== 'ACTIVE') return fail(c, 403, 'TRAINING_REQUIRED', 'Complete the Navigator training before opening journeys');
  }
  if (!observation && keywords.length === 0) {
    return fail(c, 400, 'EMPTY_OBSERVATION', 'Add a short note or at least one keyword');
  }
  const id = newId('case');
  const at = nowIso();
  const db = c.env.DB;
  await db.batch([
    db
      .prepare(
        `INSERT INTO loop_cases (id, alias, observation, keywords_json, stage, status, navigator_id, navigator_name, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'CONSENT', 'OPEN', ?, ?, ?, ?)`,
      )
      .bind(id, alias, observation, JSON.stringify(keywords), user.id, user.name, at, at),
    factStmt(db, id, 'observation', { text: observation, keywords, captureModes }, 'NAVIGATOR_OBSERVED', user),
    db
      .prepare('INSERT INTO loop_case_scope (case_id, host_org_id, navigator_account_id) VALUES (?, ?, ?)')
      .bind(id, auth?.demo ? null : auth?.organizationId ?? null, user.id),
  ]);
  return c.json({ case: toCase(await loadCase(db, id)) }, 201);
});

loopRoutes.get('/cases', async (c) => {
  const stage = c.req.query('stage');
  const status = c.req.query('status') ?? 'OPEN';
  const db = c.env.DB;
  const scoped = caseScopeSql(scopeOf(c.get('user')));
  const where: string[] = [scoped.sql];
  const binds: unknown[] = [...scoped.binds];
  if (status !== 'ALL') {
    where.push('c.status = ?');
    binds.push(status);
  }
  if (stage) {
    where.push('c.stage = ?');
    binds.push(stage);
  }
  const { results } = await db
    .prepare(
      `SELECT c.*,
        (SELECT json_object('id', s.id, 'action', s.action, 'dueAt', s.due_at, 'status', s.status, 'place', s.place)
           FROM loop_next_steps s WHERE s.case_id = c.id AND s.status != 'CANCELLED' ORDER BY s.created_at DESC LIMIT 1) AS next_step,
        (SELECT json_object('id', r.id, 'code', r.code, 'stage', r.stage)
           FROM loop_referrals r WHERE r.case_id = c.id ORDER BY r.created_at DESC LIMIT 1) AS referral,
        (SELECT json_object('id', f.id, 'dueAt', f.due_at)
           FROM loop_follow_ups f WHERE f.case_id = c.id AND f.result IS NULL ORDER BY f.due_at ASC LIMIT 1) AS follow_up
       FROM loop_cases c ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY c.updated_at DESC LIMIT 200`,
    )
    .bind(...(binds as any[]))
    .all<any>();
  return c.json({
    cases: (results ?? []).map((r) => ({
      ...toCase(r),
      nextStep: parse(r.next_step, null),
      referral: parse(r.referral, null),
      followUp: parse(r.follow_up, null),
    })),
  });
});

loopRoutes.get('/cases/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const row = await loadCase(db, id);
  if (!row) return fail(c, 404, 'NOT_FOUND', 'Case not found');

  const [facts, match, steps, referrals, events, followUps, escalations] = await Promise.all([
    db.prepare('SELECT * FROM loop_facts WHERE case_id = ? ORDER BY created_at ASC').bind(id).all<any>(),
    db.prepare('SELECT * FROM loop_matches WHERE case_id = ? ORDER BY created_at DESC LIMIT 1').bind(id).first<any>(),
    db
      .prepare(
        `SELECT s.*, d.organisation_name, d.service_name, d.phone, d.address, d.accepts_referral
         FROM loop_next_steps s LEFT JOIN directory_resources d ON d.id = s.resource_id
         WHERE s.case_id = ? ORDER BY s.created_at DESC`,
      )
      .bind(id)
      .all<any>(),
    db
      .prepare(
        `SELECT r.*, d.organisation_name, d.service_name FROM loop_referrals r
         LEFT JOIN directory_resources d ON d.id = r.resource_id WHERE r.case_id = ? ORDER BY r.created_at DESC`,
      )
      .bind(id)
      .all<any>(),
    db.prepare('SELECT * FROM loop_referral_events WHERE case_id = ? ORDER BY created_at ASC').bind(id).all<any>(),
    db.prepare('SELECT * FROM loop_follow_ups WHERE case_id = ? ORDER BY due_at ASC').bind(id).all<any>(),
    db.prepare('SELECT * FROM loop_escalations WHERE case_id = ? ORDER BY created_at DESC').bind(id).all<any>(),
  ]);

  const actor = userOf(c).actor;
  return c.json({
    case: toCase(row),
    facts: (facts.results ?? []).map((f) => ({
      id: f.id,
      field: f.field,
      value: parse(f.value, f.value),
      source: f.source,
      recordedByName: f.recorded_by_name,
      createdAt: f.created_at,
    })),
    match: match ? { id: match.id, createdAt: match.created_at, ...parse(match.result_json, {}) } : null,
    nextSteps: (steps.results ?? []).map(toNextStep),
    referrals: (referrals.results ?? []).map((r) => ({
      ...toReferral(r),
      availableActions: availableLoopActions(r.stage, actor),
      events: (events.results ?? []).filter((e) => e.referral_id === r.id).map(toEvent),
    })),
    followUps: (followUps.results ?? []).map(toFollowUp),
    escalations: (escalations.results ?? []).map(toEscalation),
  });
});

function toNextStep(s: any) {
  return {
    id: s.id,
    caseId: s.case_id,
    resourceId: s.resource_id,
    organisationName: s.organisation_name,
    serviceName: s.service_name,
    phone: s.phone,
    address: s.address,
    action: s.action,
    ownerName: s.owner_name,
    ownerRole: s.owner_role,
    place: s.place,
    dueAt: s.due_at,
    verification: s.verification_snapshot,
    verifiedAt: s.verified_at_snapshot,
    status: s.status,
    confirmedAt: s.confirmed_at,
    createdAt: s.created_at,
  };
}

function toReferral(r: any) {
  return {
    id: r.id,
    code: r.code,
    caseId: r.case_id,
    nextStepId: r.next_step_id,
    resourceId: r.resource_id,
    organisationName: r.organisation_name,
    serviceName: r.service_name,
    stage: r.stage as LoopStage,
    declineReason: r.decline_reason,
    outcomeNote: r.outcome_note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** Coarse age band shown to partners instead of the exact age. */
function ageBand(age: number | null, isMinor: boolean): 'under_18' | '18_59' | '60_plus' | null {
  if (isMinor || (age != null && age < 18)) return 'under_18';
  if (age == null) return null;
  return age >= 60 ? '60_plus' : '18_59';
}

function toEvent(e: any) {
  return {
    id: e.id,
    fromStage: e.from_stage,
    toStage: e.to_stage,
    action: e.action,
    actorName: e.actor_name,
    actorRole: e.actor_role,
    note: e.note,
    createdAt: e.created_at,
  };
}

function toFollowUp(f: any) {
  return {
    id: f.id,
    caseId: f.case_id,
    referralId: f.referral_id,
    dueAt: f.due_at,
    result: f.result,
    note: f.note,
    completedByName: f.completed_by_name,
    completedAt: f.completed_at,
  };
}

function toEscalation(e: any) {
  return {
    id: e.id,
    caseId: e.case_id,
    kind: e.kind,
    reason: e.reason,
    status: e.status,
    resolutionNote: e.resolution_note,
    resolvedAt: e.resolved_at,
    createdAt: e.created_at,
  };
}

// ---------------------------------------------------------------------------
// Consent & Boundaries
// ---------------------------------------------------------------------------

const consentSchema = z.object({
  verbalConsent: z.literal(true),
  allowPhoto: z.boolean(),
  allowPhone: z.boolean(),
  allowSharingWithPartner: z.boolean(),
  preferredAddress: z.string().trim().max(40).optional().nullable(),
  minimumDataOnly: z.boolean().default(true),
});

loopRoutes.put('/cases/:id/consent', async (c) => {
  const body = await readBody(c, consentSchema);
  if (!body.ok) return body.res;
  const db = c.env.DB;
  const id = c.req.param('id');
  const row = await loadCase(db, id);
  if (!row) return fail(c, 404, 'NOT_FOUND', 'Case not found');
  const user = userOf(c);
  const at = nowIso();
  await setCase(db, id, {
    consent_json: JSON.stringify({ ...body.data, recordedBy: user.name, recordedAt: at }),
    consent_given_at: at,
    preferred_address: body.data.preferredAddress ?? null,
    stage: row.stage === 'CONSENT' ? 'UNDERSTAND' : row.stage,
  });
  await factStmt(db, id, 'consent', body.data, 'BENEFICIARY_STATED', user).run();
  return c.json({ case: toCase(await loadCase(db, id)) });
});

// ---------------------------------------------------------------------------
// Understand Need (priority + strengths)
// ---------------------------------------------------------------------------

const sourceEnum = z.enum(PROVENANCE_SOURCES);
const understandingSchema = z.object({
  priorityStatement: z.string().trim().min(3).max(500),
  need: z.enum(NEED_CATEGORIES),
  district: z.string().trim().min(2).max(60),
  ward: z.string().trim().max(60).optional().nullable(),
  age: z.number().int().min(0).max(120).optional().nullable(),
  isMinor: z.boolean().optional(),
  targetGroup: z.string().trim().max(40).optional().nullable(),
  hasIdentityDoc: z.boolean().optional().nullable(),
  strengths: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
  constraints: z.object({ daytimeOnly: z.boolean().default(false), weekendOnly: z.boolean().default(false) }).default({}),
  urgency: z.enum(['normal', 'urgent']).default('normal'),
  sources: z.record(sourceEnum).default({}),
});

loopRoutes.put('/cases/:id/understanding', async (c) => {
  const body = await readBody(c, understandingSchema);
  if (!body.ok) return body.res;
  const db = c.env.DB;
  const id = c.req.param('id');
  const row = await loadCase(db, id);
  if (!row) return fail(c, 404, 'NOT_FOUND', 'Case not found');
  if (!row.consent_given_at) return fail(c, 409, 'CONSENT_REQUIRED', 'Record consent before collecting more information');
  const d = body.data;
  const user = userOf(c);
  const isMinor = Boolean(d.isMinor) || (d.age != null && d.age < 18);

  await setCase(db, id, {
    priority_statement: d.priorityStatement,
    need_category: d.need,
    district: d.district,
    ward: d.ward ?? null,
    age: d.age ?? null,
    is_minor: isMinor ? 1 : 0,
    target_group: d.targetGroup ?? null,
    has_identity_doc: d.hasIdentityDoc == null ? null : d.hasIdentityDoc ? 1 : 0,
    strengths_json: JSON.stringify(d.strengths),
    constraints_json: JSON.stringify(d.constraints),
    urgency: d.urgency,
    stage: 'RISK',
    risk_decision: null,
    risk_json: null,
  });

  const fields: Array<[string, unknown]> = [
    ['priority_statement', d.priorityStatement],
    ['need', d.need],
    ['location', { district: d.district, ward: d.ward ?? null }],
    ['strengths', d.strengths],
    ['constraints', d.constraints],
  ];
  if (d.age != null) fields.push(['age', d.age]);
  await db.batch(fields.map(([field, value]) => factStmt(db, id, field, value, d.sources[field] ?? 'BENEFICIARY_STATED', user)));
  return c.json({ case: toCase(await loadCase(db, id)) });
});

// ---------------------------------------------------------------------------
// AI assist — suggestion only
// ---------------------------------------------------------------------------

loopRoutes.post('/assist/structure', async (c) => {
  const body = await readBody(c, z.object({ text: z.string().max(4000), useModel: z.boolean().default(true) }));
  if (!body.ok) return body.res;
  const rules = suggestFromNote(body.data.text);
  let missingQuestions: string[] = [];
  let model: string | null = null;

  if (body.data.useModel && c.env.AI && body.data.text.trim().length > 20) {
    try {
      const run = (c.env.AI as any).run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          {
            role: 'system',
            content:
              'You help a youth volunteer in Ho Chi Minh City structure a field note. Do NOT give advice or decide anything. ' +
              'Reply with JSON only: {"missing_questions": [up to 3 short Vietnamese questions the volunteer should still ask]}.',
          },
          { role: 'user', content: body.data.text },
        ],
        max_tokens: 200,
      });
      const out: any = await Promise.race([run, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))]);
      const text = typeof out?.response === 'string' ? out.response : JSON.stringify(out?.response ?? {});
      const json = parse<{ missing_questions?: unknown }>(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1), {});
      if (Array.isArray(json.missing_questions)) {
        missingQuestions = json.missing_questions.filter((q): q is string => typeof q === 'string').slice(0, 3);
        model = 'workers-ai/llama-3.1-8b-instruct';
      }
    } catch {
      model = null;
    }
  }

  return c.json({ suggestion: { ...rules, missingQuestions, model }, source: 'AI_SUGGESTED', authority: 'SUGGEST_ONLY' });
});

// ---------------------------------------------------------------------------
// Risk & Safeguarding gate
// ---------------------------------------------------------------------------

const flagCodes = z.enum([
  'CHILD_PRESENT',
  'VIOLENCE_OR_ABUSE',
  'SELF_HARM',
  'MEDICAL_EMERGENCY',
  'EXPLOITATION_OR_TRAFFICKING',
  'SCAM_PATTERN',
  'IMPERSONATION_PATTERN',
  'NO_SAFE_SHELTER_TONIGHT',
  'OTHER',
]);

loopRoutes.post('/cases/:id/risk-gate', async (c) => {
  const body = await readBody(c, z.object({ navigatorFlags: z.array(flagCodes).default([]), aiFlags: z.array(flagCodes).default([]) }));
  if (!body.ok) return body.res;
  const db = c.env.DB;
  const id = c.req.param('id');
  const row = await loadCase(db, id);
  if (!row) return fail(c, 404, 'NOT_FOUND', 'Case not found');
  const user = userOf(c);

  const result = evaluateRiskGate({
    text: riskText(row),
    age: row.age,
    isMinor: row.is_minor === 1,
    hasConsent: Boolean(row.consent_given_at),
    need: row.need_category,
    district: row.district,
    navigatorFlags: body.data.navigatorFlags as RiskFlagCode[],
    aiFlags: body.data.aiFlags as RiskFlagCode[],
  });

  const stage = result.decision === 'PROCEED' ? 'MATCH' : result.decision === 'ASK_MORE' ? 'UNDERSTAND' : 'RISK';
  await setCase(db, id, { risk_decision: result.decision, risk_json: JSON.stringify(result), stage });

  if (result.requiresHuman) {
    const open = await db.prepare("SELECT id FROM loop_escalations WHERE case_id = ? AND status = 'OPEN'").bind(id).first();
    if (!open) {
      const kind = result.decision === 'EMERGENCY_111' || result.call111 ? 'HOTLINE_111' : 'HUMAN_REVIEW';
      await db
        .prepare('INSERT INTO loop_escalations (id, case_id, kind, reason, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(newId('esc'), id, kind, result.flags.map((f) => `${f.code} ${f.evidence}`).join('; '), 'OPEN', user.id, nowIso())
        .run();
    }
  }
  return c.json({ risk: result, case: toCase(await loadCase(db, id)) });
});

loopRoutes.post('/cases/:id/risk-review', async (c) => {
  const user = userOf(c);
  if (user.actor !== 'COORDINATOR') return fail(c, 403, 'COORDINATOR_ONLY', 'Only a coordinator can clear a safeguarding hold');
  const body = await readBody(
    c,
    z.object({ approved: z.boolean(), note: z.string().trim().min(3).max(1000), escalationLogged: z.boolean().default(false) }),
  );
  if (!body.ok) return body.res;
  const db = c.env.DB;
  const id = c.req.param('id');
  const row = await loadCase(db, id);
  if (!row) return fail(c, 404, 'NOT_FOUND', 'Case not found');
  const risk = parse<RiskGateResult | null>(row.risk_json, null);
  if (!risk) return fail(c, 409, 'RISK_GATE_NOT_RUN', 'Run the risk gate first');

  const decision = applyHumanReview(risk, body.data);
  const at = nowIso();
  await setCase(db, id, {
    risk_decision: decision,
    risk_reviewed_by: user.name,
    risk_reviewed_at: at,
    stage: decision === 'PROCEED' ? 'MATCH' : row.stage,
  });
  if (body.data.approved) {
    await db
      .prepare("UPDATE loop_escalations SET status = 'RESOLVED', resolved_by = ?, resolution_note = ?, resolved_at = ? WHERE case_id = ? AND status = 'OPEN'")
      .bind(user.name, body.data.note, at, id)
      .run();
  }
  await factStmt(db, id, 'risk_review', { approved: body.data.approved, decision, note: body.data.note }, 'HUMAN_VERIFIED', user).run();
  return c.json({ decision, case: toCase(await loadCase(db, id)) });
});

// ---------------------------------------------------------------------------
// Verified resource match
// ---------------------------------------------------------------------------

loopRoutes.post('/cases/:id/match', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const row = await loadCase(db, id);
  if (!row) return fail(c, 404, 'NOT_FOUND', 'Case not found');
  if (row.risk_decision !== 'PROCEED') {
    return fail(c, 409, 'RISK_GATE_BLOCKED', 'The risk gate must allow this journey before matching', { decision: row.risk_decision });
  }
  const risk = parse<RiskGateResult | null>(row.risk_json, null);
  const { results } = await db.prepare('SELECT * FROM directory_resources').all<any>();
  const resources = (results ?? []).map(toDirectoryResource);

  const result = runMatchPipeline(
    {
      need: row.need_category,
      district: row.district,
      age: row.age,
      targetGroup: row.target_group,
      hasIdentityDoc: row.has_identity_doc == null ? null : row.has_identity_doc === 1,
      constraints: parse(row.constraints_json, {}),
      strengths: parse<string[]>(row.strengths_json, []),
      blockEmployment: Boolean(risk?.blocksEmploymentReferral) || row.is_minor === 1,
    },
    resources,
  );

  const user = userOf(c);
  const matchId = newId('match');
  await db
    .prepare('INSERT INTO loop_matches (id, case_id, result_json, candidate_count, run_by, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(matchId, id, JSON.stringify(result), result.candidates.length, user.id, nowIso())
    .run();
  await setCase(db, id, { stage: 'NEXT_STEP' });
  return c.json({ match: { id: matchId, ...result } });
});

// ---------------------------------------------------------------------------
// Safe Next Step
// ---------------------------------------------------------------------------

const nextStepSchema = z.object({
  resourceId: z.string().min(1),
  action: z.string().trim().min(5).max(300),
  ownerName: z.string().trim().min(2).max(80),
  ownerRole: z.enum(['BENEFICIARY', 'NAVIGATOR', 'PARTNER']),
  place: z.string().trim().min(3).max(200),
  dueAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
});

loopRoutes.post('/cases/:id/next-steps', async (c) => {
  const body = await readBody(c, nextStepSchema);
  if (!body.ok) return body.res;
  const db = c.env.DB;
  const id = c.req.param('id');
  const row = await loadCase(db, id);
  if (!row) return fail(c, 404, 'NOT_FOUND', 'Case not found');
  if (row.risk_decision !== 'PROCEED') return fail(c, 409, 'RISK_GATE_BLOCKED', 'The risk gate must allow this journey first');

  const match = await db.prepare('SELECT result_json FROM loop_matches WHERE case_id = ? ORDER BY created_at DESC LIMIT 1').bind(id).first<any>();
  const candidates = parse<{ candidates?: Array<{ resource: { id: string } }> }>(match?.result_json, {}).candidates ?? [];
  if (!candidates.some((cand) => cand.resource.id === body.data.resourceId)) {
    return fail(c, 409, 'NOT_A_MATCH', 'A Safe Next Step must use a resource that passed the match pipeline');
  }
  const resource = await db.prepare('SELECT * FROM directory_resources WHERE id = ?').bind(body.data.resourceId).first<any>();
  if (!resource) return fail(c, 404, 'RESOURCE_NOT_FOUND', 'Resource not found');
  const r = toDirectoryResource(resource);
  if (r.freshness === 'UNCONFIRMED' || r.freshness === 'INACTIVE') {
    return fail(c, 409, 'RESOURCE_NOT_VERIFIED', 'This resource is not verified');
  }

  const user = userOf(c);
  const stepId = newId('sns');
  const at = nowIso();
  await db.batch([
    db.prepare("UPDATE loop_next_steps SET status = 'CANCELLED' WHERE case_id = ? AND status = 'PROPOSED'").bind(id),
    db
      .prepare(
        `INSERT INTO loop_next_steps (id, case_id, resource_id, action, owner_name, owner_role, place, due_at,
          verification_snapshot, verified_at_snapshot, status, proposed_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PROPOSED', ?, ?)`,
      )
      .bind(
        stepId,
        id,
        r.id,
        body.data.action,
        body.data.ownerName,
        body.data.ownerRole,
        body.data.place,
        new Date(body.data.dueAt).toISOString(),
        r.freshness,
        r.verifiedAt ?? null,
        user.id,
        at,
      ),
  ]);
  const step = await db
    .prepare('SELECT s.*, d.organisation_name, d.service_name, d.phone, d.address FROM loop_next_steps s LEFT JOIN directory_resources d ON d.id = s.resource_id WHERE s.id = ?')
    .bind(stepId)
    .first<any>();
  return c.json({ nextStep: toNextStep(step) }, 201);
});

loopRoutes.post('/next-steps/:id/confirm', async (c) => {
  const body = await readBody(
    c,
    z.object({ beneficiaryAgreed: z.literal(true), contactConfirmed: z.boolean().default(false), note: z.string().max(500).optional() }),
  );
  if (!body.ok) return body.res;
  const db = c.env.DB;
  const step = await db.prepare('SELECT * FROM loop_next_steps WHERE id = ?').bind(c.req.param('id')).first<any>();
  if (!step) return fail(c, 404, 'NOT_FOUND', 'Safe Next Step not found');
  if (!(await canSeeCase(db, scopeOf(c.get('user')), step.case_id))) return fail(c, 403, 'SCOPE_FORBIDDEN', 'Not your organisation');
  if (step.status !== 'PROPOSED') return fail(c, 409, 'INVALID_STATE', `Safe Next Step is ${step.status}`);
  if (step.verification_snapshot !== 'VERIFIED' && !body.data.contactConfirmed) {
    return fail(c, 409, 'CONTACT_CONFIRMATION_REQUIRED', 'This resource needs re-check: call to confirm before committing to it');
  }
  const resource = await db.prepare('SELECT accepts_referral FROM directory_resources WHERE id = ?').bind(step.resource_id).first<any>();
  const user = userOf(c);
  const at = nowIso();
  const followUpDue = new Date(new Date(step.due_at).getTime() + 86_400_000).toISOString();
  const stmts = [
    // A confirming call upgrades this step's evidence (not the directory entry — that needs a full verification).
    step.verification_snapshot !== 'VERIFIED' && body.data.contactConfirmed
      ? db
          .prepare("UPDATE loop_next_steps SET status = 'CONFIRMED', confirmed_by = ?, confirmed_at = ?, verification_snapshot = 'CONTACT_CONFIRMED', verified_at_snapshot = ? WHERE id = ?")
          .bind(user.id, at, at, step.id)
      : db.prepare("UPDATE loop_next_steps SET status = 'CONFIRMED', confirmed_by = ?, confirmed_at = ? WHERE id = ?").bind(user.id, at, step.id),
    factStmt(db, step.case_id, 'safe_next_step', { id: step.id, action: step.action, contactConfirmed: body.data.contactConfirmed }, 'HUMAN_VERIFIED', user),
  ];

  let referralId: string | null = null;
  if (resource?.accepts_referral === 1) {
    referralId = newId('ref');
    const code = `R-${at.slice(2, 10).replace(/-/g, '')}-${referralId.slice(-4).toUpperCase()}`;
    stmts.push(
      db
        .prepare(
          `INSERT INTO loop_referrals (id, code, case_id, next_step_id, resource_id, stage, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'CREATED', ?, ?, ?)`,
        )
        .bind(referralId, code, step.case_id, step.id, step.resource_id, user.id, at, at),
      db
        .prepare(
          `INSERT INTO loop_referral_events (id, referral_id, case_id, from_stage, to_stage, action, actor_id, actor_name, actor_role, note, created_at)
           VALUES (?, ?, ?, NULL, 'CREATED', 'create', ?, ?, ?, ?, ?)`,
        )
        .bind(newId('rev'), referralId, step.case_id, user.id, user.name, user.actor, body.data.note ?? null, at),
    );
  }
  stmts.push(
    db
      .prepare('INSERT INTO loop_follow_ups (id, case_id, referral_id, due_at, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(newId('fu'), step.case_id, referralId, followUpDue, at),
    db
      .prepare('UPDATE loop_cases SET stage = ?, updated_at = ? WHERE id = ?')
      .bind(referralId ? 'CONNECTED' : 'FOLLOW_UP', at, step.case_id),
  );
  await db.batch(stmts);
  return c.json({ nextStepId: step.id, referralId, followUpDue });
});

// ---------------------------------------------------------------------------
// Referral & Handoff (partner inbox)
// ---------------------------------------------------------------------------

loopRoutes.get('/referrals', async (c) => {
  const stage = c.req.query('stage');
  const db = c.env.DB;
  const actor = userOf(c).actor;
  const scope = scopeOf(c.get('user'));
  const where: string[] = [];
  const binds: unknown[] = [];
  if (stage) (where.push('r.stage = ?'), binds.push(stage));
  if (scope.kind === 'partner') (where.push('d.partner_org_id = ?'), binds.push(scope.orgId));
  if (scope.kind === 'host') (where.push('r.case_id IN (SELECT case_id FROM loop_case_scope WHERE host_org_id = ?)'), binds.push(scope.orgId));
  else where.push(`r.case_id NOT IN ${TRIAL_CASES_SQL}`);
  const { results } = await db
    .prepare(
      `SELECT r.*, d.organisation_name, d.service_name, c.alias, c.need_category, c.preferred_address, c.urgency,
              s.action, s.place, s.due_at, s.owner_name, s.owner_role, c.navigator_name,
              c.age, c.is_minor, c.target_group, c.district, c.priority_statement, c.consent_json,
              (SELECT json_object('note', q.note, 'at', q.created_at, 'by', q.actor_name) FROM loop_referral_events q
                WHERE q.referral_id = r.id AND q.action = 'question' ORDER BY q.created_at DESC LIMIT 1) AS last_question
       FROM loop_referrals r
       JOIN loop_cases c ON c.id = r.case_id
       LEFT JOIN loop_next_steps s ON s.id = r.next_step_id
       LEFT JOIN directory_resources d ON d.id = r.resource_id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY r.updated_at DESC LIMIT 200`,
    )
    .bind(...(binds as any[]))
    .all<any>();
  // Minimum necessary data for partners: alias, need, the agreed step, an age BAND and the district
  // (enough to judge fit). The person's own goal is shared only if they agreed to share with partners.
  // Never: exact age, ward/address, observation notes, ID numbers.
  return c.json({
    referrals: (results ?? []).map((r) => ({
      ...toReferral(r),
      ageBand: ageBand(r.age, Boolean(r.is_minor)),
      district: r.district,
      goal: parse<{ allowSharingWithPartner?: boolean } | null>(r.consent_json, null)?.allowSharingWithPartner ? r.priority_statement : null,
      lastQuestion: parse<{ note: string; at: string; by: string } | null>(r.last_question, null),
      alias: r.alias,
      preferredAddress: r.preferred_address,
      need: r.need_category,
      urgency: r.urgency,
      action: r.action,
      place: r.place,
      dueAt: r.due_at,
      ownerName: r.owner_name,
      navigatorName: r.navigator_name,
      availableActions: availableLoopActions(r.stage, actor),
    })),
  });
});

const actionSchema = z.object({
  action: z.enum(['receive', 'accept', 'decline', 'mark_action_taken', 'record_outcome', 'complete_follow_up', 'close', 'escalate']),
  reason: z.string().trim().max(500).optional(),
  note: z.string().trim().max(1000).optional(),
});

loopRoutes.post('/referrals/:id/actions', async (c) => {
  const body = await readBody(c, actionSchema);
  if (!body.ok) return body.res;
  const db = c.env.DB;
  const ref = await db.prepare('SELECT * FROM loop_referrals WHERE id = ?').bind(c.req.param('id')).first<any>();
  if (!ref) return fail(c, 404, 'NOT_FOUND', 'Referral not found');
  const scope = scopeOf(c.get('user'));
  if (scope.kind === 'partner') {
    const owner = await db.prepare('SELECT partner_org_id FROM directory_resources WHERE id = ?').bind(ref.resource_id).first<any>();
    if (owner?.partner_org_id !== scope.orgId) return fail(c, 403, 'SCOPE_FORBIDDEN', 'This referral was sent to another organisation');
  } else if (!(await canSeeCase(db, scope, ref.case_id))) {
    return fail(c, 403, 'SCOPE_FORBIDDEN', 'Not your organisation');
  }
  const user = userOf(c);
  const res = await applyReferralAction(db, ref, body.data.action as LoopAction, user, body.data.reason, body.data.note);
  if (!res.ok) return fail(c, res.code === 'ACTOR_NOT_ALLOWED' ? 403 : 409, res.code, res.message, { stage: ref.stage });
  return c.json({ referral: { id: ref.id, stage: res.stage }, path: res.path });
});

// Partner asks the navigator for missing information without changing the referral stage.
loopRoutes.post('/referrals/:id/questions', async (c) => {
  const body = await readBody(c, z.object({ question: z.string().trim().min(5).max(500) }));
  if (!body.ok) return body.res;
  const db = c.env.DB;
  const ref = await db.prepare('SELECT * FROM loop_referrals WHERE id = ?').bind(c.req.param('id')).first<any>();
  if (!ref) return fail(c, 404, 'NOT_FOUND', 'Referral not found');
  const scope = scopeOf(c.get('user'));
  if (scope.kind === 'partner') {
    const owner = await db.prepare('SELECT partner_org_id FROM directory_resources WHERE id = ?').bind(ref.resource_id).first<any>();
    if (owner?.partner_org_id !== scope.orgId) return fail(c, 403, 'SCOPE_FORBIDDEN', 'This referral was sent to another organisation');
  } else if (!(await canSeeCase(db, scope, ref.case_id))) {
    return fail(c, 403, 'SCOPE_FORBIDDEN', 'Not your organisation');
  }
  if (['CLOSED', 'DECLINED'].includes(ref.stage)) return fail(c, 409, 'REFERRAL_CLOSED', 'This referral is no longer open');
  const user = userOf(c);
  const at = nowIso();
  await db.batch([
    db
      .prepare(
        `INSERT INTO loop_referral_events (id, referral_id, case_id, from_stage, to_stage, action, actor_id, actor_name, actor_role, note, created_at)
         VALUES (?, ?, ?, ?, ?, 'question', ?, ?, ?, ?, ?)`,
      )
      .bind(newId('rev'), ref.id, ref.case_id, ref.stage, ref.stage, user.id, user.name, user.actor, body.data.question, at),
    db.prepare('UPDATE loop_referrals SET updated_at = ? WHERE id = ?').bind(at, ref.id),
  ]);
  return c.json({ ok: true, question: { note: body.data.question, at, by: user.name } }, 201);
});

async function applyReferralAction(
  db: D1Database,
  ref: any,
  action: LoopAction,
  user: { id: string; name: string; actor: LoopActor },
  reason?: string,
  note?: string,
): Promise<{ ok: true; stage: LoopStage; path: LoopStage[] } | { ok: false; code: string; message: string }> {
  const plan = planLoopAction(ref.stage, action, user.actor, { reason });
  if (!plan.ok) return { ok: false, code: plan.code, message: plan.message };
  const at = nowIso();
  const stmts: D1PreparedStatement[] = [];
  let from: LoopStage = plan.from;
  for (const to of plan.path) {
    stmts.push(
      db
        .prepare(
          `INSERT INTO loop_referral_events (id, referral_id, case_id, from_stage, to_stage, action, actor_id, actor_name, actor_role, note, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(newId('rev'), ref.id, ref.case_id, from, to, to === plan.path[plan.path.length - 1] ? action : 'receive', user.id, user.name, user.actor, reason ?? note ?? null, at),
    );
    from = to;
  }
  const final = plan.path[plan.path.length - 1];
  stmts.push(
    db
      .prepare('UPDATE loop_referrals SET stage = ?, decline_reason = COALESCE(?, decline_reason), outcome_note = COALESCE(?, outcome_note), updated_at = ? WHERE id = ?')
      .bind(final, action === 'decline' ? reason ?? null : null, action === 'record_outcome' ? note ?? null : null, at, ref.id),
  );

  // Side effects on the journey
  if (action === 'decline') {
    // No referral disappears silently: the journey goes back to choosing another Safe Next Step.
    stmts.push(
      db.prepare("UPDATE loop_next_steps SET status = 'CANCELLED' WHERE id = ?").bind(ref.next_step_id),
      db.prepare('DELETE FROM loop_follow_ups WHERE referral_id = ? AND result IS NULL').bind(ref.id),
      db.prepare("UPDATE loop_cases SET stage = 'NEXT_STEP', updated_at = ? WHERE id = ?").bind(at, ref.case_id),
    );
  } else if (action === 'mark_action_taken') {
    stmts.push(db.prepare("UPDATE loop_next_steps SET status = 'REACHED' WHERE id = ?").bind(ref.next_step_id));
  } else if (action === 'record_outcome') {
    stmts.push(db.prepare("UPDATE loop_cases SET stage = 'FOLLOW_UP', updated_at = ? WHERE id = ?").bind(at, ref.case_id));
  } else if (action === 'escalate') {
    stmts.push(
      db
        .prepare("INSERT INTO loop_escalations (id, case_id, kind, reason, status, created_by, created_at) VALUES (?, ?, 'HUMAN_REVIEW', ?, 'OPEN', ?, ?)")
        .bind(newId('esc'), ref.case_id, reason ?? 'Escalated', user.id, at),
      db.prepare("UPDATE loop_cases SET stage = 'ESCALATED', updated_at = ? WHERE id = ?").bind(at, ref.case_id),
    );
  } else if (action === 'close') {
    stmts.push(
      db.prepare("UPDATE loop_cases SET stage = 'CLOSED', status = 'CLOSED', closed_at = ?, updated_at = ? WHERE id = ?").bind(at, at, ref.case_id),
    );
  }
  await db.batch(stmts);
  return { ok: true, stage: final, path: plan.path };
}

// ---------------------------------------------------------------------------
// Follow-up & Outcome
// ---------------------------------------------------------------------------

loopRoutes.get('/follow-ups', async (c) => {
  const db = c.env.DB;
  const scope = caseScopeSql(scopeOf(c.get('user')));
  // ?status=done&since=ISO → completed check-ins (weekly count, "last check-in" on the detail panel)
  if (c.req.query('status') === 'done') {
    const since = c.req.query('since') ?? new Date(Date.now() - 30 * 86_400_000).toISOString();
    const { results } = await db
      .prepare(
        `SELECT f.*, c.alias, c.need_category FROM loop_follow_ups f
         JOIN loop_cases c ON c.id = f.case_id
         WHERE f.result IS NOT NULL AND f.completed_at >= ? AND ${scope.sql} ORDER BY f.completed_at DESC LIMIT 200`,
      )
      .bind(since, ...(scope.binds as any[]))
      .all<any>();
    return c.json({ followUps: (results ?? []).map((f) => ({ ...toFollowUp(f), alias: f.alias, need: f.need_category })) });
  }
  const until = c.req.query('until') ?? new Date(Date.now() + 2 * 86_400_000).toISOString();
  const { results } = await db
    .prepare(
      `SELECT f.*, c.alias, c.need_category, s.action FROM loop_follow_ups f
       JOIN loop_cases c ON c.id = f.case_id
       LEFT JOIN loop_referrals r ON r.id = f.referral_id
       LEFT JOIN loop_next_steps s ON s.id = r.next_step_id
       WHERE f.result IS NULL AND f.due_at <= ? AND c.status = 'OPEN' AND ${caseScopeSql(scopeOf(c.get('user'))).sql} ORDER BY f.due_at ASC`,
    )
    .bind(until, ...(caseScopeSql(scopeOf(c.get('user'))).binds as any[]))
    .all<any>();
  return c.json({
    followUps: (results ?? []).map((f) => ({ ...toFollowUp(f), alias: f.alias, need: f.need_category, action: f.action })),
  });
});

// Reschedule a pending check-in. The reason is kept as a fact so the journey shows why it moved.
loopRoutes.put('/follow-ups/:id', async (c) => {
  const body = await readBody(
    c,
    z.object({
      dueAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
      reason: z.string().trim().min(3).max(300),
    }),
  );
  if (!body.ok) return body.res;
  const db = c.env.DB;
  const fu = await db.prepare('SELECT * FROM loop_follow_ups WHERE id = ?').bind(c.req.param('id')).first<any>();
  if (!fu) return fail(c, 404, 'NOT_FOUND', 'Follow-up not found');
  if (!(await canSeeCase(db, scopeOf(c.get('user')), fu.case_id))) return fail(c, 403, 'SCOPE_FORBIDDEN', 'Not your organisation');
  if (fu.result) return fail(c, 409, 'ALREADY_RECORDED', 'This follow-up is already recorded');
  const due = new Date(body.data.dueAt);
  if (due.getTime() < Date.now() - 60_000) return fail(c, 400, 'DUE_IN_PAST', 'New time must be in the future');
  if (due.getTime() > Date.now() + 30 * 86_400_000) return fail(c, 400, 'DUE_TOO_FAR', 'Reschedule within 30 days so the person is not lost');
  const user = userOf(c);
  await db.prepare('UPDATE loop_follow_ups SET due_at = ? WHERE id = ?').bind(due.toISOString(), fu.id).run();
  await factStmt(db, fu.case_id, 'follow_up_rescheduled', { from: fu.due_at, to: due.toISOString(), reason: body.data.reason }, 'NAVIGATOR_OBSERVED', user).run();
  const updated = await db.prepare('SELECT * FROM loop_follow_ups WHERE id = ?').bind(fu.id).first<any>();
  return c.json({ followUp: toFollowUp(updated) });
});

loopRoutes.post('/follow-ups/:id', async (c) => {
  const body = await readBody(c, z.object({ result: z.enum(FOLLOW_UP_RESULTS), note: z.string().trim().max(1000).optional() }));
  if (!body.ok) return body.res;
  const db = c.env.DB;
  const fu = await db.prepare('SELECT * FROM loop_follow_ups WHERE id = ?').bind(c.req.param('id')).first<any>();
  if (!fu) return fail(c, 404, 'NOT_FOUND', 'Follow-up not found');
  if (!(await canSeeCase(db, scopeOf(c.get('user')), fu.case_id))) return fail(c, 403, 'SCOPE_FORBIDDEN', 'Not your organisation');
  if (fu.result) return fail(c, 409, 'ALREADY_RECORDED', 'This follow-up is already recorded');
  const user = userOf(c);
  const at = nowIso();
  const consequence = followUpConsequence(body.data.result);

  await db
    .prepare('UPDATE loop_follow_ups SET result = ?, note = ?, completed_by = ?, completed_by_name = ?, completed_at = ? WHERE id = ?')
    .bind(body.data.result, body.data.note ?? null, user.id, user.name, at, fu.id)
    .run();
  await factStmt(db, fu.case_id, 'follow_up', { result: body.data.result, note: body.data.note ?? null }, 'BENEFICIARY_STATED', user).run();

  let referralStage: LoopStage | null = null;
  if (fu.referral_id && consequence.completesFollowUp) {
    const ref = await db.prepare('SELECT * FROM loop_referrals WHERE id = ?').bind(fu.referral_id).first<any>();
    if (ref && ref.stage === 'ACTION_TAKEN') {
      const r = await applyReferralAction(db, ref, 'record_outcome', { ...user, actor: 'NAVIGATOR' }, undefined, body.data.note);
      if (r.ok) ref.stage = r.stage;
    }
    if (ref && ref.stage === 'OUTCOME_RECORDED') {
      const r = await applyReferralAction(db, ref, 'complete_follow_up', { ...user, actor: 'NAVIGATOR' }, undefined, body.data.result);
      if (r.ok) referralStage = r.stage;
    } else if (ref) {
      referralStage = ref.stage;
    }
  }

  if (consequence.nextFollowUpInDays) {
    await db
      .prepare('INSERT INTO loop_follow_ups (id, case_id, referral_id, due_at, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(newId('fu'), fu.case_id, fu.referral_id, new Date(Date.now() + consequence.nextFollowUpInDays * 86_400_000).toISOString(), at)
      .run();
  }
  if (consequence.requiresReview) {
    await db
      .prepare("INSERT INTO loop_escalations (id, case_id, kind, reason, status, created_by, created_at) VALUES (?, ?, 'HUMAN_REVIEW', ?, 'OPEN', ?, ?)")
      .bind(newId('esc'), fu.case_id, `Follow-up: situation is harder. ${body.data.note ?? ''}`.trim(), user.id, at)
      .run();
  }
  if (consequence.reopenNeed) {
    await setCase(db, fu.case_id, { stage: 'NEXT_STEP' });
  } else if (consequence.completesFollowUp) {
    await setCase(db, fu.case_id, { stage: 'FOLLOW_UP' });
  }
  return c.json({ consequence, referralStage });
});

loopRoutes.post('/cases/:id/close', async (c) => {
  const body = await readBody(c, z.object({ reason: z.string().trim().min(3).max(500) }));
  if (!body.ok) return body.res;
  const db = c.env.DB;
  const id = c.req.param('id');
  const row = await loadCase(db, id);
  if (!row) return fail(c, 404, 'NOT_FOUND', 'Case not found');
  const open = await db
    .prepare("SELECT id, stage FROM loop_referrals WHERE case_id = ? AND stage NOT IN ('CLOSED','ESCALATED')")
    .bind(id)
    .all<any>();
  const blocking = (open.results ?? []).filter((r) => r.stage !== 'FOLLOW_UP_DONE' && r.stage !== 'DECLINED');
  if (blocking.length > 0) {
    return fail(c, 409, 'OPEN_REFERRAL', 'Close or escalate the open referral first — no referral disappears silently');
  }
  const user = userOf(c);
  for (const r of open.results ?? []) {
    await applyReferralAction(db, r, 'close', { ...user, actor: 'COORDINATOR' }, undefined, body.data.reason);
  }
  const at = nowIso();
  await setCase(db, id, { stage: 'CLOSED', status: 'CLOSED', closed_at: at });
  await factStmt(db, id, 'closed', { reason: body.data.reason }, 'NAVIGATOR_OBSERVED', user).run();
  return c.json({ case: toCase(await loadCase(db, id)) });
});

// ---------------------------------------------------------------------------
// Escalations
// ---------------------------------------------------------------------------

// A navigator or partner flags a case for a coordinator: "I noticed something I can't handle alone".
// One open HUMAN_REVIEW per case — a second report adds to the reason instead of spamming the queue.
loopRoutes.post('/cases/:id/escalate', async (c) => {
  const body = await readBody(c, z.object({ reason: z.string().trim().min(5).max(500) }));
  if (!body.ok) return body.res;
  const db = c.env.DB;
  const id = c.req.param('id');
  if (!(await loadCase(db, id))) return fail(c, 404, 'NOT_FOUND', 'Case not found');
  if (!(await canSeeCase(db, scopeOf(c.get('user')), id))) return fail(c, 403, 'SCOPE_FORBIDDEN', 'Not your organisation');
  const user = userOf(c);
  const at = nowIso();
  const open = await db.prepare("SELECT * FROM loop_escalations WHERE case_id = ? AND status = 'OPEN' AND kind = 'HUMAN_REVIEW'").bind(id).first<any>();
  if (open) {
    await db.prepare('UPDATE loop_escalations SET reason = ? WHERE id = ?').bind(`${open.reason}\n— ${user.name}: ${body.data.reason}`.slice(0, 2000), open.id).run();
  } else {
    await db
      .prepare("INSERT INTO loop_escalations (id, case_id, kind, reason, status, created_by, created_at) VALUES (?, ?, 'HUMAN_REVIEW', ?, 'OPEN', ?, ?)")
      .bind(newId('esc'), id, body.data.reason, user.id, at)
      .run();
  }
  await factStmt(db, id, 'escalation_reported', { reason: body.data.reason }, 'NAVIGATOR_OBSERVED', user).run();
  const row = await db.prepare("SELECT * FROM loop_escalations WHERE case_id = ? AND status = 'OPEN' AND kind = 'HUMAN_REVIEW'").bind(id).first<any>();
  return c.json({ escalation: toEscalation(row), merged: Boolean(open) }, open ? 200 : 201);
});

loopRoutes.get('/escalations', async (c) => {
  const status = c.req.query('status') ?? 'OPEN';
  const { results } = await c.env.DB.prepare(
    `SELECT e.*, c.alias, c.need_category FROM loop_escalations e JOIN loop_cases c ON c.id = e.case_id
     WHERE ${caseScopeSql(scopeOf(c.get('user'))).sql} ${status === 'ALL' ? '' : 'AND e.status = ?'} ORDER BY e.created_at DESC`,
  )
    .bind(...(caseScopeSql(scopeOf(c.get('user'))).binds as any[]), ...(status === 'ALL' ? [] : [status]))
    .all<any>();
  return c.json({ escalations: (results ?? []).map((e) => ({ ...toEscalation(e), alias: e.alias, need: e.need_category })) });
});

// ---------------------------------------------------------------------------
// Verified Resource Directory
// ---------------------------------------------------------------------------

loopRoutes.get('/directory', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM directory_resources ORDER BY organisation_name').all<any>();
  let items = (results ?? []).map(toDirectoryResource);
  const freshness = c.req.query('freshness');
  if (freshness) items = items.filter((r) => r.freshness === freshness);
  return c.json({ resources: items });
});

loopRoutes.get('/directory/:id', async (c) => {
  const db = c.env.DB;
  const row = await db.prepare('SELECT * FROM directory_resources WHERE id = ?').bind(c.req.param('id')).first<any>();
  if (!row) return fail(c, 404, 'NOT_FOUND', 'Resource not found');
  const { results } = await db
    .prepare('SELECT * FROM directory_verifications WHERE resource_id = ? ORDER BY created_at DESC')
    .bind(row.id)
    .all<any>();
  return c.json({
    resource: toDirectoryResource(row),
    verifications: (results ?? []).map((v) => ({
      id: v.id,
      statusBefore: v.status_before,
      statusAfter: v.status_after,
      method: v.method,
      notes: v.notes,
      sourceUrl: v.source_url,
      capacityStatus: v.capacity_status,
      slotsAvailable: v.slots_available,
      verifiedByName: v.verified_by_name,
      createdAt: v.created_at,
    })),
  });
});

const verifySchema = z.object({
  status: z.enum(['VERIFIED', 'NEEDS_RECHECK', 'UNCONFIRMED', 'INACTIVE']),
  method: z.enum(['PHONE_CALL', 'SITE_VISIT', 'OFFICIAL_DOCUMENT', 'PARTNER_PORTAL']),
  notes: z.string().trim().min(3).max(1000),
  sourceUrl: z.string().url().optional().nullable(),
  capacityStatus: z.enum(['AVAILABLE', 'LIMITED', 'FULL', 'UNKNOWN']).optional(),
  slotsAvailable: z.number().int().min(0).max(10000).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  validDays: z.number().int().min(7).max(180).default(90),
});

// Partner keeps its own intake capacity current. This does NOT touch verification (a human still
// verifies the service); it only changes what the match pipeline sees at the availability/capacity stages.
// Pausing sets capacity FULL so no new referral is routed while paused.
const capacitySchema = z.object({
  accepting: z.boolean(),
  slotsAvailable: z.number().int().min(0).max(500),
  slotsTotal: z.number().int().min(0).max(500),
  hours: z.object({ from: z.string().regex(/^\d{2}:\d{2}$/), to: z.string().regex(/^\d{2}:\d{2}$/) }),
  days: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).min(1),
  modes: z.array(z.enum(['in_person', 'online'])).min(1),
  serviceArea: z.array(z.string().trim().min(2).max(60)).min(1).max(30),
});

loopRoutes.put('/directory/:id/capacity', async (c) => {
  const body = await readBody(c, capacitySchema);
  if (!body.ok) return body.res;
  const d = body.data;
  if (d.slotsAvailable > d.slotsTotal) return fail(c, 400, 'SLOTS_EXCEED_TOTAL', 'Places left cannot exceed weekly places');
  if (d.hours.from >= d.hours.to) return fail(c, 400, 'HOURS_INVALID', 'Opening time must be before closing time');
  const db = c.env.DB;
  const row = await db.prepare('SELECT * FROM directory_resources WHERE id = ?').bind(c.req.param('id')).first<any>();
  if (!row) return fail(c, 404, 'NOT_FOUND', 'Resource not found');
  const scope = scopeOf(c.get('user'));
  if (scope.kind === 'partner' && row.partner_org_id !== scope.orgId) return fail(c, 403, 'SCOPE_FORBIDDEN', 'You can only update your own services');
  if (scope.kind === 'observer' || scope.kind === 'none') return fail(c, 403, 'SCOPE_FORBIDDEN', 'Read-only');
  const status = !d.accepting || d.slotsAvailable === 0 ? 'FULL' : d.slotsAvailable <= Math.max(2, Math.ceil(d.slotsTotal * 0.2)) ? 'LIMITED' : 'AVAILABLE';
  const at = nowIso();
  const availability = {
    ...parse<Record<string, unknown>>(row.availability_json, {}),
    days: d.days,
    hours: `${d.hours.from}-${d.hours.to}`,
    modes: d.modes,
    slotsTotal: d.slotsTotal,
    paused: !d.accepting,
  };
  await db
    .prepare(
      `UPDATE directory_resources SET availability_json = ?, service_area_json = ?, capacity_status = ?, slots_available = ?,
         capacity_checked_at = ?, updated_at = ? WHERE id = ?`,
    )
    .bind(JSON.stringify(availability), JSON.stringify(d.serviceArea), status, d.slotsAvailable, at, at, row.id)
    .run();
  const updated = await db.prepare('SELECT * FROM directory_resources WHERE id = ?').bind(row.id).first<any>();
  return c.json({ resource: toDirectoryResource(updated) });
});

loopRoutes.post('/directory/:id/verify', async (c) => {
  const body = await readBody(c, verifySchema);
  if (!body.ok) return body.res;
  const user = userOf(c);
  if (user.actor === 'PARTNER' && body.data.status === 'VERIFIED' && body.data.method !== 'PARTNER_PORTAL') {
    return fail(c, 403, 'PARTNER_SELF_REPORT_ONLY', 'Partners can only self-report via PARTNER_PORTAL');
  }
  const db = c.env.DB;
  const row = await db.prepare('SELECT * FROM directory_resources WHERE id = ?').bind(c.req.param('id')).first<any>();
  if (!row) return fail(c, 404, 'NOT_FOUND', 'Resource not found');
  const scope = scopeOf(c.get('user'));
  if (scope.kind === 'partner' && row.partner_org_id !== scope.orgId) return fail(c, 403, 'SCOPE_FORBIDDEN', 'You can only update your own services');
  const d = body.data;
  const at = nowIso();
  const verified = d.status === 'VERIFIED';
  await db.batch([
    db
      .prepare(
        `UPDATE directory_resources SET verification_status = ?, verified_at = ?, verification_expires_at = ?, verified_by = ?,
           verified_by_name = ?, verification_method = ?, verification_notes = ?,
           verification_source_url = COALESCE(?, verification_source_url),
           capacity_status = COALESCE(?, capacity_status), slots_available = COALESCE(?, slots_available),
           capacity_checked_at = CASE WHEN ? IS NOT NULL THEN ? ELSE capacity_checked_at END,
           phone = COALESCE(?, phone), updated_at = ? WHERE id = ?`,
      )
      .bind(
        d.status,
        verified ? at : row.verified_at,
        verified ? new Date(Date.now() + d.validDays * 86_400_000).toISOString() : row.verification_expires_at,
        user.id,
        user.name,
        d.method,
        d.notes,
        d.sourceUrl ?? null,
        d.capacityStatus ?? null,
        d.slotsAvailable ?? null,
        d.capacityStatus ?? null,
        at,
        d.phone ?? null,
        at,
        row.id,
      ),
    db
      .prepare(
        `INSERT INTO directory_verifications (id, resource_id, status_before, status_after, method, notes, source_url, capacity_status,
          slots_available, verified_by, verified_by_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(newId('ver'), row.id, row.verification_status, d.status, d.method, d.notes, d.sourceUrl ?? null, d.capacityStatus ?? null, d.slotsAvailable ?? null, user.id, user.name, at),
  ]);
  const updated = await db.prepare('SELECT * FROM directory_resources WHERE id = ?').bind(row.id).first<any>();
  return c.json({ resource: toDirectoryResource(updated) });
});

const createResourceSchema = z.object({
  organisationName: z.string().trim().min(2).max(160),
  serviceName: z.string().trim().min(2).max(200),
  category: z.enum(NEED_CATEGORIES),
  district: z.string().trim().min(2).max(60),
  ward: z.string().trim().max(60).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  website: z.string().url().optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
  serviceArea: z.array(z.string()).default([]),
  acceptsReferral: z.boolean().default(true),
  sourceUrl: z.string().url().optional().nullable(),
});

loopRoutes.post('/directory', async (c) => {
  const body = await readBody(c, createResourceSchema);
  if (!body.ok) return body.res;
  const d = body.data;
  const id = newId('dir');
  // A partner adding a service owns it (so it can later update its own capacity).
  const scope = scopeOf(c.get('user'));
  const ownerOrg = scope.kind === 'partner' ? scope.orgId || null : null;
  // New entries always start UNCONFIRMED — only a verification can promote them.
  await c.env.DB.prepare(
    `INSERT INTO directory_resources (id, organisation_name, service_name, category, description, district, ward, address, phone, website,
      service_area_json, accepts_referral, verification_status, verification_source_url, partner_org_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNCONFIRMED', ?, ?, ?, ?)`,
  )
    .bind(id, d.organisationName, d.serviceName, d.category, d.description ?? null, d.district, d.ward ?? null, d.address ?? null, d.phone ?? null, d.website ?? null, JSON.stringify(d.serviceArea), d.acceptsReferral ? 1 : 0, d.sourceUrl ?? null, ownerOrg, nowIso(), nowIso())
    .run();
  const row = await c.env.DB.prepare('SELECT * FROM directory_resources WHERE id = ?').bind(id).first<any>();
  return c.json({ resource: toDirectoryResource(row) }, 201);
});

// ---------------------------------------------------------------------------
// Metrics (North Star: Safe Next Step Rate)
// ---------------------------------------------------------------------------

loopRoutes.get('/metrics', async (c) => {
  const db = c.env.DB;
  const [cases, steps, refs, fus, res, escs] = await Promise.all([
    db.prepare(`SELECT id, created_at FROM loop_cases WHERE id NOT IN ${TRIAL_CASES_SQL}`).all<any>(),
    db.prepare(`SELECT case_id, status, confirmed_at FROM loop_next_steps WHERE case_id NOT IN ${TRIAL_CASES_SQL}`).all<any>(),
    db.prepare(`SELECT id, case_id, stage FROM loop_referrals WHERE case_id NOT IN ${TRIAL_CASES_SQL}`).all<any>(),
    db.prepare(`SELECT case_id, result, due_at, completed_at FROM loop_follow_ups WHERE case_id NOT IN ${TRIAL_CASES_SQL}`).all<any>(),
    db.prepare('SELECT verification_status, verified_at, verification_expires_at FROM directory_resources').all<any>(),
    db.prepare(`SELECT case_id FROM loop_escalations WHERE case_id NOT IN ${TRIAL_CASES_SQL}`).all<any>(),
  ]);
  const metrics = computeLoopMetrics({
    cases: (cases.results ?? []).map((r) => ({ id: r.id, createdAt: r.created_at })),
    safeNextSteps: (steps.results ?? []).map((r) => ({ caseId: r.case_id, status: r.status, confirmedAt: r.confirmed_at })),
    referrals: (refs.results ?? []).map((r) => ({ id: r.id, caseId: r.case_id, status: r.stage })),
    followUps: (fus.results ?? []).map((r) => ({ caseId: r.case_id, result: r.result, dueAt: r.due_at, completedAt: r.completed_at })),
    resources: (res.results ?? []).map((r) => ({
      verificationStatus: r.verification_status,
      verifiedAt: r.verified_at,
      verificationExpiresAt: r.verification_expires_at,
    })),
    escalations: (escs.results ?? []).map((r) => ({ caseId: r.case_id })),
  });
  return c.json({ metrics, generatedAt: nowIso() });
});

// ---------------------------------------------------------------------------
// Coordinator: resolve a reported concern, operational report
// ---------------------------------------------------------------------------

loopRoutes.post('/escalations/:id/resolve', async (c) => {
  const user = userOf(c);
  if (user.actor !== 'COORDINATOR') return fail(c, 403, 'COORDINATOR_ONLY', 'Only a coordinator can resolve an escalation');
  const body = await readBody(c, z.object({ note: z.string().trim().min(5).max(1000) }));
  if (!body.ok) return body.res;
  const db = c.env.DB;
  const esc = await db.prepare('SELECT * FROM loop_escalations WHERE id = ?').bind(c.req.param('id')).first<any>();
  if (!esc) return fail(c, 404, 'NOT_FOUND', 'Escalation not found');
  if (esc.status !== 'OPEN') return fail(c, 409, 'ALREADY_RESOLVED', 'Already resolved');
  // A risk-gate hold must be cleared through the risk review (it changes the case decision), not here.
  const row = await loadCase(db, esc.case_id);
  if (row && (row.risk_decision === 'HUMAN_REVIEW' || row.risk_decision === 'EMERGENCY_111')) {
    return fail(c, 409, 'USE_RISK_REVIEW', 'Clear this hold with the risk review');
  }
  const at = nowIso();
  await db.prepare("UPDATE loop_escalations SET status = 'RESOLVED', resolved_by = ?, resolution_note = ?, resolved_at = ? WHERE id = ?").bind(user.name, body.data.note, at, esc.id).run();
  await factStmt(db, esc.case_id, 'escalation_resolved', { note: body.data.note }, 'HUMAN_VERIFIED', user).run();
  return c.json({ escalation: toEscalation(await db.prepare('SELECT * FROM loop_escalations WHERE id = ?').bind(esc.id).first<any>()) });
});

async function loadReportInput(db: D1Database, scope: Scope) {
  const cs = caseScopeSql(scope);
  const [cases, steps, refs, fus, escs] = await Promise.all([
    db.prepare(`SELECT c.id, c.created_at, c.updated_at, c.status, c.need_category, c.risk_decision, c.urgency FROM loop_cases c WHERE ${cs.sql}`).bind(...(cs.binds as any[])).all<any>(),
    db.prepare(`SELECT DISTINCT s.case_id FROM loop_next_steps s JOIN loop_cases c ON c.id = s.case_id WHERE ${cs.sql}`).bind(...(cs.binds as any[])).all<any>(),
    db
      .prepare(
        `SELECT r.id, r.case_id, r.stage, r.created_at, d.organisation_name, d.category, c.urgency,
           (SELECT MIN(e.created_at) FROM loop_referral_events e WHERE e.referral_id = r.id AND e.to_stage IN ('ACCEPTED','DECLINED')) AS decided_at,
           (SELECT COUNT(*) FROM loop_referral_events e WHERE e.referral_id = r.id AND e.to_stage = 'ACCEPTED') AS accepted
         FROM loop_referrals r JOIN loop_cases c ON c.id = r.case_id LEFT JOIN directory_resources d ON d.id = r.resource_id WHERE ${cs.sql}`,
      )
      .bind(...(cs.binds as any[]))
      .all<any>(),
    db.prepare(`SELECT f.case_id, f.due_at, f.completed_at, f.result FROM loop_follow_ups f JOIN loop_cases c ON c.id = f.case_id WHERE ${cs.sql}`).bind(...(cs.binds as any[])).all<any>(),
    db.prepare(`SELECT COUNT(*) AS n FROM loop_escalations e JOIN loop_cases c ON c.id = e.case_id WHERE e.status = 'OPEN' AND ${cs.sql}`).bind(...(cs.binds as any[])).first<any>(),
  ]);
  return {
    cases: (cases.results ?? []).map((r) => ({ id: r.id, createdAt: r.created_at, updatedAt: r.updated_at, status: r.status, need: r.need_category, riskDecision: r.risk_decision, urgency: r.urgency })),
    nextStepCaseIds: (steps.results ?? []).map((r) => r.case_id as string),
    referrals: (refs.results ?? []).map((r) => ({ id: r.id, caseId: r.case_id, stage: r.stage, createdAt: r.created_at, organisationName: r.organisation_name, category: r.category, urgency: r.urgency, decidedAt: r.decided_at, accepted: Number(r.accepted) > 0 })),
    followUps: (fus.results ?? []).map((r) => ({ caseId: r.case_id, dueAt: r.due_at, completedAt: r.completed_at, result: r.result })),
    openEscalations: Number(escs?.n ?? 0),
  };
}

/** GET /reports?range=week|month — current period and the previous one (for ↑↓ comparisons). */
loopRoutes.get('/reports', async (c) => {
  const scope = scopeOf(c.get('user'));
  if (scope.kind === 'partner' || scope.kind === 'none' || userOf(c).actor === 'PARTNER') return fail(c, 403, 'SCOPE_FORBIDDEN', 'Coordinators and observers only');
  const range = c.req.query('range') === 'month' ? 'month' : 'week';
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  let prevStart: Date;
  let end: Date;
  if (range === 'week') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    end = new Date(start.getTime() + 7 * 86_400_000);
    prevStart = new Date(start.getTime() - 7 * 86_400_000);
  } else {
    start.setDate(1);
    end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
  }
  const base = await loadReportInput(c.env.DB, scope);
  const report = computeLoopReport({ ...base, from: start, to: end, now });
  // Previous period: same rules, evaluated as of the end of that period.
  const previous = computeLoopReport({ ...base, from: prevStart, to: start, now: start });
  return c.json({ range, report, previous, generatedAt: nowIso() });
});

