export type ReferralType =
  | 'CHILD_SAFEGUARDING'
  | 'SOCIAL_ASSISTANCE'
  | 'CIVIC_INCIDENT_1022'
  | 'EMPLOYMENT'
  | 'GENERAL';

export type ReferralStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'RECEIVED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'ACTION_SCHEDULED'
  | 'ACTION_TAKEN'
  | 'OUTCOME_PENDING'
  | 'OUTCOME_CONFIRMED'
  | 'UNRESOLVED'
  | 'CLOSED'
  | 'READY_FOR_REVIEW'
  | 'APPROVED'
  | 'OPENED_EXTERNALLY'
  | 'EXPORTED'
  | 'SUBMITTED_MANUALLY'
  | 'ACKNOWLEDGED'
  | 'REJECTED'
  | 'CANCELLED';


export type ReferralChannelType =
  | 'PHONE'
  | 'WEBSITE'
  | 'EMAIL'
  | 'ZALO'
  | 'PRINT'
  | 'MANUAL_DELIVERY';

export type ReferralVerificationStatus =
  | 'UNVERIFIED'
  | 'VERIFIED'
  | 'EXPIRED'
  | 'DISABLED';

export interface ReferralChannelConfig {
  id: string;
  code: string;
  organizationName: string;
  channelType: ReferralChannelType;

  phone?: string;
  email?: string;
  url?: string;

  jurisdiction?: string;
  verificationStatus: ReferralVerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationSource?: string;

  enabled: boolean;
  metadataJson?: unknown;
}

export interface Referral {
  id: string;
  caseId: string;
  type: ReferralType;
  status: ReferralStatus;

  version: number;
  payloadJson: unknown;
  renderedText?: string;
  templateVersion?: string;

  destinationConfigId?: string;
  createdBy: string;
  approvedBy?: string;

  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  openedExternallyAt?: string;
  submittedAt?: string;

  privacyClassification: string;
  expiresAt?: string;
}

export type ReferralEventType =
  | 'CREATED'
  | 'UPDATED'
  | 'RENDERED'
  | 'VIEWED'
  | 'APPROVED'
  | 'COPIED'
  | 'DOWNLOADED'
  | 'EXTERNAL_CHANNEL_OPENED'
  | 'MARKED_SUBMITTED'
  | 'STATUS_CHANGED'
  | 'REDACTED';

export interface ReferralEvent {
  id: string;
  referralId: string;
  caseId: string;
  eventType: ReferralEventType;
  actorId: string;
  metadataJson?: unknown;
  createdAt: string;
}

export interface CaseConsent {
  id: string;
  caseId: string;
  scope:
    | 'SOCIAL_ASSISTANCE_REFERRAL'
    | 'EMPLOYMENT_REFERRAL'
    | 'HEALTH_REFERRAL'
    | 'DATA_SHARING';
  status: 'GRANTED' | 'DENIED' | 'NOT_REQUIRED' | 'UNKNOWN';
  capturedBy?: string;
  capturedAt?: string;
  evidenceNote?: string;
}

export interface SafeguardingAssessment {
  isPotentialMinor: boolean;
  urgency: 'UNKNOWN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasons: string[];
  employmentBlocked: boolean;
  immediateCallRecommended: boolean;
  requiresHumanReview: boolean;
}

export interface MicroCV {
  candidateCode: string;
  displayName: string;

  preferredRoles: string[];
  skills: string[];
  workExperienceSummary?: string;

  preferredDistricts: string[];
  shiftPreferences: string[];
  earliestStartDate?: string;

  mobility?: string;
  physicalWorkPreference?: string;
  languageCapabilities?: string[];

  contactMode:
    | 'DIRECT'
    | 'THROUGH_CASE_WORKER'
    | 'THROUGH_ORGANIZATION';

  contactValue?: string;
  consentConfirmed: boolean;
}

export interface CivicIncidentDraft {
  category: string;
  title: string;
  description: string;

  observedFacts: string[];
  reportedStatements: string[];

  addressText?: string;
  latitude?: number;
  longitude?: number;

  occurredAt?: string;
  recordedAt: string;

  attachmentIds: string[];
  piiIncluded: boolean;
  redactionWarnings: string[];
}
