import { AggregateRoot } from '../../shared/AggregateRoot';
import { Result } from '../../shared/Result';
import { JourneyStatus, isValidJourneyStatusTransition } from './JourneyStatus';
import { JourneyStage, JourneyStageKey } from './JourneyStage';
import {
  JourneyCreatedEvent,
  JourneyStageTransitionedEvent,
  JourneyStatusChangedEvent,
  JourneyCompletedEvent,
  EvidenceAttachedToJourneyEvent,
} from './events';

export interface SupportJourneyProps {
  caseId: string;
  beneficiaryId: string;
  organizationId: string;
  teamId?: string;
  title: string;
  locationName: string;
  status: JourneyStatus;
  currentStageKey: JourneyStageKey;
  stages: JourneyStage[];
  evidenceIds: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SupportJourney extends AggregateRoot<SupportJourneyProps> {
  private constructor(props: SupportJourneyProps, id?: string) {
    super(props, id);
  }

  get caseId(): string { return this.props.caseId; }
  get beneficiaryId(): string { return this.props.beneficiaryId; }
  get organizationId(): string { return this.props.organizationId; }
  get teamId(): string | undefined { return this.props.teamId; }
  get title(): string { return this.props.title; }
  get locationName(): string { return this.props.locationName; }
  get status(): JourneyStatus { return this.props.status; }
  get currentStageKey(): JourneyStageKey { return this.props.currentStageKey; }
  get stages(): readonly JourneyStage[] { return this.props.stages; }
  get evidenceIds(): readonly string[] { return this.props.evidenceIds; }
  get notes(): string | undefined { return this.props.notes; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  public static create(
    props: Omit<SupportJourneyProps, 'stages' | 'currentStageKey' | 'status' | 'evidenceIds' | 'createdAt' | 'updatedAt'> & {
      stages?: JourneyStage[];
      currentStageKey?: JourneyStageKey;
      status?: JourneyStatus;
      evidenceIds?: string[];
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: string
  ): Result<SupportJourney> {
    if (!props.caseId || props.caseId.trim() === '') {
      return Result.fail('caseId không được để trống');
    }
    if (!props.beneficiaryId || props.beneficiaryId.trim() === '') {
      return Result.fail('beneficiaryId không được để trống');
    }
    if (!props.title || props.title.trim() === '') {
      return Result.fail('Tiêu đề hành trình đồng hành không được để trống');
    }

    const stages = props.stages || JourneyStage.createDefaultStages();
    const activeStage = stages.find((s) => s.status === 'active');
    const currentStageKey = props.currentStageKey || activeStage?.key || 'intake';
    const status = props.status || 'planned';
    const evidenceIds = props.evidenceIds || [];
    const now = new Date();

    const journey = new SupportJourney(
      {
        ...props,
        stages,
        currentStageKey,
        status,
        evidenceIds,
        createdAt: props.createdAt || now,
        updatedAt: props.updatedAt || now,
      },
      id
    );

    if (!id) {
      journey.addDomainEvent(new JourneyCreatedEvent(journey.id, journey.caseId, journey.beneficiaryId, journey.title));
    }

    return Result.ok(journey);
  }

  public advanceStage(targetStageKey: JourneyStageKey, actorId?: string, notes?: string): Result<void> {
    if (this.props.status === 'completed' || this.props.status === 'cancelled') {
      return Result.fail(`Không thể chuyển giai đoạn khi hành trình ở trạng thái ${this.props.status}`);
    }

    const currentStage = this.props.stages.find((s) => s.key === this.props.currentStageKey);
    const targetStage = this.props.stages.find((s) => s.key === targetStageKey);

    if (!targetStage) {
      return Result.fail(`Giai đoạn ${targetStageKey} không tồn tại trong danh sách`);
    }

    if (currentStage) {
      currentStage.complete(notes);
    }

    const prevStageKey = this.props.currentStageKey;
    this.props.currentStageKey = targetStageKey;
    targetStage.activate(notes);
    this.props.updatedAt = new Date();

    if (this.props.status === 'planned') {
      this.props.status = 'in_progress';
    }

    this.addDomainEvent(
      new JourneyStageTransitionedEvent(this.id, prevStageKey, targetStageKey, actorId)
    );

    return Result.ok();
  }

  public updateStatus(newStatus: JourneyStatus, reason?: string): Result<void> {
    if (!isValidJourneyStatusTransition(this.props.status, newStatus)) {
      return Result.fail(`Chuyển đổi trạng thái từ ${this.props.status} sang ${newStatus} không hợp lệ`);
    }

    const prevStatus = this.props.status;
    this.props.status = newStatus;
    this.props.updatedAt = new Date();

    this.addDomainEvent(new JourneyStatusChangedEvent(this.id, prevStatus, newStatus, reason));

    if (newStatus === 'completed') {
      const currentStage = this.props.stages.find((s) => s.key === this.props.currentStageKey);
      if (currentStage) currentStage.complete('Hoàn tất hành trình đồng hành tự chủ');
      this.addDomainEvent(new JourneyCompletedEvent(this.id, this.caseId, this.beneficiaryId, new Date()));
    }

    return Result.ok();
  }

  public attachEvidence(evidenceId: string): Result<void> {
    if (!evidenceId || evidenceId.trim() === '') {
      return Result.fail('evidenceId không hợp lệ');
    }
    if (this.props.evidenceIds.includes(evidenceId)) {
      return Result.ok();
    }
    this.props.evidenceIds.push(evidenceId);
    this.props.updatedAt = new Date();
    this.addDomainEvent(new EvidenceAttachedToJourneyEvent(this.id, evidenceId, this.caseId));
    return Result.ok();
  }

  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      caseId: this.props.caseId,
      beneficiaryId: this.props.beneficiaryId,
      organizationId: this.props.organizationId,
      teamId: this.props.teamId,
      title: this.props.title,
      locationName: this.props.locationName,
      status: this.props.status,
      currentStageKey: this.props.currentStageKey,
      stages: this.props.stages.map((s) => s.toJSON()),
      evidenceIds: [...this.props.evidenceIds],
      notes: this.props.notes,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
