/**
 * /api/v1/missions — Mission Flow & QR Check-in API
 */
import { Hono, type Context } from 'hono';
import { haversineKm } from '@buoc-tiep/shared';
import type { Env } from '../bindings';
import type { AuthContext } from '../middleware/auth';

type AppEnv = { Bindings: Env; Variables: { user: AuthContext } };
type Ctx = Context<AppEnv>;

export const missionRoutes = new Hono<AppEnv>();

const nowIso = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;

function userOf(c: Ctx) {
  const u = c.get('user');
  return { id: u?.userId ?? 'anonymous', role: u?.role ?? '' };
}

// ---------------------------------------------------------------------------
// GET /missions — My missions
// ---------------------------------------------------------------------------
missionRoutes.get('/', async (c) => {
  const user = userOf(c);
  const status = c.req.query('status');

  const conditions = ['m.navigator_id = ?'];
  const binds: unknown[] = [user.id];

  if (status) { conditions.push('m.status = ?'); binds.push(status); }

  const result = await c.env.DB.prepare(`
    SELECT m.*, c.title as campaign_title, c.district as campaign_district,
           c.starts_at as campaign_starts_at, c.category as campaign_category,
           u.full_name as navigator_name
    FROM missions m
    JOIN campaigns c ON c.id = m.campaign_id
    LEFT JOIN users u ON u.id = m.navigator_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY m.created_at DESC
    LIMIT 50
  `).bind(...binds).all();

  return c.json({ missions: (result.results ?? []).map(toMissionDetail) });
});

// ---------------------------------------------------------------------------
// GET /missions/:id — Mission detail
// ---------------------------------------------------------------------------
missionRoutes.get('/:id', async (c) => {
  const missionId = c.req.param('id');
  const row = await c.env.DB.prepare(`
    SELECT m.*, c.title as campaign_title, c.district as campaign_district,
           c.starts_at as campaign_starts_at, c.category as campaign_category,
           c.address as campaign_address, c.latitude as campaign_lat, c.longitude as campaign_lng,
           u.full_name as navigator_name, v.full_name as verifier_name
    FROM missions m
    JOIN campaigns c ON c.id = m.campaign_id
    LEFT JOIN users u ON u.id = m.navigator_id
    LEFT JOIN users v ON v.id = m.verified_by
    WHERE m.id = ?
  `).bind(missionId).first();

  if (!row) return c.json({ error: 'Mission not found', code: 'NOT_FOUND' }, 404);

  // Fetch check-ins
  const checkins = await c.env.DB.prepare(
    `SELECT * FROM mission_checkins WHERE mission_id = ? ORDER BY checked_in_at`
  ).bind(missionId).all();

  return c.json({
    mission: toMissionDetail(row),
    checkins: (checkins.results ?? []).map((ci: any) => ({
      id: ci.id,
      qrCode: ci.qr_code,
      latitude: ci.latitude,
      longitude: ci.longitude,
      checkedInAt: ci.checked_in_at,
    })),
  });
});

// ---------------------------------------------------------------------------
// PATCH /missions/:id/check-in — QR check-in
// ---------------------------------------------------------------------------
missionRoutes.patch('/:id/check-in', async (c) => {
  const missionId = c.req.param('id');
  const user = userOf(c);
  const body = await c.req.json<{ qrCode?: string; latitude?: number; longitude?: number }>();
  const now = nowIso();

  const mission = await c.env.DB.prepare(
    `SELECT m.*, c.latitude as campaign_lat, c.longitude as campaign_lng
     FROM missions m JOIN campaigns c ON c.id = m.campaign_id WHERE m.id = ?`
  ).bind(missionId).first<any>();

  if (!mission) return c.json({ error: 'Mission not found', code: 'NOT_FOUND' }, 404);
  if (mission.navigator_id !== user.id) return c.json({ error: 'Not your mission', code: 'FORBIDDEN' }, 403);
  if (mission.status !== 'ASSIGNED') return c.json({ error: 'Already checked in', code: 'STATUS_CONFLICT' }, 409);

  // Proximity check (500m) if both coordinates available
  if (body.latitude && body.longitude && mission.campaign_lat && mission.campaign_lng) {
    const distanceKm = haversineKm(body.latitude, body.longitude, mission.campaign_lat, mission.campaign_lng);
    if (distanceKm > 0.5) {
      return c.json({ error: `Too far from campaign location (${distanceKm.toFixed(1)}km)`, code: 'TOO_FAR', distanceKm }, 400);
    }
  }

  const checkinId = newId('cin');
  await c.env.DB.batch([
    c.env.DB.prepare(`INSERT INTO mission_checkins (id, mission_id, navigator_id, qr_code, latitude, longitude, checked_in_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(checkinId, missionId, user.id, body.qrCode ?? null, body.latitude ?? null, body.longitude ?? null, now),
    c.env.DB.prepare(`UPDATE missions SET status = 'CHECKED_IN', checked_in_at = ? WHERE id = ?`).bind(now, missionId),
  ]);

  return c.json({ checkinId, status: 'CHECKED_IN' });
});

// ---------------------------------------------------------------------------
// POST /missions/:id/evidence — Upload evidence
// ---------------------------------------------------------------------------
missionRoutes.post('/:id/evidence', async (c) => {
  const missionId = c.req.param('id');
  const user = userOf(c);
  const body = await c.req.json<{ evidenceUrl?: string; evidenceType?: string; evidenceNotes?: string }>();
  const now = nowIso();

  const mission = await c.env.DB.prepare('SELECT navigator_id, status FROM missions WHERE id = ?').bind(missionId).first<any>();
  if (!mission) return c.json({ error: 'Mission not found', code: 'NOT_FOUND' }, 404);
  if (mission.navigator_id !== user.id) return c.json({ error: 'Not your mission', code: 'FORBIDDEN' }, 403);
  if (!['CHECKED_IN', 'IN_PROGRESS'].includes(mission.status)) {
    return c.json({ error: 'Must check in first', code: 'STATUS_CONFLICT' }, 409);
  }

  await c.env.DB.prepare(`
    UPDATE missions SET evidence_url = ?, evidence_type = ?, evidence_notes = ?, status = 'EVIDENCE_SUBMITTED'
    WHERE id = ?
  `).bind(body.evidenceUrl ?? null, body.evidenceType ?? 'note', body.evidenceNotes ?? null, missionId).run();

  return c.json({ status: 'EVIDENCE_SUBMITTED' });
});

// ---------------------------------------------------------------------------
// PATCH /missions/:id/verify — Partner verifies evidence
// ---------------------------------------------------------------------------
missionRoutes.patch('/:id/verify', async (c) => {
  const missionId = c.req.param('id');
  const user = userOf(c);
  const now = nowIso();

  const mission = await c.env.DB.prepare('SELECT status FROM missions WHERE id = ?').bind(missionId).first<any>();
  if (!mission) return c.json({ error: 'Mission not found', code: 'NOT_FOUND' }, 404);
  if (mission.status !== 'EVIDENCE_SUBMITTED') {
    return c.json({ error: 'Evidence not submitted yet', code: 'STATUS_CONFLICT' }, 409);
  }

  await c.env.DB.prepare(`
    UPDATE missions SET status = 'VERIFIED', verified_by = ?, verified_at = ? WHERE id = ?
  `).bind(user.id, now, missionId).run();

  return c.json({ status: 'VERIFIED' });
});

// ---------------------------------------------------------------------------
// PATCH /missions/:id/complete — Mark mission completed
// ---------------------------------------------------------------------------
missionRoutes.patch('/:id/complete', async (c) => {
  const missionId = c.req.param('id');
  const now = nowIso();

  const mission = await c.env.DB.prepare('SELECT status, slot_id FROM missions WHERE id = ?').bind(missionId).first<any>();
  if (!mission) return c.json({ error: 'Mission not found', code: 'NOT_FOUND' }, 404);
  if (!['VERIFIED', 'EVIDENCE_SUBMITTED', 'CHECKED_IN'].includes(mission.status)) {
    return c.json({ error: 'Cannot complete from current status', code: 'STATUS_CONFLICT' }, 409);
  }

  const batch = [
    c.env.DB.prepare(`UPDATE missions SET status = 'COMPLETED', completed_at = ? WHERE id = ?`).bind(now, missionId),
  ];

  if (mission.slot_id) {
    batch.push(
      c.env.DB.prepare(`UPDATE campaign_slots SET status = 'COMPLETED', completed_at = ? WHERE id = ?`).bind(now, mission.slot_id)
    );
  }

  await c.env.DB.batch(batch);
  return c.json({ status: 'COMPLETED' });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toMissionDetail(row: any) {
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
    verifierName: row.verifier_name,
    verifiedAt: row.verified_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    campaign: row.campaign_title ? {
      title: row.campaign_title,
      district: row.campaign_district,
      startsAt: row.campaign_starts_at,
      category: row.campaign_category,
      address: row.campaign_address,
      latitude: row.campaign_lat,
      longitude: row.campaign_lng,
    } : undefined,
  };
}
