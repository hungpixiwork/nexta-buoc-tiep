/**
 * Operational report for coordinators (Báo cáo & chất lượng vận hành).
 * Pure function over raw rows so every number on the dashboard is reproducible and testable.
 *
 * Definitions (kept deliberately simple so they can be explained to a partner or a donor):
 *  - Funnel: of journeys OPENED in the period, how many reached each of the 6 visible steps.
 *  - Connection success: referrals the partner accepted ÷ referrals the partner decided (accept + decline).
 *  - On-time response: partner decided within the SLA (24h urgent / 48h normal) ÷ decided.
 *  - Needs review: open safety escalations + overdue check-ins + referrals waiting past SLA
 *    + open journeys with no update for 7 days.
 */
import type { NeedCategory } from './MatchPipeline';

export interface ReportCase {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: 'OPEN' | 'CLOSED' | string;
  need: NeedCategory | string | null;
  riskDecision: string | null;
  urgency: string | null;
}

export interface ReportReferral {
  id: string;
  caseId: string;
  stage: string;
  createdAt: string;
  organisationName: string | null;
  category: string | null;
  urgency: string | null;
  /** First accept/decline event time, if any */
  decidedAt: string | null;
  accepted: boolean;
}

export interface ReportInput {
  cases: ReportCase[];
  nextStepCaseIds: string[];
  referrals: ReportReferral[];
  followUps: Array<{ caseId: string; dueAt: string; completedAt: string | null; result: string | null }>;
  openEscalations: number;
  from: Date;
  to: Date;
  now?: Date;
}

export interface PartnerSpeed {
  organisationName: string;
  category: string | null;
  decided: number;
  avgHours: number;
  onTimeRate: number;
}

export interface LoopReport {
  from: string;
  to: string;
  journeysActive: number;
  connectionRate: number;
  onTimeRate: number;
  needsReview: number;
  funnel: Array<{ step: 1 | 2 | 3 | 4 | 5 | 6; count: number; pct: number }>;
  needs: Array<{ need: string; count: number; pct: number }>;
  partners: PartnerSpeed[];
  signals: { staleJourneys: number; waitingPartner: number; openSafety: number; overdueFollowUps: number };
  sla: { onTime: number; soon: number; late: number };
}

const H = 3_600_000;
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
const slaHours = (urgency: string | null) => (urgency === 'urgent' ? 24 : 48);
const inRange = (iso: string | null | undefined, from: Date, to: Date) => Boolean(iso) && new Date(iso as string) >= from && new Date(iso as string) < to;

export function computeLoopReport(input: ReportInput): LoopReport {
  const now = input.now ?? new Date();
  const { from, to } = input;
  const opened = input.cases.filter((c) => inRange(c.createdAt, from, to));
  const openedIds = new Set(opened.map((c) => c.id));
  const stepSets = {
    understood: new Set(opened.filter((c) => c.need).map((c) => c.id)),
    verified: new Set(opened.filter((c) => c.riskDecision).map((c) => c.id)),
    nextStep: new Set(input.nextStepCaseIds.filter((id) => openedIds.has(id))),
    connected: new Set(input.referrals.filter((r) => openedIds.has(r.caseId) && r.accepted).map((r) => r.caseId)),
    followed: new Set(input.followUps.filter((f) => openedIds.has(f.caseId) && f.completedAt && f.result && f.result !== 'UNREACHABLE').map((f) => f.caseId)),
  };
  const counts = [opened.length, stepSets.understood.size, stepSets.verified.size, stepSets.nextStep.size, stepSets.connected.size, stepSets.followed.size];
  const funnel = counts.map((count, i) => ({ step: (i + 1) as 1 | 2 | 3 | 4 | 5 | 6, count, pct: pct(count, opened.length) }));

  const needCounts = new Map<string, number>();
  for (const c of opened) if (c.need) needCounts.set(String(c.need), (needCounts.get(String(c.need)) ?? 0) + 1);
  const needTotal = [...needCounts.values()].reduce((a, b) => a + b, 0);
  const needs = [...needCounts.entries()].map(([need, count]) => ({ need, count, pct: pct(count, needTotal) })).sort((a, b) => b.count - a.count);

  const decided = input.referrals.filter((r) => inRange(r.decidedAt, from, to));
  const onTime = decided.filter((r) => new Date(r.decidedAt!).getTime() - new Date(r.createdAt).getTime() <= slaHours(r.urgency) * H);
  const byOrg = new Map<string, ReportReferral[]>();
  for (const r of decided) {
    const k = r.organisationName ?? '—';
    byOrg.set(k, [...(byOrg.get(k) ?? []), r]);
  }
  const partners: PartnerSpeed[] = [...byOrg.entries()]
    .map(([organisationName, rs]) => {
      const hours = rs.map((r) => (new Date(r.decidedAt!).getTime() - new Date(r.createdAt).getTime()) / H);
      return {
        organisationName,
        category: rs[0].category,
        decided: rs.length,
        avgHours: Math.round((hours.reduce((a, b) => a + b, 0) / rs.length) * 10) / 10,
        onTimeRate: pct(rs.filter((r, i) => hours[i] <= slaHours(r.urgency)).length, rs.length),
      };
    })
    .sort((a, b) => a.avgHours - b.avgHours);

  const waiting = input.referrals.filter((r) => (r.stage === 'CREATED' || r.stage === 'RECEIVED') && !r.decidedAt);
  const deadline = (r: ReportReferral) => new Date(r.createdAt).getTime() + slaHours(r.urgency) * H;
  const sla = {
    onTime: waiting.filter((r) => deadline(r) - now.getTime() > 12 * H).length,
    soon: waiting.filter((r) => deadline(r) - now.getTime() <= 12 * H && deadline(r) >= now.getTime()).length,
    late: waiting.filter((r) => deadline(r) < now.getTime()).length,
  };
  const openCases = input.cases.filter((c) => c.status === 'OPEN');
  const signals = {
    staleJourneys: openCases.filter((c) => now.getTime() - new Date(c.updatedAt).getTime() > 7 * 24 * H).length,
    waitingPartner: sla.late,
    openSafety: input.openEscalations,
    overdueFollowUps: input.followUps.filter((f) => !f.completedAt && new Date(f.dueAt) < now).length,
  };

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    journeysActive: openCases.length,
    connectionRate: pct(decided.filter((r) => r.accepted).length, decided.length),
    onTimeRate: pct(onTime.length, decided.length),
    needsReview: signals.staleJourneys + signals.waitingPartner + signals.openSafety + signals.overdueFollowUps,
    funnel,
    needs,
    partners,
    signals,
    sla,
  };
}
