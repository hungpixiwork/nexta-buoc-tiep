import type {
  LoopStage,
  LoopAction,
  RiskGateResult,
  MatchStage,
  NeedCategory,
  ProvenanceSource,
  FollowUpResult,
  LoopMetrics,
  VerificationFreshness,
} from '@buoc-tiep/shared';

export type { LoopStage, LoopAction, RiskGateResult, MatchStage, NeedCategory, ProvenanceSource, FollowUpResult, LoopMetrics, VerificationFreshness };

export type JourneyStage =
  | 'CONSENT'
  | 'UNDERSTAND'
  | 'RISK'
  | 'MATCH'
  | 'NEXT_STEP'
  | 'CONNECTED'
  | 'FOLLOW_UP'
  | 'CLOSED'
  | 'ESCALATED';

export interface Consent {
  verbalConsent: true;
  allowPhoto: boolean;
  allowPhone: boolean;
  allowSharingWithPartner: boolean;
  preferredAddress?: string | null;
  minimumDataOnly: boolean;
  recordedBy?: string;
  recordedAt?: string;
}

export interface LoopCase {
  id: string;
  alias: string;
  preferredAddress: string | null;
  age: number | null;
  isMinor: boolean;
  targetGroup: string | null;
  hasIdentityDoc: boolean | null;
  district: string | null;
  ward: string | null;
  need: NeedCategory | null;
  priorityStatement: string | null;
  observation: string | null;
  keywords: string[];
  strengths: string[];
  constraints: { daytimeOnly?: boolean; weekendOnly?: boolean };
  urgency: 'normal' | 'urgent';
  consent: Consent | null;
  consentGivenAt: string | null;
  riskDecision: RiskGateResult['decision'] | null;
  risk: RiskGateResult | null;
  riskReviewedAt: string | null;
  stage: JourneyStage;
  status: 'OPEN' | 'CLOSED';
  navigatorName: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface CaseListItem extends LoopCase {
  nextStep: { id: string; action: string; dueAt: string; status: string; place: string } | null;
  referral: { id: string; code: string; stage: LoopStage } | null;
  followUp: { id: string; dueAt: string } | null;
}

export interface DirectoryResource {
  id: string;
  name: string;
  organisationName: string;
  serviceName: string;
  category: string;
  description: string | null;
  district: string;
  ward: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  contactMethod: string | null;
  serviceArea: string[];
  availability: { days?: string[]; hours?: string; modes?: Array<'in_person' | 'online'>; slotsTotal?: number; paused?: boolean };
  targetGroup?: string | null;
  partnerOrgId?: string | null;
  acceptsReferral: boolean;
  capacityStatus: 'AVAILABLE' | 'LIMITED' | 'FULL' | 'UNKNOWN';
  slotsAvailable: number | null;
  capacityCheckedAt: string | null;
  verificationStatus: string;
  verifiedAt: string | null;
  verificationExpiresAt: string | null;
  verifiedByName: string | null;
  verificationMethod: string | null;
  verificationSourceUrl: string | null;
  verificationNotes: string | null;
  freshness: VerificationFreshness;
  updatedAt: string;
}

export interface MatchCandidate {
  resource: DirectoryResource;
  score: number;
  freshness: 'VERIFIED' | 'NEEDS_RECHECK';
  locationFit: 'same_district' | 'adjacent' | 'citywide';
  reasons: string[];
  warnings: string[];
  reasonCodes?: Array<{ code: string; value?: string | number }>;
  warningCodes?: Array<{ code: string; value?: string | number }>;
  mustConfirmBeforeReferral: boolean;
}

export interface MatchResult {
  id: string;
  createdAt?: string;
  need: NeedCategory;
  stages: Array<{
    stage: MatchStage;
    inCount: number;
    passedCount: number;
    eliminated: Array<{ resourceId: string; resourceName: string; reason: string; code?: string; value?: string | number }>;
  }>;
  candidates: MatchCandidate[];
}

export interface NextStep {
  id: string;
  caseId: string;
  resourceId: string;
  organisationName: string | null;
  serviceName: string | null;
  phone: string | null;
  address: string | null;
  action: string;
  ownerName: string;
  ownerRole: 'BENEFICIARY' | 'NAVIGATOR' | 'PARTNER';
  place: string;
  dueAt: string;
  verification: VerificationFreshness | 'CONTACT_CONFIRMED';
  verifiedAt: string | null;
  status: 'PROPOSED' | 'CONFIRMED' | 'REACHED' | 'CANCELLED';
  confirmedAt: string | null;
  createdAt: string;
}

export interface ReferralEvent {
  id: string;
  fromStage: LoopStage | null;
  toStage: LoopStage;
  action: string;
  actorName: string | null;
  actorRole: string | null;
  note: string | null;
  createdAt: string;
}

export interface Referral {
  id: string;
  code: string;
  caseId: string;
  nextStepId: string | null;
  resourceId: string | null;
  organisationName: string | null;
  serviceName: string | null;
  stage: LoopStage;
  declineReason: string | null;
  outcomeNote: string | null;
  createdAt: string;
  updatedAt: string;
  availableActions: LoopAction[];
  events?: ReferralEvent[];
}

export interface InboxReferral extends Referral {
  alias: string;
  preferredAddress: string | null;
  need: NeedCategory | null;
  urgency: string;
  action: string | null;
  place: string | null;
  dueAt: string | null;
  ownerName: string | null;
  navigatorName: string | null;
}

export interface FollowUp {
  id: string;
  caseId: string;
  referralId: string | null;
  dueAt: string;
  result: FollowUpResult | null;
  note: string | null;
  completedByName: string | null;
  completedAt: string | null;
  alias?: string;
  need?: NeedCategory | null;
  action?: string | null;
}

export interface Escalation {
  id: string;
  caseId: string;
  kind: 'HUMAN_REVIEW' | 'HOTLINE_111';
  reason: string;
  status: 'OPEN' | 'RESOLVED';
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  alias?: string;
  need?: NeedCategory | null;
}

export interface Fact {
  id: string;
  field: string;
  value: unknown;
  source: ProvenanceSource;
  recordedByName: string | null;
  createdAt: string;
}

export interface Journey {
  case: LoopCase;
  facts: Fact[];
  match: MatchResult | null;
  nextSteps: NextStep[];
  referrals: Referral[];
  followUps: FollowUp[];
  escalations: Escalation[];
}

export interface NoteSuggestion {
  need: NeedCategory | null;
  needCandidates: Array<{ need: NeedCategory; hits: string[] }>;
  district: string | null;
  ward: string | null;
  age: number | null;
  strengths: string[];
  constraints: { daytimeOnly: boolean; weekendOnly: boolean };
  urgency: 'normal' | 'urgent';
  missingQuestions: string[];
  model: string | null;
}
