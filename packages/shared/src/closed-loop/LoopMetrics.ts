/**
 * LoopMetrics — RE:ACT metrics computed only from recorded events. No constants,
 * no multipliers: if nothing happened, the number is zero.
 *
 * North Star — Safe Next Step Rate:
 *   % of journeys where a Safe Next Step was confirmed AND a follow-up reached the
 *   person and recorded an outcome (Better / Same / Harder).
 */
import { normalizeLoopStage, normalizeFollowUpResult, type LoopStage, type FollowUpResult } from './ReferralLoop';
import { resolveVerificationFreshness } from './MatchPipeline';

export interface LoopMetricsInput {
  cases: Array<{ id: string; createdAt: string | null }>;
  safeNextSteps: Array<{ caseId: string; status: string | null; confirmedAt?: string | null }>;
  referrals: Array<{ id: string; caseId: string; status: string | null }>;
  followUps: Array<{ caseId: string; status?: string | null; result?: string | null; dueAt?: string | null; completedAt?: string | null }>;
  resources: Array<{ verificationStatus?: string | null; verifiedAt?: string | null; verificationExpiresAt?: string | null }>;
  escalations: Array<{ caseId: string }>;
  now?: Date;
}

export interface LoopMetrics {
  journeys: number;
  safeNextStepRate: number;
  safeNextStepsConfirmed: number;
  journeysClosedLoop: number;
  referralAcceptanceRate: number;
  referralsDecided: number;
  medianHoursToSafeNextStep: number | null;
  followUpCompletionRate: number;
  followUpsDue: number;
  followUpsOverdue: number;
  verificationFreshnessRate: number;
  resourcesVerified: number;
  resourcesNeedsRecheck: number;
  resourcesUnconfirmed: number;
  safeguardingEscalations: number;
  outcomes: Record<Exclude<FollowUpResult, 'UNREACHABLE'>, number>;
  funnel: Array<{ key: string; count: number }>;
  referralStages: Record<LoopStage, number>;
  isZeroState: boolean;
}

const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  const m = s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  return Math.round(m * 10) / 10;
}

const CONFIRMED_SNS = ['CONFIRMED', 'REACHED'];
const STAGE_ORDER: LoopStage[] = ['CREATED', 'RECEIVED', 'ACCEPTED', 'ACTION_TAKEN', 'OUTCOME_RECORDED', 'FOLLOW_UP_DONE', 'CLOSED'];

function reached(stage: LoopStage, atLeast: LoopStage): boolean {
  const a = STAGE_ORDER.indexOf(stage);
  return a >= 0 && a >= STAGE_ORDER.indexOf(atLeast);
}

export function computeLoopMetrics(input: LoopMetricsInput): LoopMetrics {
  const now = input.now ?? new Date();
  const caseCreated = new Map(input.cases.map((c) => [c.id, c.createdAt]));

  // Safe Next Steps
  const confirmedSns = input.safeNextSteps.filter((s) => CONFIRMED_SNS.includes((s.status ?? '').toUpperCase()));
  const casesWithSns = new Set(confirmedSns.map((s) => s.caseId));
  const hoursToSns: number[] = [];
  const firstConfirm = new Map<string, number>();
  for (const s of confirmedSns) {
    if (!s.confirmedAt) continue;
    const t = new Date(s.confirmedAt).getTime();
    const prev = firstConfirm.get(s.caseId);
    if (prev === undefined || t < prev) firstConfirm.set(s.caseId, t);
  }
  for (const [caseId, t] of firstConfirm) {
    const created = caseCreated.get(caseId);
    if (!created) continue;
    const diff = (t - new Date(created).getTime()) / 3_600_000;
    if (diff >= 0) hoursToSns.push(diff);
  }

  // Follow-ups
  const results = input.followUps.map((f) => ({ ...f, r: normalizeFollowUpResult(f.result) }));
  const reachedFollowUp = new Set(results.filter((f) => f.r && f.r !== 'UNREACHABLE').map((f) => f.caseId));
  const completed = results.filter((f) => f.r !== null || (f.status ?? '').toLowerCase() === 'completed');
  const due = results.filter((f) => {
    if (f.r !== null || (f.status ?? '').toLowerCase() === 'completed') return true;
    return f.dueAt ? new Date(f.dueAt).getTime() <= now.getTime() : false;
  });
  const overdue = due.length - completed.length;
  const outcomes = { BETTER: 0, SAME: 0, HARDER: 0 };
  for (const f of results) if (f.r && f.r !== 'UNREACHABLE') outcomes[f.r] += 1;

  // Closed loop = SNS confirmed + follow-up reached the person
  const closedLoop = [...casesWithSns].filter((id) => reachedFollowUp.has(id));

  // Referrals
  const stages = input.referrals.map((r) => normalizeLoopStage(r.status));
  const referralStages = Object.fromEntries(
    (['CREATED', 'RECEIVED', 'ACCEPTED', 'DECLINED', 'ACTION_TAKEN', 'OUTCOME_RECORDED', 'FOLLOW_UP_DONE', 'CLOSED', 'ESCALATED'] as LoopStage[]).map(
      (s) => [s, stages.filter((x) => x === s).length],
    ),
  ) as Record<LoopStage, number>;
  const accepted = stages.filter((s) => reached(s, 'ACCEPTED')).length;
  const declined = referralStages.DECLINED;
  const actionTaken = stages.filter((s) => reached(s, 'ACTION_TAKEN')).length;

  // Resources
  let verified = 0;
  let recheck = 0;
  let unconfirmed = 0;
  let active = 0;
  for (const r of input.resources) {
    const f = resolveVerificationFreshness(r, now);
    if (f === 'INACTIVE') continue;
    active += 1;
    if (f === 'VERIFIED') verified += 1;
    else if (f === 'NEEDS_RECHECK') recheck += 1;
    else unconfirmed += 1;
  }

  const journeys = input.cases.length;
  const escalatedCases = new Set(input.escalations.map((e) => e.caseId));

  return {
    journeys,
    safeNextStepRate: pct(closedLoop.length, journeys),
    safeNextStepsConfirmed: casesWithSns.size,
    journeysClosedLoop: closedLoop.length,
    referralAcceptanceRate: pct(accepted, accepted + declined),
    referralsDecided: accepted + declined,
    medianHoursToSafeNextStep: median(hoursToSns),
    followUpCompletionRate: pct(completed.length, due.length),
    followUpsDue: due.length,
    followUpsOverdue: Math.max(0, overdue),
    verificationFreshnessRate: pct(verified, active),
    resourcesVerified: verified,
    resourcesNeedsRecheck: recheck,
    resourcesUnconfirmed: unconfirmed,
    safeguardingEscalations: escalatedCases.size,
    outcomes,
    funnel: [
      { key: 'journeys', count: journeys },
      { key: 'safe_next_step', count: casesWithSns.size },
      { key: 'referral_accepted', count: accepted },
      { key: 'action_taken', count: actionTaken },
      { key: 'follow_up_reached', count: reachedFollowUp.size },
      { key: 'better', count: outcomes.BETTER },
    ],
    referralStages,
    isZeroState: journeys === 0,
  };
}
