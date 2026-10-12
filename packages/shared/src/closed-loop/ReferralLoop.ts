/**
 * ReferralLoop — canonical closed-loop referral lifecycle (RE:ACT SSOT).
 *
 *   CREATED → RECEIVED → ACCEPTED | DECLINED → ACTION_TAKEN → OUTCOME_RECORDED
 *           → FOLLOW_UP_DONE → CLOSED | ESCALATED
 *
 * "No referral disappears silently": every referral must reach CLOSED or
 * ESCALATED, and every hop is an explicit, attributable action.
 * Legacy statuses stored in D1 (25 values from three older vocabularies) are
 * mapped onto this lifecycle with `normalizeLoopStage`.
 */

export const LOOP_STAGES = [
  'CREATED',
  'RECEIVED',
  'ACCEPTED',
  'DECLINED',
  'ACTION_TAKEN',
  'OUTCOME_RECORDED',
  'FOLLOW_UP_DONE',
  'CLOSED',
  'ESCALATED',
] as const;

export type LoopStage = (typeof LOOP_STAGES)[number];

/** Happy-path stages rendered by the referral tracker, in order. */
export const LOOP_TRACK: readonly LoopStage[] = [
  'CREATED',
  'RECEIVED',
  'ACCEPTED',
  'ACTION_TAKEN',
  'OUTCOME_RECORDED',
  'FOLLOW_UP_DONE',
  'CLOSED',
];

export const LOOP_TRANSITIONS: Record<LoopStage, readonly LoopStage[]> = {
  CREATED: ['RECEIVED', 'ESCALATED'],
  RECEIVED: ['ACCEPTED', 'DECLINED', 'ESCALATED'],
  ACCEPTED: ['ACTION_TAKEN', 'DECLINED', 'ESCALATED'],
  DECLINED: ['CLOSED', 'ESCALATED'],
  ACTION_TAKEN: ['OUTCOME_RECORDED', 'ESCALATED'],
  OUTCOME_RECORDED: ['FOLLOW_UP_DONE', 'ESCALATED'],
  FOLLOW_UP_DONE: ['CLOSED', 'ESCALATED'],
  CLOSED: [],
  ESCALATED: ['CLOSED'],
};

export type LoopActor = 'NAVIGATOR' | 'PARTNER' | 'COORDINATOR';

export type LoopAction =
  | 'receive'
  | 'accept'
  | 'decline'
  | 'mark_action_taken'
  | 'record_outcome'
  | 'complete_follow_up'
  | 'close'
  | 'escalate';

export const LOOP_ACTION_TARGET: Record<LoopAction, LoopStage> = {
  receive: 'RECEIVED',
  accept: 'ACCEPTED',
  decline: 'DECLINED',
  mark_action_taken: 'ACTION_TAKEN',
  record_outcome: 'OUTCOME_RECORDED',
  complete_follow_up: 'FOLLOW_UP_DONE',
  close: 'CLOSED',
  escalate: 'ESCALATED',
};

/** Who is accountable for each hop. Coordinators may act on behalf of anyone. */
export const LOOP_ACTION_ACTORS: Record<LoopAction, readonly LoopActor[]> = {
  receive: ['PARTNER', 'COORDINATOR'],
  accept: ['PARTNER', 'COORDINATOR'],
  decline: ['PARTNER', 'COORDINATOR'],
  mark_action_taken: ['PARTNER', 'COORDINATOR'],
  record_outcome: ['PARTNER', 'NAVIGATOR', 'COORDINATOR'],
  complete_follow_up: ['NAVIGATOR', 'COORDINATOR'],
  close: ['NAVIGATOR', 'COORDINATOR'],
  escalate: ['NAVIGATOR', 'PARTNER', 'COORDINATOR'],
};

const LEGACY_STAGE_MAP: Record<string, LoopStage> = {
  // pre-dispatch vocabularies collapse into CREATED
  DRAFT: 'CREATED',
  READY_FOR_REVIEW: 'CREATED',
  APPROVED: 'CREATED',
  CREATED: 'CREATED',
  SENT: 'CREATED',
  SUBMITTED: 'CREATED',
  OPENED_EXTERNALLY: 'CREATED',
  EXPORTED: 'CREATED',
  SUBMITTED_MANUALLY: 'CREATED',
  PROPOSED: 'CREATED',
  RECEIVED: 'RECEIVED',
  UNDER_REVIEW: 'RECEIVED',
  ACKNOWLEDGED: 'RECEIVED',
  ACCEPTED: 'ACCEPTED',
  ACTION_SCHEDULED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  REJECTED: 'DECLINED',
  ACTION_TAKEN: 'ACTION_TAKEN',
  SERVICE_REACHED: 'ACTION_TAKEN',
  OUTCOME_PENDING: 'OUTCOME_RECORDED',
  OUTCOME_CONFIRMED: 'OUTCOME_RECORDED',
  OUTCOME_RECORDED: 'OUTCOME_RECORDED',
  FOLLOW_UP_DONE: 'FOLLOW_UP_DONE',
  CLOSED: 'CLOSED',
  UNRESOLVED: 'CLOSED',
  CANCELLED: 'CLOSED',
  ESCALATED: 'ESCALATED',
};

/** Maps any stored referral status (legacy or canonical, any case) to a loop stage. */
export function normalizeLoopStage(status: string | null | undefined): LoopStage {
  if (!status) return 'CREATED';
  return LEGACY_STAGE_MAP[status.trim().toUpperCase()] ?? 'CREATED';
}

export function isLoopStage(value: string): value is LoopStage {
  return (LOOP_STAGES as readonly string[]).includes(value);
}

export function isTerminalLoopStage(stage: LoopStage): boolean {
  return LOOP_TRANSITIONS[stage].length === 0;
}

export function canTransitionLoop(from: LoopStage, to: LoopStage): boolean {
  return LOOP_TRANSITIONS[from].includes(to);
}

export type LoopTransitionPlan =
  | { ok: true; from: LoopStage; path: LoopStage[] }
  | { ok: false; from: LoopStage; code: 'INVALID_TRANSITION' | 'ACTOR_NOT_ALLOWED' | 'REASON_REQUIRED'; message: string };

/**
 * Plans the stage hops an action produces. A partner opening a fresh referral and
 * accepting/declining in one go implicitly records RECEIVED first, so the event
 * log never skips the "partner saw it" moment.
 */
export function planLoopAction(
  currentStatus: string | null | undefined,
  action: LoopAction,
  actor: LoopActor,
  options: { reason?: string | null } = {},
): LoopTransitionPlan {
  const from = normalizeLoopStage(currentStatus);
  const target = LOOP_ACTION_TARGET[action];

  if (!LOOP_ACTION_ACTORS[action].includes(actor)) {
    return { ok: false, from, code: 'ACTOR_NOT_ALLOWED', message: `${actor} cannot perform "${action}"` };
  }
  if ((action === 'decline' || action === 'escalate') && !options.reason?.trim()) {
    return { ok: false, from, code: 'REASON_REQUIRED', message: `A reason is required to ${action} a referral` };
  }
  if (canTransitionLoop(from, target)) {
    return { ok: true, from, path: [target] };
  }
  if (from === 'CREATED' && canTransitionLoop('RECEIVED', target)) {
    return { ok: true, from, path: ['RECEIVED', target] };
  }
  return {
    ok: false,
    from,
    code: 'INVALID_TRANSITION',
    message: `Cannot move referral from ${from} to ${target}`,
  };
}

/** Allowed actions for an actor at the current stage — drives UI buttons. */
export function availableLoopActions(currentStatus: string | null | undefined, actor: LoopActor): LoopAction[] {
  return (Object.keys(LOOP_ACTION_TARGET) as LoopAction[]).filter(
    (action) => planLoopAction(currentStatus, action, actor, { reason: 'x' }).ok,
  );
}

/** 0..1 progress along the happy path (DECLINED/ESCALATED report where they stopped). */
export function loopProgress(stage: LoopStage): number {
  const idx = LOOP_TRACK.indexOf(stage);
  if (idx >= 0) return idx / (LOOP_TRACK.length - 1);
  if (stage === 'DECLINED') return LOOP_TRACK.indexOf('ACCEPTED') / (LOOP_TRACK.length - 1);
  return 1;
}

// ---------------------------------------------------------------------------
// Follow-up outcome → what happens next
// ---------------------------------------------------------------------------

export const FOLLOW_UP_RESULTS = ['BETTER', 'SAME', 'HARDER', 'UNREACHABLE'] as const;
export type FollowUpResult = (typeof FOLLOW_UP_RESULTS)[number];

export interface FollowUpConsequence {
  /** Referral should advance to FOLLOW_UP_DONE */
  completesFollowUp: boolean;
  /** Suggest closing the journey */
  suggestClose: boolean;
  /** Need must be re-opened and a new Safe Next Step agreed */
  reopenNeed: boolean;
  /** Needs a human reviewer (coordinator) */
  requiresReview: boolean;
  /** Days until the next follow-up, or null if none */
  nextFollowUpInDays: number | null;
}

export function followUpConsequence(result: FollowUpResult): FollowUpConsequence {
  switch (result) {
    case 'BETTER':
      return { completesFollowUp: true, suggestClose: true, reopenNeed: false, requiresReview: false, nextFollowUpInDays: null };
    case 'SAME':
      return { completesFollowUp: true, suggestClose: false, reopenNeed: true, requiresReview: false, nextFollowUpInDays: 7 };
    case 'HARDER':
      return { completesFollowUp: true, suggestClose: false, reopenNeed: true, requiresReview: true, nextFollowUpInDays: 3 };
    case 'UNREACHABLE':
      return { completesFollowUp: false, suggestClose: false, reopenNeed: false, requiresReview: false, nextFollowUpInDays: 3 };
  }
}

/** Legacy follow-up keys (`worse`, `better`, lowercase) → canonical result. */
export function normalizeFollowUpResult(value: string | null | undefined): FollowUpResult | null {
  if (!value) return null;
  const v = value.trim().toUpperCase();
  if (v === 'WORSE') return 'HARDER';
  return (FOLLOW_UP_RESULTS as readonly string[]).includes(v) ? (v as FollowUpResult) : null;
}
