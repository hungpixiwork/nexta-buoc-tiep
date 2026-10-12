/**
 * CaseLifecycle.ts
 * Centralized Safe Next Step Case Lifecycle State Machine (Section 4 SSOT)
 * 
 * NEXTA — Your Next Safe Step | UNESCO Youth Hackathon 2026
 * 
 * Defines the strict, verifiable finite state machine governing beneficiary case
 * trajectories from initial street outreach/observation through to safe closure.
 */

import { DomainError } from '../shared/DomainError';

/**
 * 15 Canonical Core States (Linear/Standard progression path)
 */
export const CANONICAL_CASE_STATES = [
  'DRAFT',
  'OBSERVED',
  'CONSENT_RECORDED',
  'SAFETY_ASSESSED',
  'NEED_UNDERSTOOD',
  'RESOURCE_MATCHED',
  'SAFE_NEXT_STEP_SELECTED',
  'REFERRED',
  'RECEIVED',
  'ACCEPTED',
  'DECLINED',
  'ACTION_TAKEN',
  'FOLLOW_UP_DUE',
  'FOLLOWED_UP',
  'CLOSED',
] as const;

/**
 * 6 Exceptional States (Deviations, risks, interruptions, external outcomes)
 */
export const EXCEPTIONAL_CASE_STATES = [
  'ESCALATED',
  'CANCELLED',
  'UNSAFE_TO_CONTINUE',
  'RESOURCE_STALE',
  'NO_MATCH',
  'LOST_TO_FOLLOWUP',
] as const;

/**
 * All 21 valid case lifecycle states
 */
export const ALL_CASE_STATES = [
  ...CANONICAL_CASE_STATES,
  ...EXCEPTIONAL_CASE_STATES,
] as const;

export type CanonicalCaseState = (typeof CANONICAL_CASE_STATES)[number];
export type ExceptionalCaseState = (typeof EXCEPTIONAL_CASE_STATES)[number];
export type CaseState = (typeof ALL_CASE_STATES)[number];
export type CaseLifecycleState = CaseState; // Alias for backward compatibility

/**
 * Follow-up outcome evaluation labels
 */
export const FOLLOW_UP_OUTCOMES = ['BETTER', 'SAME', 'HARDER'] as const;
export type FollowUpOutcome = (typeof FOLLOW_UP_OUTCOMES)[number];

/**
 * Error raised when an illegal or out-of-order state transition is attempted.
 */
export class CaseLifecycleTransitionError extends DomainError {
  public readonly fromState: CaseState;
  public readonly toState: CaseState;

  constructor(fromState: CaseState, toState: CaseState, reason?: string) {
    const msg = `[CaseLifecycle] Chuyển đổi trạng thái không hợp lệ: "${fromState}" -> "${toState}". ${
      reason || 'Không nằm trong danh mục chuyển trạng thái được phép theo Quy chuẩn NEXTA SSOT.'
    }`;
    super(msg, 'INVALID_CASE_TRANSITION', { fromState, toState });
    this.name = 'CaseLifecycleTransitionError';
    this.fromState = fromState;
    this.toState = toState;
  }
}

/**
 * State Transition Adjacency Matrix
 * Enforces linear progression through core journey while supporting safe exceptional branch outs.
 */
export const CASE_LIFECYCLE_TRANSITIONS: Record<CaseState, readonly CaseState[]> = {
  // 1. Initial Draft Intake (Local draft before volunteer encounter confirmation)
  DRAFT: ['OBSERVED', 'CANCELLED'],

  // 2. Observations Recorded (Field encounter details & basic observations logged)
  OBSERVED: ['CONSENT_RECORDED', 'CANCELLED', 'UNSAFE_TO_CONTINUE'],

  // 3. Granular Three-Khong Consent Recorded (Beneficiary informed consent verified)
  CONSENT_RECORDED: ['SAFETY_ASSESSED', 'CANCELLED', 'UNSAFE_TO_CONTINUE'],

  // 4. Pre-engagement Safeguarding Assessment (Child safety / violence / exploitation screening)
  SAFETY_ASSESSED: ['NEED_UNDERSTOOD', 'ESCALATED', 'UNSAFE_TO_CONTINUE', 'CANCELLED'],

  // 5. Strength-based Needs Understood (Needs prioritized with beneficiary strengths)
  NEED_UNDERSTOOD: ['RESOURCE_MATCHED', 'NO_MATCH', 'ESCALATED', 'CANCELLED'],

  // 6. Verified Resource Matched (Fresh, verified service provider identified)
  RESOURCE_MATCHED: ['SAFE_NEXT_STEP_SELECTED', 'RESOURCE_STALE', 'NO_MATCH', 'CANCELLED'],

  // 7. One Bounded Safe Next Step Selected (Concrete 5W1H single action agreed)
  SAFE_NEXT_STEP_SELECTED: ['REFERRED', 'ACTION_TAKEN', 'ESCALATED', 'CANCELLED'],

  // 8. Minimal Referral Dispatched to Verified Partner (Zero-leakage referral sent)
  REFERRED: ['RECEIVED', 'CANCELLED', 'LOST_TO_FOLLOWUP'],

  // 9. Partner Inbox Received Referral (Partner notified and acknowledges receipt)
  RECEIVED: ['ACCEPTED', 'DECLINED', 'ESCALATED', 'CANCELLED'],

  // 10. Partner Accepted Case (Partner confirms capacity and readiness to serve)
  ACCEPTED: ['ACTION_TAKEN', 'DECLINED', 'CANCELLED'],

  // 11. Partner Declined / Full Capacity -> Reroute to Match or Close gracefully
  DECLINED: ['RESOURCE_MATCHED', 'NO_MATCH', 'CLOSED', 'CANCELLED'],

  // 12. Safe Next Step Action Executed (Call completed, shelter checked-in, form submitted)
  ACTION_TAKEN: ['FOLLOW_UP_DUE', 'FOLLOWED_UP', 'CANCELLED'],

  // 13. Follow-Up Scheduled (48h / 7d / 30d SLA timer active)
  FOLLOW_UP_DUE: ['FOLLOWED_UP', 'LOST_TO_FOLLOWUP', 'CANCELLED'],

  // 14. Follow-Up Interview Conducted (Post-intervention check completed)
  // - BETTER -> CLOSED (Goal reached, stability achieved)
  // - SAME -> SAFE_NEXT_STEP_SELECTED (Same state, iterate safe step)
  // - HARDER -> NEED_UNDERSTOOD (Worse situation, re-assess needs & safety)
  // - Exceptional -> ESCALATED / LOST_TO_FOLLOWUP / CANCELLED
  FOLLOWED_UP: [
    'CLOSED',
    'SAFE_NEXT_STEP_SELECTED',
    'NEED_UNDERSTOOD',
    'ESCALATED',
    'LOST_TO_FOLLOWUP',
    'CANCELLED',
  ],

  // 15. Terminal State: Closed (Case successfully resolved or finalized)
  CLOSED: [],

  // --- EXCEPTIONAL STATES ---
  // Escalated: Immediate child protection 111 / high risk crisis intervention
  ESCALATED: ['NEED_UNDERSTOOD', 'SAFETY_ASSESSED', 'CLOSED'],

  // Unsafe to continue: Street environment dangerous for field worker / beneficiary
  UNSAFE_TO_CONTINUE: ['ESCALATED', 'CLOSED'],

  // Resource stale: Matched resource verification expired (>30 days)
  RESOURCE_STALE: ['RESOURCE_MATCHED', 'NO_MATCH'],

  // No match: No verified resource meets beneficiary criteria
  NO_MATCH: ['SAFE_NEXT_STEP_SELECTED', 'CLOSED'],

  // Lost to follow-up: Beneficiary could not be re-contacted after SLA attempts
  LOST_TO_FOLLOWUP: ['NEED_UNDERSTOOD', 'CLOSED'],

  // Cancelled: Beneficiary withdrew consent or duplicate intake cancelled
  CANCELLED: [],
};

/**
 * Validates if transition between two case lifecycle states is permitted.
 */
export function canTransitionCaseLifecycle(
  current: CaseState,
  next: CaseState
): boolean {
  if (current === next) return true;
  const allowed = CASE_LIFECYCLE_TRANSITIONS[current];
  return allowed ? allowed.includes(next) : false;
}

/**
 * Asserts valid transition, throwing CaseLifecycleTransitionError if illegal.
 */
export function assertValidCaseTransition(
  current: CaseState,
  next: CaseState,
  reason?: string
): void {
  if (!canTransitionCaseLifecycle(current, next)) {
    throw new CaseLifecycleTransitionError(current, next, reason);
  }
}

/**
 * Alias for assertValidCaseTransition (backward compatibility)
 */
export function assertValidCaseLifecycleTransition(
  current: CaseLifecycleState,
  next: CaseLifecycleState,
  reason?: string
): void {
  assertValidCaseTransition(current, next, reason);
}

/**
 * Returns whether state is terminal (no further transitions possible).
 */
export function isTerminalCaseState(state: CaseState): boolean {
  return CASE_LIFECYCLE_TRANSITIONS[state]?.length === 0;
}

export function isTerminalCaseLifecycleState(state: CaseLifecycleState): boolean {
  return isTerminalCaseState(state);
}

/**
 * Returns whether state is an exceptional/unusual path.
 */
export function isExceptionalCaseState(state: CaseState): boolean {
  return (EXCEPTIONAL_CASE_STATES as readonly string[]).includes(state);
}

export function isExceptionalCaseLifecycleState(state: CaseLifecycleState): boolean {
  return isExceptionalCaseState(state);
}

/**
 * Returns whether state is a canonical progression state.
 */
export function isCanonicalCaseState(state: CaseState): boolean {
  return (CANONICAL_CASE_STATES as readonly string[]).includes(state);
}

/**
 * Returns allowed next states for given state.
 */
export function getValidNextCaseStates(state: CaseState): readonly CaseState[] {
  return CASE_LIFECYCLE_TRANSITIONS[state] || [];
}

export function getValidNextCaseLifecycleStates(
  state: CaseLifecycleState
): readonly CaseLifecycleState[] {
  return getValidNextCaseStates(state);
}
