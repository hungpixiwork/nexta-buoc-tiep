/**
 * /api/v1/signals — Community Signal Detection & Campaign Generation
 */
import { Hono, type Context } from 'hono';
import { shouldCreateSignal, suggestCampaignFromSignal } from '@buoc-tiep/shared';
import type { Env } from '../bindings';
import type { AuthContext } from '../middleware/auth';

type AppEnv = { Bindings: Env; Variables: { user: AuthContext } };
type Ctx = Context<AppEnv>;

export const signalRoutes = new Hono<AppEnv>();

const nowIso = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;

function userOf(c: Ctx) {
  const u = c.get('user');
  return { id: u?.userId ?? 'anonymous', orgId: u?.organizationId ?? '', role: u?.role ?? '' };
}

// ---------------------------------------------------------------------------
// GET /signals — Active signals (Coordinator/Partner)
// ---------------------------------------------------------------------------
signalRoutes.get('/', async (c) => {
  const status = c.req.query('status') || 'DETECTED';
  const result = await c.env.DB.prepare(`
    SELECT cs.*, COUNT(csn.id) as linked_need_count
    FROM community_signals cs
    LEFT JOIN community_signal_needs csn ON csn.signal_id = cs.id
    WHERE cs.status = ?
    GROUP BY cs.id
    ORDER BY cs.need_count DESC, cs.detected_at DESC
    LIMIT 20
  `).bind(status).all();

  return c.json({ signals: (result.results ?? []).map(toSignalResponse) });
});

// ---------------------------------------------------------------------------
// GET /signals/:id — Signal detail + linked needs
// ---------------------------------------------------------------------------
signalRoutes.get('/:id', async (c) => {
  const signalId = c.req.param('id');
  const signal = await c.env.DB.prepare('SELECT * FROM community_signals WHERE id = ?').bind(signalId).first();
  if (!signal) return c.json({ error: 'Signal not found', code: 'NOT_FOUND' }, 404);

  const linkedNeeds = await c.env.DB.prepare(`
    SELECT csn.case_id, lc.alias, lc.need_category, lc.district, lc.status, lc.stage
    FROM community_signal_needs csn
    LEFT JOIN loop_cases lc ON lc.id = csn.case_id
    WHERE csn.signal_id = ?
    ORDER BY csn.created_at
  `).bind(signalId).all();

  return c.json({
    signal: toSignalResponse(signal),
    linkedNeeds: (linkedNeeds.results ?? []).map((row: any) => ({
      caseId: row.case_id,
      alias: row.alias,
      needCategory: row.need_category,
      district: row.district,
      status: row.status,
      stage: row.stage,
    })),
  });
});

// ---------------------------------------------------------------------------
// POST /signals/detect — Run signal detection (cron or manual trigger)
// ---------------------------------------------------------------------------
signalRoutes.post('/detect', async (c) => {
  const windowDays = Number(c.req.query('windowDays')) || 14;
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  // Group recent needs by (category, district)
  const clusters = await c.env.DB.prepare(`
    SELECT need_category as category, district, COUNT(*) as need_count,
           SUM(CASE WHEN stage NOT IN ('CONNECTED','FOLLOW_UP') THEN 1 ELSE 0 END) as unresolved_count
    FROM loop_cases
    WHERE created_at >= ? AND status != 'CLOSED'
    GROUP BY need_category, district
    HAVING need_count >= 5
  `).bind(cutoff).all();

  const signalsCreated: string[] = [];
  const now = nowIso();

  for (const cluster of (clusters.results ?? []) as any[]) {
    // Count available navigators in district
    const navResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as cnt FROM navigators n
      JOIN users u ON u.id = n.user_id
      WHERE n.district_assigned = ? AND n.status = 'active'
    `).bind(cluster.district).first<{ cnt: number }>();

    const availableNavigators = navResult?.cnt ?? 0;

    const shouldCreate = shouldCreateSignal({
      category: cluster.category,
      district: cluster.district,
      needCount: cluster.need_count,
      unresolvedCount: cluster.unresolved_count,
      availableNavigators,
    });

    if (!shouldCreate) continue;

    // Check for existing unresolved signal of same type
    const existing = await c.env.DB.prepare(`
      SELECT id FROM community_signals WHERE category = ? AND district = ? AND status IN ('DETECTED','CAMPAIGN_DRAFTED')
    `).bind(cluster.category, cluster.district).first();

    if (existing) continue;

    const signalId = newId('sig');
    const suggestion = suggestCampaignFromSignal({
      category: cluster.category,
      district: cluster.district,
      needCount: cluster.need_count,
      unresolvedCount: cluster.unresolved_count,
      availableNavigators,
    });

    await c.env.DB.prepare(`
      INSERT INTO community_signals (id, category, district, need_count, unresolved_count, available_navigators,
        detection_window_days, status, summary, detected_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'DETECTED', ?, ?)
    `).bind(
      signalId, cluster.category, cluster.district,
      cluster.need_count, cluster.unresolved_count, availableNavigators,
      windowDays, suggestion.suggestedTitle, now,
    ).run();

    // Link contributing cases
    const cases = await c.env.DB.prepare(`
      SELECT id FROM loop_cases WHERE need_category = ? AND district = ? AND created_at >= ? AND status != 'CLOSED'
    `).bind(cluster.category, cluster.district, cutoff).all();

    const linkInserts = (cases.results ?? []).map((caseRow: any) =>
      c.env.DB.prepare('INSERT INTO community_signal_needs (id, signal_id, case_id, created_at) VALUES (?, ?, ?, ?)')
        .bind(newId('csn'), signalId, caseRow.id, now)
    );

    if (linkInserts.length > 0) {
      for (let i = 0; i < linkInserts.length; i += 80) {
        await c.env.DB.batch(linkInserts.slice(i, i + 80));
      }
    }

    signalsCreated.push(signalId);
  }

  return c.json({ detected: signalsCreated.length, signalIds: signalsCreated });
});

// ---------------------------------------------------------------------------
// POST /signals/:id/create-campaign — Generate campaign draft from signal
// ---------------------------------------------------------------------------
signalRoutes.post('/:id/create-campaign', async (c) => {
  const signalId = c.req.param('id');
  const user = userOf(c);

  const signal = await c.env.DB.prepare('SELECT * FROM community_signals WHERE id = ?').bind(signalId).first<any>();
  if (!signal) return c.json({ error: 'Signal not found', code: 'NOT_FOUND' }, 404);
  if (signal.status !== 'DETECTED') return c.json({ error: 'Signal already processed', code: 'STATUS_CONFLICT' }, 409);

  const suggestion = suggestCampaignFromSignal({
    category: signal.category,
    district: signal.district,
    needCount: signal.need_count,
    unresolvedCount: signal.unresolved_count,
    availableNavigators: signal.available_navigators,
  });

  const campaignId = newId('cmp');
  const now = nowIso();
  const startsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Default: 1 week from now

  await c.env.DB.batch([
    c.env.DB.prepare(`
      INSERT INTO campaigns (id, organization_id, created_by, title, description, category, district,
        starts_at, duration_minutes, total_slots, status, source, signal_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', 'SIGNAL_GENERATED', ?, ?, ?)
    `).bind(
      campaignId, user.orgId, user.id,
      suggestion.suggestedTitle,
      `Chiến dịch tạo từ Community Signal: ${signal.need_count} nhu cầu tương tự được phát hiện tại ${signal.district}`,
      signal.category, signal.district,
      startsAt, suggestion.estimatedDuration, suggestion.suggestedSlots,
      signalId, now, now,
    ),
    c.env.DB.prepare(`UPDATE community_signals SET status = 'CAMPAIGN_DRAFTED', campaign_id = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?`)
      .bind(campaignId, user.id, now, signalId),
  ]);

  return c.json({ campaignId, status: 'DRAFT', suggestion }, 201);
});

// ---------------------------------------------------------------------------
// PATCH /signals/:id/dismiss — Dismiss signal
// ---------------------------------------------------------------------------
signalRoutes.patch('/:id/dismiss', async (c) => {
  const signalId = c.req.param('id');
  const user = userOf(c);

  await c.env.DB.prepare(
    `UPDATE community_signals SET status = 'DISMISSED', reviewed_by = ?, reviewed_at = ? WHERE id = ?`
  ).bind(user.id, nowIso(), signalId).run();

  return c.json({ status: 'DISMISSED' });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSignalResponse(row: any) {
  return {
    id: row.id,
    category: row.category,
    district: row.district,
    ward: row.ward,
    needCount: row.need_count,
    unresolvedCount: row.unresolved_count,
    availableNavigators: row.available_navigators,
    detectionWindowDays: row.detection_window_days,
    status: row.status,
    campaignId: row.campaign_id,
    summary: row.summary,
    detectedAt: row.detected_at,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    linkedNeedCount: row.linked_need_count,
  };
}
