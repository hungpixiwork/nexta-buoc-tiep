export type NgoCapacityStatus = 'AVAILABLE' | 'LIMITED' | 'FULL_PAUSED';

export type DeclineReasonEnum =
  | 'CAPACITY_FULL'
  | 'OUT_OF_SCOPE'
  | 'GEOGRAPHY_MISMATCH'
  | 'ELIGIBILITY_UNMET'
  | 'DUPLICATE_OR_INVALID';

export interface CaseRecord {
  id: string;
  organizationId: string;
  beneficiaryId: string;
  assignedTo?: string | null;
  status: 'open' | 'in_progress' | 'referred' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  nextFollowUpAt?: string | null;
  createdAt: string;
  aliasName: string;
  fullName: string;
  birthYear?: number | null;
  isMinor: boolean;
  currentArea: string;
  vulnerabilityGroup: string;
  intakeMode?: 'photo_gps' | 'voice_ai';
  photoUrl?: string;
  audioUrl?: string;
  voiceTranscript?: string;
  gpsCoords?: { lat: number; lng: number };
  needCategories?: ('food' | 'medical' | 'shelter_job' | 'sos111')[];
  note?: string;
}

export interface ResourceRecord {
  id: string;
  name: string;
  category: 'medical' | 'legal' | 'shelter' | 'employment' | 'food' | 'general';
  district: string;
  ward?: string;
  city?: string;
  province?: string;
  address: string;
  phone?: string | null;
  hotline?: string | null;
  email?: string | null;
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  operatingHours?: string | null;
  is24Hours?: boolean;
  is_24_7?: boolean;
  verificationStatus?: 'VERIFIED' | 'PENDING' | 'UNVERIFIED' | 'STALE' | 'INACTIVE' | string;
  isVerified: boolean;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  acceptsReferral?: boolean;
  emergencySupport?: boolean;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  distanceKm?: number;
}

export interface ReferralRecord {
  id: string;
  caseId: string;
  resourceId: string;
  referredBy: string;
  status: 'draft' | 'proposed' | 'approved' | 'sent' | 'accepted' | 'service_reached' | 'declined' | 'closed';
  notes?: string | null;
  outcome?: string | null;
  createdAt: string;
  declineReason?: DeclineReasonEnum;
  declineNote?: string;
}

export interface ImpactSummary {
  totalCases: number;
  activeCases: number;
  totalEncounters: number;
  totalResources: number;
  verifiedResources: number;
  totalReferrals: number;
  successfulReferrals: number;
  safeguardingActions: number;
  updatedAt: string;
}

export interface VolunteerRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'volunteer_field' | 'volunteer_point' | 'coordinator' | 'admin';
  assignedDistricts: string[];
  status: 'pending' | 'active' | 'suspended';
  registrationSource: 'survey_form' | 'direct_invite' | 'portal_signup';
  joinedAt: string;
  totalSurveysSubmitted: number;
  lastActiveAt: string;
}

export interface AuditTrailRecord {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: 'VIEW_CHILD_PROFILE' | 'EXPORT_FORM_07' | 'BATCH_PRINT_QR' | 'VIEW_EXACT_GPS' | 'APPROVE_VOLUNTEER' | 'REASSIGN_DISTRICT' | 'SUSPEND_VOLUNTEER' | 'DECLINE_REFERRAL' | 'UPDATE_NGO_CAPACITY' | 'HOTLINE_111_TRIGGER';
  targetCaseId?: string;
  targetAlias?: string;
  details: string;
  ipAddress: string;
  riskLevel: 'normal' | 'high' | 'critical';
}

export interface Form07Data {
  referralId: string;
  officialDocNo: string;
  caseName: string;
  aliasName: string;
  fullName: string;
  passportId: string;
  age: number | string;
  gender: string;
  currentArea: string;
  vulnerabilityGroup: string;
  emergencyReason: string;
  proposedMeasures: string[];
  resourceName: string;
  address: string;
  isApproved: boolean;
  isMinor: boolean;
  createdAt: string;
  notes: string;
  issuingOfficer: string;
  issuingDept: string;
  redactPII: boolean;
}

