/**
 * Application lifecycle for everyone who joins NEXTA.
 *
 *   SUBMITTED → SCREENED → (NEEDS_INFO ↺ SCREENED) → APPROVED | REJECTED
 *   APPROVED ⇄ SUSPENDED
 *
 * Screening is automatic; every decision after it is made by an accountable person.
 */

export const APPLICATION_KINDS = ['PARTNER', 'VOLUNTEER', 'HOST', 'OBSERVER'] as const;
export type ApplicationKind = (typeof APPLICATION_KINDS)[number];

export const APPLICATION_STATUSES = ['SUBMITTED', 'SCREENED', 'NEEDS_INFO', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type ApplicationDecision = 'approve' | 'request_info' | 'reject' | 'suspend' | 'reinstate';
export type ApplicationReviewer = 'PLATFORM_COORDINATOR' | 'HOST_ADMIN';

const TRANSITIONS: Record<ApplicationStatus, Partial<Record<ApplicationDecision | 'screen' | 'resubmit', ApplicationStatus>>> = {
  SUBMITTED: { screen: 'SCREENED' },
  SCREENED: { approve: 'APPROVED', request_info: 'NEEDS_INFO', reject: 'REJECTED' },
  NEEDS_INFO: { resubmit: 'SUBMITTED', reject: 'REJECTED' },
  APPROVED: { suspend: 'SUSPENDED' },
  SUSPENDED: { reinstate: 'APPROVED', reject: 'REJECTED' },
  REJECTED: {},
};

/** Who may decide which kind of application. Host admins only decide volunteers for their own org. */
export const DECIDERS: Record<ApplicationKind, readonly ApplicationReviewer[]> = {
  PARTNER: ['PLATFORM_COORDINATOR'],
  HOST: ['PLATFORM_COORDINATOR'],
  OBSERVER: ['PLATFORM_COORDINATOR'],
  VOLUNTEER: ['PLATFORM_COORDINATOR', 'HOST_ADMIN'],
};

/** Working-day SLA for a decision, shown to applicants and reviewers. */
export const REVIEW_SLA_DAYS: Record<ApplicationKind, number> = { PARTNER: 3, HOST: 5, OBSERVER: 3, VOLUNTEER: 3 };

export type DecisionPlan =
  | { ok: true; from: ApplicationStatus; to: ApplicationStatus }
  | { ok: false; code: 'INVALID_TRANSITION' | 'NOT_ALLOWED' | 'REASON_REQUIRED'; message: string };

export function planDecision(
  kind: ApplicationKind,
  current: ApplicationStatus,
  decision: ApplicationDecision | 'screen' | 'resubmit',
  reviewer: ApplicationReviewer | 'SYSTEM' | 'APPLICANT',
  note?: string | null,
): DecisionPlan {
  if (decision === 'screen' && reviewer !== 'SYSTEM') return { ok: false, code: 'NOT_ALLOWED', message: 'Screening is automatic' };
  if (decision === 'resubmit' && reviewer !== 'APPLICANT') return { ok: false, code: 'NOT_ALLOWED', message: 'Only the applicant resubmits' };
  if (decision !== 'screen' && decision !== 'resubmit' && !DECIDERS[kind].includes(reviewer as ApplicationReviewer)) {
    return { ok: false, code: 'NOT_ALLOWED', message: `${reviewer} cannot decide ${kind} applications` };
  }
  if ((decision === 'reject' || decision === 'suspend' || decision === 'request_info') && !note?.trim()) {
    return { ok: false, code: 'REASON_REQUIRED', message: 'A reason is required' };
  }
  const to = TRANSITIONS[current][decision];
  if (!to) return { ok: false, code: 'INVALID_TRANSITION', message: `Cannot ${decision} from ${current}` };
  return { ok: true, from: current, to };
}

/** Adds working days (Mon–Fri) for the SLA due date. */
export function addWorkingDays(from: Date, days: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) added += 1;
  }
  return d;
}
