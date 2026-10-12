/**
 * /api/v1/campaigns — Campaign Hub & Autopilot API
 *
 * CRUD campaigns, join/leave, participants, outcomes,
 * and recommended campaigns (Autopilot).
 */
import { Hono, type Context } from 'hono';
import { z } from 'zod';
import {
  validateCampaignCreate,
  canPublish,
  canActivate,
  canComplete,
  canJoin,
  computeCapacity,
  computeMatchScore,
  computeFollowupSchedule,
  type CampaignInput,
  type NavigatorProfile,
  type CampaignRecord,
} from '@buoc-tiep/shared';
import type { Env } from '../bindings';
import type { AuthContext } from '../middleware/auth';
import { actorOf } from './loop';

type AppEnv = { Bindings: Env; Variables: { user: AuthContext } };
type Ctx = Context<AppEnv>;

export const campaignRoutes = new Hono<AppEnv>();

const nowIso = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;

function userOf(c: Ctx) {
  const u = c.get('user');
  return { id: u?.userId ?? 'anonymous', orgId: u?.organizationId ?? '', role: u?.role ?? '', name: u?.name ?? '' };
}

// ---------------------------------------------------------------------------
// GET /campaigns — List campaigns (filter: status, district, category)
// ---------------------------------------------------------------------------
campaignRoutes.get('/', async (c) => {
  const { status, district, category, limit } = c.req.query();
  const conditions: string[] = ['1=1'];
  const binds: unknown[] = [];

  if (status) { conditions.push('c.status = ?'); binds.push(status); }
  if (district) { conditions.push('c.district = ?'); binds.push(district); }
  if (category) { conditions.push('c.category = ?'); binds.push(category); }

  const sql = `
    SELECT c.*, u.full_name AS creator_name, o.name AS org_name
    FROM campaigns c
    LEFT JOIN users u ON u.id = c.created_by
    LEFT JOIN organizations o ON o.id = c.organization_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY c.starts_at ASC
    LIMIT ?
  `;
  binds.push(Number(limit) || 50);

  const result = await c.env.DB.prepare(sql).bind(...binds).all();
  const campaigns = (result.results ?? []).map(toCampaignResponse);
  return c.json({ campaigns });
});

// ---------------------------------------------------------------------------
// GET /campaigns/recommended — Autopilot recommended campaigns for current user
// ---------------------------------------------------------------------------
campaignRoutes.get('/recommended', async (c) => {
  const user = userOf(c);

  // Fetch published/active campaigns
  const campaignRows = await c.env.DB.prepare(`
    SELECT * FROM campaigns WHERE status IN ('PUBLISHED','ACTIVE') ORDER BY starts_at ASC LIMIT 30
  `).all();

  // Fetch navigator profile data
  const navigatorRow = await c.env.DB.prepare(`
    SELECT n.district_assigned, n.active_cases_count FROM navigators n WHERE n.user_id = ?
  `).bind(user.id).first();

  // Fetch completed campaign categories
  const completedRows = await c.env.DB.prepare(`
    SELECT DISTINCT c.category FROM missions m
    JOIN campaigns c ON c.id = m.campaign_id
    WHERE m.navigator_id = ? AND m.status = 'COMPLETED'
  `).bind(user.id).all();

  // Fetch active mission count
  const activeMissions = await c.env.DB.prepare(`
    SELECT COUNT(*) as cnt FROM missions WHERE navigator_id = ? AND status NOT IN ('COMPLETED','VERIFIED')
  `).bind(user.id).first<{ cnt: number }>();

  const navigatorProfile: NavigatorProfile = {
    userId: user.id,
    district: (navigatorRow as any)?.district_assigned,
    skills: [], // Could be enriched from user profile
    completedCategories: (completedRows.results ?? []).map((row: any) => row.category),
    activeMissionCount: activeMissions?.cnt ?? 0,
  };

  const campaigns = (campaignRows.results ?? []).map((row: any) => {
    const campaignRecord: CampaignRecord = {
      id: row.id,
      status: row.status,
      totalSlots: row.total_slots,
      filledSlots: row.filled_slots,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      category: row.category,
      district: row.district,
      requiredSkills: parseJson<string[]>(row.required_skills, []),
    };
    const matchResult = computeMatchScore(navigatorProfile, campaignRecord);
    return {
      ...toCampaignResponse(row),
      match: matchResult,
    };
  });

  // Filter eligible + sort by score descending
  const recommended = campaigns
    .filter(c => c.match.eligible)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 10);

  return c.json({ recommended });
});

// ---------------------------------------------------------------------------
// GET /campaigns/:id — Campaign detail + capacity
// ---------------------------------------------------------------------------
campaignRoutes.get('/:id', async (c) => {
  const campaignId = c.req.param('id');
  const row = await c.env.DB.prepare(`
    SELECT c.*, u.full_name AS creator_name, o.name AS org_name
    FROM campaigns c
    LEFT JOIN users u ON u.id = c.created_by
    LEFT JOIN organizations o ON o.id = c.organization_id
    WHERE c.id = ?
  `).bind(campaignId).first();

  if (!row) return c.json({ error: 'Campaign not found', code: 'NOT_FOUND' }, 404);

  // Fetch slots
  const slots = await c.env.DB.prepare(`
    SELECT cs.*, u.full_name as user_name FROM campaign_slots cs
    LEFT JOIN users u ON u.id = cs.user_id
    WHERE cs.campaign_id = ? ORDER BY cs.created_at
  `).bind(campaignId).all();

  // Fetch participants
  const participants = await c.env.DB.prepare(`
    SELECT cp.*, u.full_name as referred_by_name FROM campaign_participants cp
    LEFT JOIN users u ON u.id = cp.referred_by
    WHERE cp.campaign_id = ? ORDER BY cp.created_at
  `).bind(campaignId).all();

  // Fetch missions
  const missions = await c.env.DB.prepare(`
    SELECT m.*, u.full_name as navigator_name FROM missions m
    LEFT JOIN users u ON u.id = m.navigator_id
    WHERE m.campaign_id = ? ORDER BY m.created_at
  `).bind(campaignId).all();

  const campaign = toCampaignResponse(row);
  const capacity = computeCapacity(campaign.totalSlots, campaign.filledSlots);

  return c.json({
    campaign,
    capacity,
    slots: (slots.results ?? []).map(toSlotResponse),
    participants: (participants.results ?? []).map(toParticipantResponse),
    missions: (missions.results ?? []).map(toMissionResponse),
  });
});

// ---------------------------------------------------------------------------
// POST /campaigns — Create campaign (Partner/Coordinator)
// ---------------------------------------------------------------------------
campaignRoutes.post('/', async (c) => {
  const user = userOf(c);
  const actor = actorOf(user.role);
  if (actor !== 'PARTNER' && actor !== 'COORDINATOR') {
    return c.json({ error: 'Only partners and coordinators can create campaigns', code: 'FORBIDDEN' }, 403);
  }

  const body = await c.req.json<CampaignInput>();
  const validation = validateCampaignCreate(body);
  if (!validation.valid) {
    return c.json({ error: (validation as any).error, code: 'VALIDATION_ERROR' }, 400);
  }

  const campaignId = newId('cmp');
  const now = nowIso();

  await c.env.DB.prepare(`
    INSERT INTO campaigns (id, organization_id, created_by, title, description, category, district, ward, address,
      latitude, longitude, starts_at, ends_at, duration_minutes, total_slots, min_navigators,
      required_skills, eligibility_json, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?)
  `).bind(
    campaignId, user.orgId, user.id,
    body.title, body.description ?? null, body.category, body.district,
    body.ward ?? null, body.address ?? null,
    body.latitude ?? null, body.longitude ?? null,
    body.startsAt, body.endsAt ?? null,
    body.durationMinutes ?? 120, body.totalSlots ?? 20, body.minNavigators ?? 1,
    body.requiredSkills ? JSON.stringify(body.requiredSkills) : null,
    body.eligibility ? JSON.stringify(body.eligibility) : null,
    now, now,
  ).run();

  // Pre-create available slots
  const totalSlots = body.totalSlots ?? 20;
  const slotInserts = [];
  for (let i = 0; i < totalSlots; i++) {
    slotInserts.push(
      c.env.DB.prepare(`INSERT INTO campaign_slots (id, campaign_id, status, created_at) VALUES (?, ?, 'AVAILABLE', ?)`)
        .bind(newId('slt'), campaignId, now)
    );
  }
  if (slotInserts.length > 0) {
    await c.env.DB.batch(slotInserts);
  }

  return c.json({ id: campaignId, status: 'DRAFT' }, 201);
});

// ---------------------------------------------------------------------------
// PUT /campaigns/:id — Update campaign
// ---------------------------------------------------------------------------
campaignRoutes.put('/:id', async (c) => {
  const campaignId = c.req.param('id');
  const user = userOf(c);
  const body = await c.req.json<Partial<CampaignInput>>();

  const existing = await c.env.DB.prepare('SELECT status, created_by FROM campaigns WHERE id = ?').bind(campaignId).first<any>();
  if (!existing) return c.json({ error: 'Campaign not found', code: 'NOT_FOUND' }, 404);
  if (existing.status !== 'DRAFT') return c.json({ error: 'Can only edit DRAFT campaigns', code: 'STATUS_CONFLICT' }, 409);

  const sets: string[] = [];
  const binds: unknown[] = [];
  const fields: Array<[string, keyof Partial<CampaignInput> | string, (v: any) => unknown]> = [
    ['title', 'title', v => v],
    ['description', 'description', v => v],
    ['category', 'category', v => v],
    ['district', 'district', v => v],
    ['ward', 'ward', v => v],
    ['address', 'address', v => v],
    ['latitude', 'latitude', v => v],
    ['longitude', 'longitude', v => v],
    ['starts_at', 'startsAt', v => v],
    ['ends_at', 'endsAt', v => v],
    ['duration_minutes', 'durationMinutes', v => v],
    ['total_slots', 'totalSlots', v => v],
    ['min_navigators', 'minNavigators', v => v],
    ['required_skills', 'requiredSkills', v => v ? JSON.stringify(v) : null],
    ['eligibility_json', 'eligibility', v => v ? JSON.stringify(v) : null],
  ];

  for (const [col, key, transform] of fields) {
    const value = (body as any)[key];
    if (value !== undefined) {
      sets.push(`${col} = ?`);
      binds.push(transform(value));
    }
  }

  if (sets.length === 0) return c.json({ error: 'No fields to update', code: 'VALIDATION_ERROR' }, 400);

  sets.push('updated_at = ?');
  binds.push(nowIso());
  binds.push(campaignId);

  await c.env.DB.prepare(`UPDATE campaigns SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run();
  return c.json({ updated: true });
});

// ---------------------------------------------------------------------------
// PATCH /campaigns/:id/publish — DRAFT → PUBLISHED
// ---------------------------------------------------------------------------
campaignRoutes.patch('/:id/publish', async (c) => {
  const campaignId = c.req.param('id');
  const row = await c.env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(campaignId).first<any>();
  if (!row) return c.json({ error: 'Campaign not found', code: 'NOT_FOUND' }, 404);

  const check = canPublish({ id: row.id, status: row.status, totalSlots: row.total_slots, filledSlots: row.filled_slots, startsAt: row.starts_at, category: row.category, district: row.district });
  if (!check.allowed) return c.json({ error: (check as any).reason, code: 'STATUS_CONFLICT' }, 409);

  await c.env.DB.prepare(`UPDATE campaigns SET status = 'PUBLISHED', updated_at = ? WHERE id = ?`).bind(nowIso(), campaignId).run();
  return c.json({ status: 'PUBLISHED' });
});

// ---------------------------------------------------------------------------
// PATCH /campaigns/:id/activate — PUBLISHED → ACTIVE
// ---------------------------------------------------------------------------
campaignRoutes.patch('/:id/activate', async (c) => {
  const campaignId = c.req.param('id');
  const row = await c.env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(campaignId).first<any>();
  if (!row) return c.json({ error: 'Campaign not found', code: 'NOT_FOUND' }, 404);

  const check = canActivate({ id: row.id, status: row.status, totalSlots: row.total_slots, filledSlots: row.filled_slots, startsAt: row.starts_at, category: row.category, district: row.district });
  if (!check.allowed) return c.json({ error: (check as any).reason, code: 'STATUS_CONFLICT' }, 409);

  await c.env.DB.prepare(`UPDATE campaigns SET status = 'ACTIVE', updated_at = ? WHERE id = ?`).bind(nowIso(), campaignId).run();
  return c.json({ status: 'ACTIVE' });
});

// ---------------------------------------------------------------------------
// PATCH /campaigns/:id/complete — ACTIVE → COMPLETED
// ---------------------------------------------------------------------------
campaignRoutes.patch('/:id/complete', async (c) => {
  const campaignId = c.req.param('id');
  const row = await c.env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(campaignId).first<any>();
  if (!row) return c.json({ error: 'Campaign not found', code: 'NOT_FOUND' }, 404);

  const check = canComplete({ id: row.id, status: row.status, totalSlots: row.total_slots, filledSlots: row.filled_slots, startsAt: row.starts_at, category: row.category, district: row.district });
  if (!check.allowed) return c.json({ error: (check as any).reason, code: 'STATUS_CONFLICT' }, 409);

  const now = nowIso();
  await c.env.DB.prepare(`UPDATE campaigns SET status = 'COMPLETED', updated_at = ? WHERE id = ?`).bind(now, campaignId).run();

  // Create follow-ups for all participants in background
  c.executionCtx.waitUntil(createFollowupsForCampaign(c.env.DB, campaignId, now));

  return c.json({ status: 'COMPLETED' });
});

// ---------------------------------------------------------------------------
// POST /campaigns/:id/join — Navigator joins campaign (reserve slot)
// ---------------------------------------------------------------------------
campaignRoutes.post('/:id/join', async (c) => {
  const campaignId = c.req.param('id');
  const user = userOf(c);
  const now = nowIso();

  // Atomic check-and-reserve using D1 batch
  const [campaignResult, existingSlot] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(campaignId),
    c.env.DB.prepare(`SELECT id FROM campaign_slots WHERE campaign_id = ? AND user_id = ? AND status != 'CANCELLED'`).bind(campaignId, user.id),
  ]);

  const campaignRow = campaignResult.results?.[0] as any;
  if (!campaignRow) return c.json({ error: 'Campaign not found', code: 'NOT_FOUND' }, 404);

  if ((existingSlot.results ?? []).length > 0) {
    return c.json({ error: 'Already joined this campaign', code: 'ALREADY_JOINED' }, 409);
  }

  const joinCheck = canJoin({
    id: campaignRow.id, status: campaignRow.status, totalSlots: campaignRow.total_slots,
    filledSlots: campaignRow.filled_slots, startsAt: campaignRow.starts_at,
    category: campaignRow.category, district: campaignRow.district,
  });
  if (!joinCheck.allowed) return c.json({ error: (joinCheck as any).reason, code: 'JOIN_DENIED' }, 409);

  // Find an available slot and reserve it
  const availableSlot = await c.env.DB.prepare(
    `SELECT id FROM campaign_slots WHERE campaign_id = ? AND status = 'AVAILABLE' LIMIT 1`
  ).bind(campaignId).first<{ id: string }>();

  if (!availableSlot) return c.json({ error: 'No available slots', code: 'FULL' }, 409);

  // Reserve slot + increment counter atomically
  await c.env.DB.batch([
    c.env.DB.prepare(`UPDATE campaign_slots SET user_id = ?, status = 'RESERVED', reserved_at = ? WHERE id = ? AND status = 'AVAILABLE'`)
      .bind(user.id, now, availableSlot.id),
    c.env.DB.prepare(`UPDATE campaigns SET filled_slots = filled_slots + 1, updated_at = ? WHERE id = ?`)
      .bind(now, campaignId),
  ]);

  // Auto-create mission for this navigator
  const missionId = newId('msn');
  await c.env.DB.prepare(`
    INSERT INTO missions (id, campaign_id, slot_id, navigator_id, title, description, duration_minutes, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'ASSIGNED', ?)
  `).bind(
    missionId, campaignId, availableSlot.id, user.id,
    campaignRow.title, campaignRow.description ?? null,
    campaignRow.duration_minutes ?? 60, now,
  ).run();

  return c.json({ slotId: availableSlot.id, missionId, status: 'RESERVED' }, 201);
});

// ---------------------------------------------------------------------------
// DELETE /campaigns/:id/leave — Navigator leaves campaign
// ---------------------------------------------------------------------------
campaignRoutes.delete('/:id/leave', async (c) => {
  const campaignId = c.req.param('id');
  const user = userOf(c);
  const now = nowIso();

  const slot = await c.env.DB.prepare(
    `SELECT id FROM campaign_slots WHERE campaign_id = ? AND user_id = ? AND status IN ('RESERVED','CONFIRMED')`
  ).bind(campaignId, user.id).first<{ id: string }>();

  if (!slot) return c.json({ error: 'Not in this campaign', code: 'NOT_FOUND' }, 404);

  await c.env.DB.batch([
    c.env.DB.prepare(`UPDATE campaign_slots SET status = 'CANCELLED', user_id = NULL, cancelled_at = ? WHERE id = ?`)
      .bind(now, slot.id),
    c.env.DB.prepare(`UPDATE campaigns SET filled_slots = MAX(0, filled_slots - 1), updated_at = ? WHERE id = ?`)
      .bind(now, campaignId),
    c.env.DB.prepare(`UPDATE missions SET status = 'COMPLETED', completed_at = ? WHERE slot_id = ? AND status = 'ASSIGNED'`)
      .bind(now, slot.id),
  ]);

  return c.json({ left: true });
});

// ---------------------------------------------------------------------------
// GET /campaigns/:id/participants — List participants
// ---------------------------------------------------------------------------
campaignRoutes.get('/:id/participants', async (c) => {
  const campaignId = c.req.param('id');
  const result = await c.env.DB.prepare(`
    SELECT cp.*, u.full_name as referred_by_name
    FROM campaign_participants cp
    LEFT JOIN users u ON u.id = cp.referred_by
    WHERE cp.campaign_id = ?
    ORDER BY cp.created_at
  `).bind(campaignId).all();
  return c.json({ participants: (result.results ?? []).map(toParticipantResponse) });
});

// ---------------------------------------------------------------------------
// POST /campaigns/:id/participants — Add beneficiary participant
// ---------------------------------------------------------------------------
campaignRoutes.post('/:id/participants', async (c) => {
  const campaignId = c.req.param('id');
  const user = userOf(c);
  const body = await c.req.json<{ beneficiaryAlias: string; needId?: string; consentGiven?: boolean }>();

  if (!body.beneficiaryAlias?.trim()) {
    return c.json({ error: 'Beneficiary alias is required', code: 'VALIDATION_ERROR' }, 400);
  }

  const participantId = newId('prt');
  await c.env.DB.prepare(`
    INSERT INTO campaign_participants (id, campaign_id, beneficiary_alias, referred_by, need_id, consent_given, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'INVITED', ?)
  `).bind(
    participantId, campaignId, body.beneficiaryAlias, user.id,
    body.needId ?? null, body.consentGiven ? 1 : 0, nowIso(),
  ).run();

  return c.json({ id: participantId, status: 'INVITED' }, 201);
});

// ---------------------------------------------------------------------------
// PATCH /campaigns/:id/participants/:pid/outcome — Record outcome
// ---------------------------------------------------------------------------
campaignRoutes.patch('/:id/participants/:pid/outcome', async (c) => {
  const participantId = c.req.param('pid');
  const user = userOf(c);
  const body = await c.req.json<{ outcomeStatus: string; outcomeNotes?: string }>();

  if (!['BETTER', 'SAME', 'HARDER'].includes(body.outcomeStatus)) {
    return c.json({ error: 'Invalid outcome status', code: 'VALIDATION_ERROR' }, 400);
  }

  const now = nowIso();
  await c.env.DB.prepare(`
    UPDATE campaign_participants
    SET outcome_status = ?, outcome_notes = ?, outcome_verified_by = ?, outcome_verified_at = ?, status = 'COMPLETED'
    WHERE id = ?
  `).bind(body.outcomeStatus, body.outcomeNotes ?? null, user.id, now, participantId).run();

  return c.json({ updated: true });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || !value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function toCampaignResponse(row: any) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    createdBy: row.created_by,
    creatorName: row.creator_name,
    orgName: row.org_name,
    title: row.title,
    description: row.description,
    category: row.category,
    district: row.district,
    ward: row.ward,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    durationMinutes: row.duration_minutes,
    totalSlots: row.total_slots,
    filledSlots: row.filled_slots,
    minNavigators: row.min_navigators,
    status: row.status,
    source: row.source,
    signalId: row.signal_id,
    templateId: row.template_id,
    requiredSkills: parseJson<string[]>(row.required_skills, []),
    eligibility: parseJson(row.eligibility_json, null),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    capacity: computeCapacity(row.total_slots ?? 0, row.filled_slots ?? 0),
  };
}

function toSlotResponse(row: any) {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    userId: row.user_id,
    userName: row.user_name,
    roleInCampaign: row.role_in_campaign,
    status: row.status,
    reservedAt: row.reserved_at,
    confirmedAt: row.confirmed_at,
    completedAt: row.completed_at,
  };
}

function toParticipantResponse(row: any) {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    beneficiaryAlias: row.beneficiary_alias,
    referredBy: row.referred_by,
    referredByName: row.referred_by_name,
    needId: row.need_id,
    consentGiven: row.consent_given === 1,
    status: row.status,
    outcomeStatus: row.outcome_status,
    outcomeNotes: row.outcome_notes,
    outcomeVerifiedBy: row.outcome_verified_by,
    outcomeVerifiedAt: row.outcome_verified_at,
    createdAt: row.created_at,
  };
}

function toMissionResponse(row: any) {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    slotId: row.slot_id,
    navigatorId: row.navigator_id,
    navigatorName: row.navigator_name,
    title: row.title,
    description: row.description,
    durationMinutes: row.duration_minutes,
    status: row.status,
    checkedInAt: row.checked_in_at,
    evidenceUrl: row.evidence_url,
    evidenceType: row.evidence_type,
    evidenceNotes: row.evidence_notes,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

async function createFollowupsForCampaign(db: D1Database, campaignId: string, completedAt: string) {
  const participants = await db.prepare(
    `SELECT id FROM campaign_participants WHERE campaign_id = ? AND status IN ('ATTENDED','CONFIRMED')`
  ).bind(campaignId).all();

  const schedule = computeFollowupSchedule(completedAt);
  const inserts = [];

  for (const participant of (participants.results ?? [])) {
    for (const item of schedule) {
      inserts.push(
        db.prepare(`INSERT INTO campaign_followups (id, campaign_id, participant_id, type, status, due_at, created_at) VALUES (?, ?, ?, ?, 'PENDING', ?, ?)`)
          .bind(newId('cfu'), campaignId, (participant as any).id, item.type, item.dueAt, completedAt)
      );
    }
  }

  if (inserts.length > 0) {
    // D1 batch max ~100 statements, chunk if needed
    for (let i = 0; i < inserts.length; i += 80) {
      await db.batch(inserts.slice(i, i + 80));
    }
  }
}
