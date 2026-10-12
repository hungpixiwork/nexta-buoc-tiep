import { Entity } from '../../shared/Entity';
import { Result } from '../../shared/Result';
import { Confidence } from './Confidence';
import { EvidenceProvenance } from './EvidenceProvenance';

export type EvidenceVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface EvidenceItemProps {
  caseId: string;
  journeyId?: string;
  title: string;
  description: string;
  provenance: EvidenceProvenance;
  confidence: Confidence;
  mediaUrl?: string;
  storageKey?: string;
  verificationStatus: EvidenceVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class EvidenceItem extends Entity<EvidenceItemProps> {
  private constructor(props: EvidenceItemProps, id?: string) {
    super(props, id);
  }

  get caseId(): string { return this.props.caseId; }
  get journeyId(): string | undefined { return this.props.journeyId; }
  get title(): string { return this.props.title; }
  get description(): string { return this.props.description; }
  get provenance(): EvidenceProvenance { return this.props.provenance; }
  get confidence(): Confidence { return this.props.confidence; }
  get mediaUrl(): string | undefined { return this.props.mediaUrl; }
  get storageKey(): string | undefined { return this.props.storageKey; }
  get verificationStatus(): EvidenceVerificationStatus { return this.props.verificationStatus; }
  get verifiedBy(): string | undefined { return this.props.verifiedBy; }
  get verifiedAt(): Date | undefined { return this.props.verifiedAt; }
  get rejectionReason(): string | undefined { return this.props.rejectionReason; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  public static create(
    props: Omit<EvidenceItemProps, 'verificationStatus' | 'createdAt' | 'updatedAt'> & {
      verificationStatus?: EvidenceVerificationStatus;
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: string
  ): Result<EvidenceItem> {
    if (!props.caseId || props.caseId.trim() === '') {
      return Result.fail('caseId không được để trống');
    }
    if (!props.title || props.title.trim() === '') {
      return Result.fail('Tiêu đề bằng chứng không được để trống');
    }
    if (!props.provenance) {
      return Result.fail('EvidenceProvenance không được để trống');
    }
    if (!props.confidence) {
      return Result.fail('Confidence không được để trống');
    }

    const now = new Date();
    const item = new EvidenceItem(
      {
        ...props,
        verificationStatus: props.verificationStatus || 'pending',
        createdAt: props.createdAt || now,
        updatedAt: props.updatedAt || now,
      },
      id
    );

    return Result.ok(item);
  }

  public verify(verifierId: string): Result<void> {
    if (!verifierId || verifierId.trim() === '') {
      return Result.fail('verifierId (người xác thực) không được để trống');
    }
    this.props.verificationStatus = 'verified';
    this.props.verifiedBy = verifierId;
    this.props.verifiedAt = new Date();
    this.props.updatedAt = new Date();
    return Result.ok();
  }

  public reject(reason: string, verifierId: string): Result<void> {
    if (!reason || reason.trim() === '') {
      return Result.fail('Lý do từ chối không được để trống');
    }
    this.props.verificationStatus = 'rejected';
    this.props.rejectionReason = reason;
    this.props.verifiedBy = verifierId;
    this.props.verifiedAt = new Date();
    this.props.updatedAt = new Date();
    return Result.ok();
  }

  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      caseId: this.props.caseId,
      journeyId: this.props.journeyId,
      title: this.props.title,
      description: this.props.description,
      provenance: this.props.provenance.toJSON(),
      confidence: this.props.confidence.toJSON(),
      mediaUrl: this.props.mediaUrl,
      storageKey: this.props.storageKey,
      verificationStatus: this.props.verificationStatus,
      verifiedBy: this.props.verifiedBy,
      verifiedAt: this.props.verifiedAt?.toISOString(),
      rejectionReason: this.props.rejectionReason,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
