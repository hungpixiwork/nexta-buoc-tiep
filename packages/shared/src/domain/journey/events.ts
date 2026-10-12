import { DomainEvent } from '../../shared/DomainEvent';
import { JourneyStageKey } from './JourneyStage';
import { JourneyStatus } from './JourneyStatus';

export class JourneyCreatedEvent extends DomainEvent {
  public readonly eventName = 'journey.created';
  constructor(
    aggregateId: string,
    public readonly caseId: string,
    public readonly beneficiaryId: string,
    public readonly title: string
  ) {
    super(aggregateId);
  }
}

export class JourneyStageTransitionedEvent extends DomainEvent {
  public readonly eventName = 'journey.stage_transitioned';
  constructor(
    aggregateId: string,
    public readonly previousStage: JourneyStageKey,
    public readonly newStage: JourneyStageKey,
    public readonly actorId?: string
  ) {
    super(aggregateId);
  }
}

export class JourneyStatusChangedEvent extends DomainEvent {
  public readonly eventName = 'journey.status_changed';
  constructor(
    aggregateId: string,
    public readonly previousStatus: JourneyStatus,
    public readonly newStatus: JourneyStatus,
    public readonly reason?: string
  ) {
    super(aggregateId);
  }
}

export class JourneyCompletedEvent extends DomainEvent {
  public readonly eventName = 'journey.completed';
  constructor(
    aggregateId: string,
    public readonly caseId: string,
    public readonly beneficiaryId: string,
    public readonly completedAt: Date
  ) {
    super(aggregateId);
  }
}

export class EvidenceAttachedToJourneyEvent extends DomainEvent {
  public readonly eventName = 'journey.evidence_attached';
  constructor(
    aggregateId: string,
    public readonly evidenceId: string,
    public readonly caseId: string
  ) {
    super(aggregateId);
  }
}
