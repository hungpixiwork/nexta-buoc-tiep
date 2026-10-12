import { z } from 'zod';

export const CreateUserSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional(),
  role: z.enum(['beneficiary', 'volunteer', 'social_worker', 'admin']).default('beneficiary'),
});

export const CreatePassportSchema = z.object({
  id: z.string().optional(),
  beneficiaryId: z.string().optional(),
  userId: z.string().optional(),
  ageGroup: z.string().optional(),
  skills: z.array(z.string()).or(z.string()).optional().default([]),
  workPreference: z.string().optional(),
  healthStatus: z.string().optional(),
  location: z.string().optional(),
  status: z.string().optional(),
  stage: z.string().optional(),
});

export const CreateOpportunitySchema = z.object({
  title: z.string().min(3, 'Tiêu đề cơ hội sinh kế không được để trống'),
  organizationName: z.string().min(2, 'Tên đơn vị/tổ chức hỗ trợ'),
  description: z.string().min(10, 'Mô tả chi tiết nội dung công việc/hỗ trợ'),
  category: z.enum(['short_term_job', 'training', 'emergency_aid', 'medical_care']),
  requiredSkills: z.array(z.string()).default([]),
  contactInfo: z.string().min(5, 'Thông tin liên hệ'),
});

export const CreateIncidentSchema = z.object({
  userId: z.string().optional(),
  incidentType: z.enum(['cyberbullying', 'fake_job_scam', 'deepfake', 'misinformation']),
  description: z.string().min(5, 'Mô tả ngắn gọn sự cố hoặc nghi vấn lừa đảo'),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

export const PrivacyGateSchema = z.object({
  noForcedIdentityDisclosure: z.boolean().refine(val => val === true, {
    message: 'KHÔNG 1: Bắt buộc tuân thủ không ép buộc khai báo danh tính pháp lý rủi ro',
  }),
  noPublicSensitiveMedia: z.boolean().refine(val => val === true, {
    message: 'KHÔNG 2: Bắt buộc tuân thủ không công khai hình ảnh, vị trí hay âm thanh nhạy cảm',
  }),
  noUnverifiedInformation: z.boolean().refine(val => val === true, {
    message: 'KHÔNG 3: Bắt buộc tuân thủ không tự ý coi thông tin chưa kiểm chứng hoặc gợi ý AI là sự thật cố định',
  }),
  completedBy: z.string().optional(),
  notes: z.string().optional(),
});

export const CreateReferralSchema = z.object({
  caseId: z.string().min(1, 'Mã hồ sơ ca không được để trống'),
  resourceId: z.string().min(1, 'Mã nguồn lực an sinh không được để trống'),
  notes: z.string().optional(),
  consentBasis: z.string().default('Đã có sự đồng ý tự nguyện của đối tượng'),
  referredBy: z.string().optional(),
  status: z.string().optional(),
});

export const CreateCaseSchema = z.object({
  id: z.string().optional(),
  caseId: z.string().optional(),
  beneficiaryId: z.string().optional(),
  intakeType: z.enum(['photo', 'voice']).optional(),
  clientGeneratedId: z.string().optional(),
  idempotencyKey: z.string().optional(),
  photoUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  imageBase64: z.string().optional(),
  rawTranscript: z.string().optional(),
  transcript: z.string().optional(),
  voiceTranscript: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  currentArea: z.string().optional(),
  current_area: z.string().optional(),
  age: z.union([z.string(), z.number()]).optional(),
  birthYear: z.union([z.string(), z.number()]).optional(),
  isMinor: z.boolean().optional(),
  fullName: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  organizationId: z.string().optional(),
  volunteerId: z.string().optional(),
  category: z.string().optional(),
  vulnerabilityGroup: z.string().optional(),
  gender: z.string().optional(),
  healthState: z.string().optional(),
  weatherCondition: z.string().optional()
});

export const CreateEncounterSchema = z.object({
  id: z.string().optional(),
  clientGeneratedId: z.string().optional(),
  idempotencyKey: z.string().optional(),
  organizationId: z.string().optional(),
  volunteerId: z.string().optional(),
  encounterDate: z.string().optional(),
  transcript: z.string().optional(),
  rawTranscript: z.string().optional(),
  notes: z.string().optional(),
  locationText: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  category: z.string().optional(),
  extractedNeeds: z.union([z.array(z.string()), z.string()]).optional(),
  healthState: z.string().optional(),
  weatherCondition: z.string().optional(),
  journeyId: z.string().optional(),
  voiceRecordingAllowed: z.boolean().optional(),
  anonymityRequested: z.boolean().optional(),
  voiceEncryptionEnabled: z.boolean().optional(),
  storageKey: z.string().optional(),
  durationSeconds: z.union([z.string(), z.number()]).optional(),
  editedTranscript: z.string().optional(),
  milScamDetected: z.boolean().optional(),
  scamRiskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

export const UpdateCaseSchema = z.object({
  status: z.enum(['open', 'in_progress', 'referred', 'closed', 'resolved']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
  description: z.string().optional(),
});

export const CreateFollowupSchema = z.object({
  caseId: z.string().optional(),
  actionType: z.enum(['call', 'visit', 'doc_help', 'medical_check', 'job_trial']).optional(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'missed']).optional(),
  dueDate: z.string().optional(),
  passportId: z.string().optional(),
  socialWorkerId: z.string().optional(),
  assignedTo: z.string().optional(),
});

export const UpdateReferralStatusSchema = z.object({
  status: z.enum([
    'DRAFT',
    'READY_FOR_REVIEW',
    'APPROVED',
    'OPENED_EXTERNALLY',
    'EXPORTED',
    'SUBMITTED_MANUALLY',
    'ACKNOWLEDGED',
    'REJECTED',
    'CANCELLED',
  ]),
  approvedBy: z.string().optional(),
  notes: z.string().optional(),
  outcome: z.string().optional(),
});

export const CreateResourceSchema = z.object({
  name: z.string().min(2, 'Tên nguồn lực không được để trống'),
  category: z.enum(['medical', 'legal', 'shelter', 'employment', 'food', 'general']),
  district: z.string().min(2, 'Quận/Huyện không được để trống'),
  ward: z.string().optional(),
  city: z.string().optional().default('TP. Hồ Chí Minh'),
  province: z.string().optional().default('TP. Hồ Chí Minh'),
  address: z.string().min(5, 'Địa chỉ chi tiết'),
  phone: z.string().optional(),
  hotline: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  operatingHours: z.string().optional(),
  is24Hours: z.boolean().optional().default(false),
  verificationStatus: z.string().optional().default('VERIFIED'),
  isVerified: z.boolean().optional().default(true),
  acceptsReferral: z.boolean().optional().default(true),
  emergencySupport: z.boolean().optional().default(false),
  description: z.string().optional(),
});

export const CreateSurveyResponseSchema = z.object({
  contactName: z.string().min(2, 'Tên người liên hệ không được để trống'),
  contactPhone: z.string().min(8, 'Số điện thoại không hợp lệ'),
  contactEmail: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  contactOrg: z.string().optional(),
  a1Experience: z.string().optional(),
  a2Frequency: z.string().optional(),
  a3OrgType: z.string().optional(),
  a4Role: z.string().optional(),
  a4ToolUsage: z.string().optional(),
  a5StopReasons: z.string().optional(),
  b1AdoptionRate: z.string().optional(),
  b2ChurnFactors: z.string().optional(),
  b3Tradeoff: z.string().optional(),
  b4ExtraTime: z.string().optional(),
  b5RetentionDriver: z.string().optional(),
  b6DataPurpose: z.string().optional(),
  c1Fears: z.string().optional(),
  c2MotivationImpact: z.string().optional(),
  c3AuthenticitySkepticism: z.union([z.number(), z.string()]).optional(),
  c4DoubtAction: z.string().optional(),
  c5VerifyMethod: z.string().optional(),
  c6ReferralWillingness: z.string().optional(),
  d1ChildSafeguardingPriority: z.string().optional(),
  d2LivelihoodPassportBarrier: z.string().optional(),
  d3UiFriction: z.string().optional(),
  d4IntakePreference: z.string().optional(),
  betaOptin: z.string().optional(),
  userFeedback: z.string().optional(),
  isPriorityLead: z.boolean().optional(),
});

export const VerifyAiAnalysisSchema = z.object({
  status: z.enum(['verified', 'rejected', 'adjusted']),
  adjustedNeeds: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const CreateJourneySchema = z.object({
  title: z.string().min(3, 'Tên chuyến đi không được để trống'),
  locationName: z.string().min(2, 'Địa điểm thực địa'),
  scheduledDate: z.string().min(5, 'Ngày dự kiến thực địa'),
  district: z.string().optional(),
  notes: z.string().optional(),
  teamId: z.string().optional(),
  organizationId: z.string().optional(),
});

// --- State Machine Transition Invariants ---

export type DomainCaseStatus = 'open' | 'in_progress' | 'referred' | 'closed' | 'resolved';

const VALID_CASE_TRANSITIONS: Record<DomainCaseStatus, DomainCaseStatus[]> = {
  open: ['in_progress', 'referred', 'closed'],
  in_progress: ['referred', 'closed', 'resolved'],
  referred: ['in_progress', 'closed', 'resolved'],
  closed: ['open'],
  resolved: ['open'],
};

export function isValidCaseStatusTransition(currentStatus: string, nextStatus: string): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_CASE_TRANSITIONS[currentStatus as DomainCaseStatus];
  return allowed ? allowed.includes(nextStatus as DomainCaseStatus) : false;
}

export type DomainReferralStatus =
  | 'DRAFT'
  | 'READY_FOR_REVIEW'
  | 'APPROVED'
  | 'OPENED_EXTERNALLY'
  | 'EXPORTED'
  | 'SUBMITTED_MANUALLY'
  | 'ACKNOWLEDGED'
  | 'REJECTED'
  | 'CANCELLED';

const VALID_REFERRAL_TRANSITIONS: Record<DomainReferralStatus, DomainReferralStatus[]> = {
  DRAFT: ['READY_FOR_REVIEW', 'CANCELLED'],
  READY_FOR_REVIEW: ['APPROVED', 'REJECTED', 'DRAFT', 'CANCELLED'],
  APPROVED: ['OPENED_EXTERNALLY', 'EXPORTED', 'SUBMITTED_MANUALLY', 'CANCELLED'],
  OPENED_EXTERNALLY: ['ACKNOWLEDGED', 'REJECTED'],
  EXPORTED: ['ACKNOWLEDGED', 'REJECTED'],
  SUBMITTED_MANUALLY: ['ACKNOWLEDGED', 'REJECTED'],
  ACKNOWLEDGED: [],
  REJECTED: [],
  CANCELLED: [],
};

export function isValidReferralStatusTransition(currentStatus: string, nextStatus: string): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_REFERRAL_TRANSITIONS[currentStatus as DomainReferralStatus];
  return allowed ? allowed.includes(nextStatus as DomainReferralStatus) : false;
}

export type DomainFollowUpStatus = 'pending' | 'in_progress' | 'completed' | 'missed';

const VALID_FOLLOWUP_TRANSITIONS: Record<DomainFollowUpStatus, DomainFollowUpStatus[]> = {
  pending: ['in_progress', 'completed', 'missed'],
  in_progress: ['completed', 'missed', 'pending'],
  completed: ['pending'],
  missed: ['pending'],
};

export function isValidFollowUpStatusTransition(currentStatus: string, nextStatus: string): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_FOLLOWUP_TRANSITIONS[currentStatus as DomainFollowUpStatus];
  return allowed ? allowed.includes(nextStatus as DomainFollowUpStatus) : false;
}

