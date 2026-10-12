/**
 * Interface and base class for Domain Events.
 */
export interface IDomainEvent {
  dateTimeOccurred: Date;
  aggregateId: string;
  eventName: string;
}

export abstract class DomainEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly aggregateId: string;
  public abstract readonly eventName: string;

  constructor(aggregateId: string, dateTimeOccurred?: Date) {
    this.dateTimeOccurred = dateTimeOccurred ? dateTimeOccurred : new Date();
    this.aggregateId = aggregateId;
  }
}

// ============================================================================
// ASYNC & DURABLE EXECUTION LAYER — Queue Message Envelope & Event Taxonomy
// Ref: docs/BUOC_TIEP_SYSTEM_ARCHITECTURE_V2.md
//   Section 12 (Queue Architecture), Section 13 (Outbox Pattern),
//   Section 44 (Event Taxonomy)
// ============================================================================

/**
 * Wire envelope for a domain event carried on a Cloudflare Queue.
 * This is the literal shape specified in Architecture V2 Section 12.
 *
 * Queues do not guarantee delivery order, so aggregate state must never be
 * derived from queue ordering alone — always re-derive from D1 (the
 * transactional SSOT) inside the consumer.
 */
export interface DomainMessage<TPayload = unknown> {
  /** Unique id of this message (== domain_outbox.id when sourced from the Outbox). */
  eventId: string;
  /** One of the EventTaxonomy constants below, e.g. 'CASE.CREATED'. */
  eventType: string;
  /** Id of the aggregate the event happened to (case id, referral id, resource id, ...). */
  aggregateId: string;
  /** Monotonic version of the aggregate at the time the event was recorded. */
  aggregateVersion: number;
  /** ISO-8601 timestamp of when the event occurred (fact time, not publish time). */
  occurredAt: string;
  /** Correlates all events/commands belonging to the same end-to-end journey. */
  correlationId: string;
  /** Id of the command/event that directly caused this event, if any. */
  causationId?: string;
  /** Event-specific data. Consumers must treat this as untrusted AI/user input where relevant. */
  payload: TPayload;
}

/**
 * Event Taxonomy (Architecture V2 Section 44).
 *
 * Events represent facts that already happened (past tense, DOMAIN.VERB_PAST).
 * Commands (CreateReferral, AcceptReferral, VerifyResource, ...) are a
 * different concept and must never be mixed into this table.
 */
export const EventTaxonomy = {
  // Case
  CASE_CREATED: 'CASE.CREATED',
  CASE_OBSERVATION_ADDED: 'CASE.OBSERVATION_ADDED',
  CASE_NEED_VERIFIED: 'CASE.NEED_VERIFIED',

  // Safety / Safeguarding
  SAFETY_RISK_DETECTED: 'SAFETY.RISK_DETECTED',
  SAFETY_REVIEW_REQUESTED: 'SAFETY.REVIEW_REQUESTED',
  SAFETY_ESCALATED: 'SAFETY.ESCALATED',

  // Resource
  RESOURCE_CREATED: 'RESOURCE.CREATED',
  RESOURCE_VERIFIED: 'RESOURCE.VERIFIED',
  RESOURCE_BECAME_STALE: 'RESOURCE.BECAME_STALE',
  RESOURCE_CAPACITY_CHANGED: 'RESOURCE.CAPACITY_CHANGED',

  // Referral
  REFERRAL_CREATED: 'REFERRAL.CREATED',
  REFERRAL_SUBMITTED: 'REFERRAL.SUBMITTED',
  REFERRAL_RECEIVED: 'REFERRAL.RECEIVED',
  REFERRAL_ACCEPTED: 'REFERRAL.ACCEPTED',
  REFERRAL_DECLINED: 'REFERRAL.DECLINED',
  REFERRAL_ACTION_TAKEN: 'REFERRAL.ACTION_TAKEN',
  REFERRAL_OUTCOME_CONFIRMED: 'REFERRAL.OUTCOME_CONFIRMED',

  // Continuity / Social Support Passport
  CONTINUITY_ACCESS_GRANTED: 'CONTINUITY.ACCESS_GRANTED',
  CONTINUITY_ACCESS_REVOKED: 'CONTINUITY.ACCESS_REVOKED',

  // AI
  AI_SUGGESTION_GENERATED: 'AI.SUGGESTION_GENERATED',
  AI_SUGGESTION_REJECTED: 'AI.SUGGESTION_REJECTED',

  // Privacy / Retention
  PRIVACY_DATA_EXPIRED: 'PRIVACY.DATA_EXPIRED',
  PRIVACY_DATA_DELETED: 'PRIVACY.DATA_DELETED',
} as const;

export type EventTaxonomyKey = keyof typeof EventTaxonomy;
export type EventTaxonomyType = (typeof EventTaxonomy)[EventTaxonomyKey];

/**
 * Logical Queue names (Architecture V2 Section 12).
 * Each is expected to have a paired dead-letter queue in production,
 * e.g. `ai-jobs` + `ai-jobs-dlq`.
 */
export const QueueName = {
  CASE_EVENTS: 'case-events',
  AI_JOBS: 'ai-jobs',
  RESOURCE_JOBS: 'resource-jobs',
  REFERRAL_EVENTS: 'referral-events',
  NOTIFICATION_JOBS: 'notification-jobs',
  ANALYTICS_EVENTS: 'analytics-events',
  RETENTION_JOBS: 'retention-jobs',
} as const;

export type QueueNameKey = keyof typeof QueueName;
export type QueueNameType = (typeof QueueName)[QueueNameKey];

/**
 * Deterministic routing of an EventTaxonomy event type to its logical Queue.
 * Kept here (not just in the API layer) so both producers (Outbox Dispatcher)
 * and consumers (Workflows) agree on the same mapping without duplicating it.
 */
export function resolveQueueForEventType(eventType: string): QueueNameType {
  const domain = eventType.split('.')[0];
  switch (domain) {
    case 'CASE':
      return QueueName.CASE_EVENTS;
    case 'SAFETY':
      // Safeguarding events ride on the case-events queue: they are always
      // scoped to a case and must stay causally ordered with case facts.
      return QueueName.CASE_EVENTS;
    case 'RESOURCE':
      return QueueName.RESOURCE_JOBS;
    case 'REFERRAL':
      return QueueName.REFERRAL_EVENTS;
    case 'CONTINUITY':
      return QueueName.NOTIFICATION_JOBS;
    case 'AI':
      return QueueName.AI_JOBS;
    case 'PRIVACY':
      return QueueName.RETENTION_JOBS;
    default:
      return QueueName.CASE_EVENTS;
  }
}

