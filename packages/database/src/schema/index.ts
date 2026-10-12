import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ==========================================
// 1. IDENTITY & ACCESS MANAGEMENT (IAM / RBAC)
// ==========================================

export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const teams = sqliteTable('teams', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  name: text('name').notNull(),
  district: text('district'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  orgIdx: index('teams_org_idx').on(table.organizationId),
}));

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id),
  fullName: text('full_name').notNull(),
  phone: text('phone').unique(),
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  role: text('role', { enum: ['beneficiary', 'volunteer', 'social_worker', 'admin', 'coordinator', 'safeguarding_reviewer', 'partner'] }).notNull().default('volunteer'),
  avatarUrl: text('avatar_url'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  orgIdx: index('users_org_idx').on(table.organizationId),
  roleIdx: index('users_role_idx').on(table.role),
}));

export const roles = sqliteTable('roles', {
  id: text('id').primaryKey(),
  code: text('code', { enum: ['BENEFICIARY', 'NAVIGATOR', 'COORDINATOR', 'PARTNER_STAFF', 'SAFEGUARD_OFFICER', 'SYS_ADMIN'] }).notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
});

export const permissions = sqliteTable('permissions', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g. 'case:read', 'case:write', 'pii:read', 'referral:approve'
  name: text('name').notNull(),
  module: text('module').notNull(), // 'cases', 'safeguarding', 'resources', 'referrals', 'analytics'
  description: text('description'),
});

export const userRoles = sqliteTable('user_roles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  roleId: text('role_id').notNull().references(() => roles.id),
  assignedAt: text('assigned_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdx: index('user_roles_user_idx').on(table.userId),
  roleIdx: index('user_roles_role_idx').on(table.roleId),
}));

export const rolePermissions = sqliteTable('role_permissions', {
  id: text('id').primaryKey(),
  roleId: text('role_id').notNull().references(() => roles.id),
  permissionId: text('permission_id').notNull().references(() => permissions.id),
}, (table) => ({
  roleIdx: index('role_permissions_role_idx').on(table.roleId),
  permIdx: index('role_permissions_perm_idx').on(table.permissionId),
}));

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdx: index('sessions_user_idx').on(table.userId),
  expiresIdx: index('sessions_expires_idx').on(table.expiresAt),
}));

export const memberships = sqliteTable('memberships', {
  id: text('id').primaryKey(),
  teamId: text('team_id').notNull().references(() => teams.id),
  userId: text('user_id').notNull().references(() => users.id),
  roleInTeam: text('role_in_team').default('member'),
  joinedAt: text('joined_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  teamIdx: index('memberships_team_idx').on(table.teamId),
  userIdx: index('memberships_user_idx').on(table.userId),
}));

// ==========================================
// 2. PILOT & CONFIGURATION DOMAIN
// ==========================================

export const pilots = sqliteTable('pilots', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  targetCases: integer('target_cases').default(100),
  startDate: text('start_date'),
  endDate: text('end_date'),
  isDemo: integer('is_demo', { mode: 'boolean' }).default(false),
  status: text('status', { enum: ['PLANNED', 'ACTIVE', 'COMPLETED'] }).default('PLANNED'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const pilotMembers = sqliteTable('pilot_members', {
  id: text('id').primaryKey(),
  pilotId: text('pilot_id').notNull().references(() => pilots.id),
  userId: text('user_id').notNull().references(() => users.id),
  roleInPilot: text('role_in_pilot').default('NAVIGATOR'),
}, (table) => ({
  pilotIdx: index('pilot_members_pilot_idx').on(table.pilotId),
  userIdx: index('pilot_members_user_idx').on(table.userId),
}));

export const pilotConfiguration = sqliteTable('pilot_configuration', {
  id: text('id').primaryKey(),
  pilotId: text('pilot_id').notNull().references(() => pilots.id),
  configKey: text('config_key').notNull(),
  configValue: text('config_value').notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  pilotKeyIdx: index('pilot_config_pilot_key_idx').on(table.pilotId, table.configKey),
}));

// ==========================================
// 3. NAVIGATOR PROFILE & TRAINING
// ==========================================

export const navigators = sqliteTable('navigators', {
  userId: text('user_id').primaryKey().references(() => users.id),
  districtAssigned: text('district_assigned'),
  activeCasesCount: integer('active_cases_count').default(0),
  ratingScore: integer('rating_score').default(100),
  status: text('status', { enum: ['active', 'inactive', 'on_leave'] }).default('active'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const navigatorProfiles = navigators;

export const navigatorTraining = sqliteTable('navigator_training', {
  id: text('id').primaryKey(),
  navigatorId: text('navigator_id').notNull().references(() => users.id),
  moduleCode: text('module_code').notNull(), // 'SAFEGUARDING_101', '3_KHONG_CONSENT', 'DE_ESCALATION'
  completedAt: text('completed_at').default(sql`CURRENT_TIMESTAMP`),
  score: integer('score').default(100),
  certifiedBy: text('certified_by').references(() => users.id),
}, (table) => ({
  navModuleIdx: index('nav_training_nav_mod_idx').on(table.navigatorId, table.moduleCode),
}));

// ==========================================
// 4. BENEFICIARY & PRIVATE DATA DOMAIN
// ==========================================

export const beneficiaries = sqliteTable('beneficiaries', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  aliasName: text('alias_name').notNull(), // Pseudonymous identity (e.g. "Lan 22t Hóc Môn")
  fullName: text('full_name'), // Encrypted or null for minor safeguarding
  birthYear: integer('birth_year'),
  isMinor: integer('is_minor', { mode: 'boolean' }).default(false), // Child Safeguarding Invariant (<18t)
  gender: text('gender'),
  currentArea: text('current_area'),
  vulnerabilityGroup: text('vulnerability_group'), // 'street_worker', 'elderly', 'youth', 'homeless'
  isSensitive: integer('is_sensitive', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  orgIdx: index('beneficiaries_org_idx').on(table.organizationId),
  isMinorIdx: index('beneficiaries_minor_idx').on(table.isMinor),
}));

export const beneficiaryPrivateData = sqliteTable('beneficiary_private_data', {
  id: text('id').primaryKey(),
  beneficiaryId: text('beneficiary_id').notNull().references(() => beneficiaries.id),
  encryptedPiiPayload: text('encrypted_pii_payload').notNull(), // AES-GCM-256 encrypted phone, cccd, real name
  keyFingerprint: text('key_fingerprint').notNull(),
  accessCount: integer('access_count').default(0),
  lastAccessedAt: text('last_accessed_at'),
  lastAccessedBy: text('last_accessed_by').references(() => users.id),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  beneficiaryIdx: index('beneficiary_private_data_ben_idx').on(table.beneficiaryId),
}));

// ==========================================
// 5. CASE AGGREGATE DOMAIN
// ==========================================

export const cases = sqliteTable('cases', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  pilotId: text('pilot_id').references(() => pilots.id),
  teamId: text('team_id').references(() => teams.id),
  beneficiaryId: text('beneficiary_id').notNull().references(() => beneficiaries.id),
  assignedTo: text('assigned_to').references(() => users.id),
  currentOwnerId: text('current_owner_id').references(() => users.id),
  status: text('status', {
    enum: [
      'open', 'in_progress', 'referred', 'closed', // Legacy compatible
      'DRAFT', 'INTAKE_CAPTURED', 'CONSENT_CONFIRMED', 'CONTEXT_CAPTURED',
      'SAFETY_CLEARED', 'VERIFICATION_REQUIRED', 'VERIFIED', 'SNS_PROPOSED',
      'SNS_CONFIRMED', 'REFERRAL_ACTIVE', 'FOLLOW_UP_DUE', 'OUTCOME_RECORDED',
      'CLOSED', 'ESCALATED', 'BLOCKED', 'CANCELLED', 'NEEDS_RECHECK'
    ]
  }).default('open'),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] }).default('medium'),
  riskLevel: text('risk_level', { enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] }).default('LOW'),
  nextFollowUpAt: text('next_follow_up_at'),
  threeKhongCheck: text('three_khong_check'),
  privacyGateCompletedAt: text('privacy_gate_completed_at'),
  signedQrToken: text('signed_qr_token'),
  qrExpiresAt: text('qr_expires_at'),
  qrRevokedAt: text('qr_revoked_at'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  closedAt: text('closed_at'),
}, (table) => ({
  orgIdx: index('cases_org_idx').on(table.organizationId),
  orgStatusIdx: index('cases_org_status_idx').on(table.organizationId, table.status),
  teamIdx: index('cases_team_idx').on(table.teamId),
  beneficiaryIdx: index('cases_beneficiary_idx').on(table.beneficiaryId),
  assignedIdx: index('cases_assigned_idx').on(table.assignedTo),
  statusIdx: index('cases_status_idx').on(table.status),
  ownerStatusIdx: index('cases_owner_status_idx').on(table.currentOwnerId, table.status),
  pilotCreatedIdx: index('cases_pilot_created_idx').on(table.pilotId, table.createdAt),
  followUpIdx: index('cases_followup_idx').on(table.nextFollowUpAt),
  idxCasesNavigator: index('idx_cases_navigator').on(table.assignedTo, table.status, table.priority),
}));

export const caseAssignments = sqliteTable('case_assignments', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id),
  assignedBy: text('assigned_by').references(() => users.id),
  assignedTo: text('assigned_to').notNull().references(() => users.id),
  reason: text('reason'),
  active: integer('active', { mode: 'boolean' }).default(true),
  assignedAt: text('assigned_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  caseIdx: index('case_assignments_case_idx').on(table.caseId),
  assignedToIdx: index('case_assignments_assigned_to_idx').on(table.assignedTo),
  userActiveIdx: index('case_assignments_user_active_idx').on(table.assignedTo, table.active),
}));

export const timelineEvents = sqliteTable('timeline_events', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id),
  actorId: text('actor_id').references(() => users.id),
  eventType: text('event_type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  metadataJson: text('metadata_json'),
  eventDate: text('event_date').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  caseDateIdx: index('timeline_case_date_idx').on(table.caseId, table.eventDate),
}));

export const caseEvents = timelineEvents;

// ==========================================
// 6. CONSENT DOMAIN
// ==========================================

export const consents = sqliteTable('consents', {
  id: text('id').primaryKey(),
  encounterId: text('encounter_id').references(() => encounters.id),
  caseId: text('case_id').references(() => cases.id),
  beneficiaryId: text('beneficiary_id').notNull().references(() => beneficiaries.id),
  version: integer('version').default(1),
  scope: text('scope').default('GENERAL_SUPPORT'),
  granted: integer('granted', { mode: 'boolean' }).default(true),
  voiceRecordingAllowed: integer('voice_recording_allowed', { mode: 'boolean' }).default(true),
  anonymityRequested: integer('anonymity_requested', { mode: 'boolean' }).default(true),
  voiceEncryptionEnabled: integer('voice_encryption_enabled', { mode: 'boolean' }).default(true),
  capturedBy: text('captured_by').references(() => users.id),
  capturedAt: text('captured_at').default(sql`CURRENT_TIMESTAMP`),
  agreedAt: text('agreed_at').default(sql`CURRENT_TIMESTAMP`),
  withdrawnAt: text('withdrawn_at'),
}, (table) => ({
  encounterIdx: index('consents_encounter_idx').on(table.encounterId),
  beneficiaryIdx: index('consents_beneficiary_idx').on(table.beneficiaryId),
  caseIdx: index('consents_case_idx').on(table.caseId),
}));

export const caseConsents = sqliteTable('case_consents', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id),
  scope: text('scope', { enum: ['SOCIAL_ASSISTANCE_REFERRAL', 'EMPLOYMENT_REFERRAL', 'HEALTH_REFERRAL', 'DATA_SHARING'] }).notNull(),
  status: text('status', { enum: ['GRANTED', 'DENIED', 'NOT_REQUIRED', 'UNKNOWN'] }).default('UNKNOWN'),
  capturedBy: text('captured_by').references(() => users.id),
  capturedAt: text('captured_at').default(sql`CURRENT_TIMESTAMP`),
  evidenceNote: text('evidence_note'),
}, (table) => ({
  caseScopeIdx: index('case_consents_case_scope_idx').on(table.caseId, table.scope),
}));

export const consentEvents = sqliteTable('consent_events', {
  id: text('id').primaryKey(),
  consentId: text('consent_id').notNull().references(() => consents.id),
  caseId: text('case_id').references(() => cases.id),
  eventType: text('event_type', { enum: ['GRANTED', 'WITHDRAWN', 'UPDATED', 'VIEWED'] }).notNull(),
  actorId: text('actor_id').notNull().references(() => users.id),
  details: text('details'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  consentIdx: index('consent_events_consent_idx').on(table.consentId),
  caseIdx: index('consent_events_case_idx').on(table.caseId),
}));

// ==========================================
// 7. INTAKE DOMAIN
// ==========================================

export const encounters = sqliteTable('encounters', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id),
  journeyId: text('journey_id').references(() => journeys.id),
  volunteerId: text('volunteer_id').notNull().references(() => users.id),
  encounterDate: text('encounter_date').default(sql`CURRENT_TIMESTAMP`),
  locationText: text('location_text'),
  summary: text('summary'),
  healthState: text('health_state'),
  weatherCondition: text('weather_condition'),
  clientGeneratedId: text('client_generated_id'),
  syncStatus: text('sync_status', { enum: ['synced', 'pending', 'conflict'] }).default('synced'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  caseIdx: index('encounters_case_idx').on(table.caseId),
  caseDateIdx: index('encounters_case_date_idx').on(table.caseId, table.encounterDate),
  journeyIdx: index('encounters_journey_idx').on(table.journeyId),
  volunteerIdx: index('encounters_volunteer_idx').on(table.volunteerId),
}));

export const intakes = encounters; // Canonical alias

export const intakeEntries = sqliteTable('intake_entries', {
  id: text('id').primaryKey(),
  intakeId: text('intake_id').notNull().references(() => encounters.id),
  modality: text('modality', { enum: ['NOTE', 'KEYWORD', 'VOICE', 'PHOTO'] }).notNull(),
  rawContent: text('raw_content'),
  extractedJson: text('extracted_json'),
  capturedAt: text('captured_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  intakeIdx: index('intake_entries_intake_idx').on(table.intakeId),
}));

export const voiceNotes = sqliteTable('voice_notes', {
  id: text('id').primaryKey(),
  encounterId: text('encounter_id').notNull().references(() => encounters.id),
  storageKey: text('storage_key').notNull(),
  durationSeconds: integer('duration_seconds'),
  rawTranscript: text('raw_transcript'),
  editedTranscript: text('edited_transcript'),
  sttStatus: text('stt_status', { enum: ['pending', 'processing', 'completed', 'failed'] }).default('pending'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  encounterIdx: index('voice_notes_encounter_idx').on(table.encounterId),
}));

export const mediaAssets = sqliteTable('media_assets', {
  id: text('id').primaryKey(),
  caseId: text('case_id').references(() => cases.id),
  intakeId: text('intake_id').references(() => encounters.id),
  mediaType: text('media_type', { enum: ['VOICE_AUDIO', 'PHOTO_SITE', 'DOCUMENT_IMAGE'] }).notNull(),
  storageKey: text('storage_key').notNull(),
  blurApplied: integer('blur_applied', { mode: 'boolean' }).default(true), // Face/location blur for privacy
  retentionDays: integer('retention_days').default(30),
  expiresAt: text('expires_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  caseIdx: index('media_assets_case_idx').on(table.caseId),
}));

// ==========================================
// 8. FACT & PROVENANCE DOMAIN
// ==========================================

export const caseFacts = sqliteTable('case_facts', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id),
  factType: text('fact_type').notNull(), // 'NEEDS', 'STRENGTHS', 'LOCATION', 'HEALTH', 'AGE', 'PRIORITY'
  value: text('value').notNull(),
  sourceType: text('source_type', {
    enum: [
      'BENEFICIARY_STATED',
      'NAVIGATOR_OBSERVED',
      'AI_SUGGESTED',
      'HUMAN_VERIFIED',
      'VERIFIED_EXTERNAL_SOURCE',
      'DOCUMENT_EXTRACTED',
      'PARTNER_CONFIRMED',
      'OUTCOME_CONFIRMED'
    ]
  }).notNull(),
  verificationStatus: text('verification_status', { enum: ['UNVERIFIED', 'VERIFIED', 'REJECTED', 'DISPUTED'] }).default('UNVERIFIED'),
  confidence: integer('confidence').default(100),
  createdBy: text('created_by').references(() => users.id),
  verifiedBy: text('verified_by').references(() => users.id),
  verifiedAt: text('verified_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  caseIdx: index('case_facts_case_idx').on(table.caseId),
  factTypeIdx: index('case_facts_type_idx').on(table.factType),
  verStatusIdx: index('case_facts_ver_status_idx').on(table.verificationStatus),
}));

export const caseProvenance = caseFacts; // Canonical alias with backward compat
export const provenanceRecords = caseFacts;

export const aiAnalyses = sqliteTable('ai_analyses', {
  id: text('id').primaryKey(),
  voiceNoteId: text('voice_note_id').references(() => voiceNotes.id),
  extractedNeeds: text('extracted_needs'),
  milScamDetected: integer('mil_scam_detected', { mode: 'boolean' }).default(false),
  scamRiskLevel: text('scam_risk_level', { enum: ['low', 'medium', 'high', 'critical'] }).default('low'),
  confidenceScore: integer('confidence_score'),
  rawInput: text('raw_input'),
  aiGeneratedValue: text('ai_generated_value'),
  verificationStatus: text('verification_status', { enum: ['pending', 'verified', 'rejected', 'adjusted'] }).default('pending'),
  verifiedBy: text('verified_by').references(() => users.id),
  verifiedAt: text('verified_at'),
  sourceType: text('source_type', { enum: ['gemini-flash', 'gemini-pro', 'cloudflare-ai', 'mock', 'rule-engine'] }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  voiceNoteIdx: index('ai_analyses_voice_note_idx').on(table.voiceNoteId),
}));

export const needs = sqliteTable('needs', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id),
  category: text('category', { enum: ['health', 'legal_doc', 'shelter', 'job', 'training', 'emergency_food'] }).notNull(),
  title: text('title').notNull(),
  priority: text('priority', { enum: ['high', 'medium', 'low'] }).default('medium'),
  status: text('status', { enum: ['identified', 'in_progress', 'resolved'] }).default('identified'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  caseIdx: index('needs_case_idx').on(table.caseId),
}));

// ==========================================
// 9. SAFEGUARDING & RISK DOMAIN
// ==========================================

export const safeguardingAssessments = sqliteTable('safeguarding_assessments', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id),
  beneficiaryIsChild: integer('beneficiary_is_child', { mode: 'boolean' }).notNull().default(false),
  riskLevel: text('risk_level', { enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] }).notNull().default('LOW'),
  decision: text('decision', {
    enum: [
      'PROCEED',
      'PROCEED_WITH_CAUTION',
      'MORE_INFORMATION_REQUIRED',
      'HUMAN_REVIEW_REQUIRED',
      'MANDATORY_ESCALATION',
      'DO_NOT_APPROACH'
    ]
  }).notNull().default('PROCEED'),
  reviewerId: text('reviewerId').references(() => users.id),
  reviewedAt: text('reviewed_at'),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  caseIdx: index('sg_assessments_case_idx').on(table.caseId),
  riskIdx: index('sg_assessments_risk_idx').on(table.riskLevel),
}));

export const safeguardingFlags = sqliteTable('safeguarding_flags', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id),
  reportedBy: text('reported_by').notNull().references(() => users.id),
  reason: text('reason').notNull(),
  severity: text('severity', { enum: ['low', 'medium', 'high', 'critical', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] }).default('high'),
  status: text('status', { enum: ['open', 'under_review', 'escalated', 'resolved'] }).default('open'),
  escalatedTo111: integer('escalated_to_111', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  caseIdx: index('safeguarding_case_idx').on(table.caseId),
  caseSevIdx: index('safeguarding_case_sev_idx').on(table.caseId, table.severity),
}));

export const escalations = sqliteTable('escalations', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id),
  reason: text('reason').notNull(),
  level: text('level', { enum: ['INTERNAL_REVIEW', 'SUPERVISOR', 'HOTLINE_111', 'AUTHORITY_1022'] }).notNull(),
  status: text('status', { enum: ['PENDING', 'ACCEPTED', 'INVESTIGATING', 'RESOLVED', 'CLOSED'] }).default('PENDING'),
  escalatedBy: text('escalated_by').notNull().references(() => users.id),
  resolvedBy: text('resolved_by').references(() => users.id),
  resolvedAt: text('resolved_at'),
  actionTakenSummary: text('action_taken_summary'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  caseIdx: index('escalations_case_idx').on(table.caseId),
  statusIdx: index('escalations_status_idx').on(table.status),
}));

// ==========================================
// 10. RESOURCE & VERIFICATION DOMAIN
// ==========================================

export const resources = sqliteTable('resources', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id),
  name: text('name').notNull(),
  category: text('category', { enum: ['medical', 'legal', 'shelter', 'employment', 'food', 'general', 'HEALTH', 'LEGAL', 'SHELTER', 'EMPLOYMENT', 'FOOD', 'TRAINING', 'EMERGENCY_AID'] }).notNull(),
  district: text('district').notNull(),
  ward: text('ward'),
  city: text('city').default('TP. Hồ Chí Minh'),
  province: text('province').default('TP. Hồ Chí Minh'),
  address: text('address').notNull(),
  phone: text('phone'),
  hotline: text('hotline'),
  email: text('email'),
  website: text('website'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  operatingHours: text('operating_hours'),
  is24Hours: integer('is_24_hours', { mode: 'boolean' }).default(false),
  verificationStatus: text('verification_status', { enum: ['VERIFIED', 'NEEDS_RECHECK', 'UNCONFIRMED', 'STALE', 'UNAVAILABLE', 'PENDING', 'UNVERIFIED', 'INACTIVE'] }).default('VERIFIED'),
  verifiedBy: text('verified_by').references(() => users.id),
  verifiedAt: text('verified_at'),
  verificationExpiresAt: text('verification_expires_at'),
  capacityStatus: text('capacity_status', { enum: ['AVAILABLE', 'LIMITED', 'FULL', 'UNKNOWN'] }).default('AVAILABLE'),
  capacityCheckedAt: text('capacity_checked_at'),
  isVerified: integer('is_verified', { mode: 'boolean' }).default(true),
  acceptsReferral: integer('accepts_referral', { mode: 'boolean' }).default(true),
  emergencySupport: integer('emergency_support', { mode: 'boolean' }).default(false),
  description: text('description'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  districtCategoryIdx: index('resources_dist_cat_idx').on(table.district, table.category),
  verStatusIdx: index('resources_ver_status_idx').on(table.verificationStatus),
  verExpiresIdx: index('resources_ver_expires_idx').on(table.verificationExpiresAt),
  idxVerifiedResourcesMatching: index('idx_verified_resources_matching').on(table.district, table.category, table.isVerified),
}));

export const verifiedResources = resources;

export const resourceVerifications = sqliteTable('resource_verifications', {
  id: text('id').primaryKey(),
  resourceId: text('resource_id').notNull().references(() => resources.id),
  verifiedBy: text('verified_by').notNull().references(() => users.id),
  method: text('method', { enum: ['PHONE_CALL', 'SITE_VISIT', 'OFFICIAL_DOCUMENT', 'PARTNER_PORTAL'] }).notNull(),
  statusBefore: text('status_before'),
  statusAfter: text('status_after').notNull(),
  notes: text('notes'),
  verifiedAt: text('verified_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  resourceIdx: index('res_verifications_res_idx').on(table.resourceId),
}));

export const resourceCapacityChecks = sqliteTable('resource_capacity_checks', {
  id: text('id').primaryKey(),
  resourceId: text('resource_id').notNull().references(() => resources.id),
  capacityStatus: text('capacity_status', { enum: ['AVAILABLE', 'LIMITED', 'FULL', 'UNKNOWN'] }).notNull(),
  checkedBy: text('checked_by').references(() => users.id),
  checkedAt: text('checked_at').default(sql`CURRENT_TIMESTAMP`),
  slotsAvailable: integer('slots_available'),
  notes: text('notes'),
}, (table) => ({
  resCheckedIdx: index('res_capacity_res_chk_idx').on(table.resourceId, table.checkedAt),
}));

// ==========================================
// 11. MATCHING & SAFE NEXT STEP DOMAIN
// ==========================================

export const matches = sqliteTable('matches', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id),
  resourceId: text('resource_id').notNull().references(() => resources.id),
  matchScore: integer('match_score').notNull(), // 0-100
  hardConstraintsPassed: integer('hard_constraints_passed', { mode: 'boolean' }).default(true),
  explanationJson: text('explanation_json'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  caseIdx: index('matches_case_idx').on(table.caseId),
  resourceIdx: index('matches_resource_idx').on(table.resourceId),
}));

export const safeNextSteps = sqliteTable('safe_next_steps', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id),
  resourceId: text('resource_id').references(() => resources.id),
  title: text('title').notNull(),
  action: text('action'), // Concrete 5W1H single action
  owner: text('owner'), // Beneficiary or Navigator
  channelOrLocation: text('channel_or_location'),
  dueAt: text('due_at'),
  verificationStatus: text('verification_status').default('VERIFIED'),
  proposedBy: text('proposed_by').references(() => users.id),
  confirmedBy: text('confirmed_by').references(() => users.id),
  confirmedAt: text('confirmed_at'),
  status: text('status', { enum: ['PROPOSED', 'CONFIRMED', 'CANCELLED', 'REACHED'] }).default('PROPOSED'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  caseIdx: index('sns_case_idx').on(table.caseId),
}));

export const safeNextStepEvents = sqliteTable('safe_next_step_events', {
  id: text('id').primaryKey(),
  safeNextStepId: text('safe_next_step_id').notNull().references(() => safeNextSteps.id),
  caseId: text('case_id').notNull().references(() => cases.id),
  eventType: text('event_type', { enum: ['PROPOSED', 'CONFIRMED', 'CANCELLED', 'REACHED'] }).notNull(),
  actorId: text('actor_id').notNull().references(() => users.id),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  snsIdx: index('sns_events_sns_idx').on(table.safeNextStepId),
  caseIdx: index('sns_events_case_idx').on(table.caseId),
}));

// ==========================================
// 12. REFERRAL & PARTNER SNAPSHOT DOMAIN
// ==========================================

export const referrals = sqliteTable('referrals', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id),
  resourceId: text('resource_id').references(() => resources.id),
  partnerId: text('partner_id').references(() => organizations.id),
  referredBy: text('referred_by').notNull().references(() => users.id),
  type: text('type', { enum: ['CHILD_SAFEGUARDING', 'SOCIAL_ASSISTANCE', 'CIVIC_INCIDENT_1022', 'EMPLOYMENT', 'GENERAL'] }).notNull().default('GENERAL'),
  status: text('status', {
    enum: [
      'CREATED', 'SENT', 'RECEIVED', 'ACCEPTED', 'DECLINED', 'ACTION_TAKEN', 'OUTCOME_PENDING', 'CLOSED',
      'DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'OPENED_EXTERNALLY', 'EXPORTED', 'SUBMITTED_MANUALLY',
      'ACKNOWLEDGED', 'REJECTED', 'CANCELLED', 'draft', 'proposed', 'approved', 'sent', 'accepted', 'service_reached', 'declined', 'closed'
    ]
  }).default('CREATED'),
  version: integer('version').default(1),
  payloadJson: text('payload_json'),
  renderedText: text('rendered_text'),
  templateVersion: text('template_version'),
  destinationConfigId: text('destination_config_id'),
  approvedBy: text('approved_by').references(() => users.id),
  approvedAt: text('approved_at'),
  openedExternallyAt: text('opened_externally_at'),
  submittedAt: text('submitted_at'),
  acceptedAt: text('accepted_at'),
  declinedAt: text('declined_at'),
  declineReason: text('decline_reason'),
  actionTakenAt: text('action_taken_at'),
  privacyClassification: text('privacy_classification').default('RESTRICTED'),
  expiresAt: text('expires_at'),
  notes: text('notes'),
  outcome: text('outcome'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  caseIdx: index('referrals_case_idx').on(table.caseId),
  resourceIdx: index('referrals_resource_idx').on(table.resourceId),
  partnerStatusIdx: index('referrals_partner_status_idx').on(table.partnerId, table.status),
  referredByIdx: index('referrals_referred_by_idx').on(table.referredBy),
  statusIdx: index('referrals_status_idx').on(table.status),
  typeIdx: index('referrals_type_idx').on(table.type),
  idxReferralsClosedLoop: index('idx_referrals_closed_loop').on(table.caseId, table.status, table.type),
}));

export const referralPartnerSnapshots = sqliteTable('referral_partner_snapshots', {
  id: text('id').primaryKey(),
  referralId: text('referral_id').notNull().references(() => referrals.id),
  organizationName: text('organization_name').notNull(),
  resourceName: text('resource_name').notNull(),
  verificationStatusAtReferral: text('verification_status_at_referral').notNull(),
  contactPhone: text('contact_phone'),
  eligibilitySnapshotJson: text('eligibility_snapshot_json'),
  capacitySnapshot: text('capacity_snapshot'),
  capturedAt: text('captured_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  referralIdx: index('ref_snapshots_ref_idx').on(table.referralId),
}));

export const referralEvents = sqliteTable('referral_events', {
  id: text('id').primaryKey(),
  referralId: text('referral_id').notNull().references(() => referrals.id),
  caseId: text('case_id').notNull().references(() => cases.id),
  eventType: text('event_type', {
    enum: [
      'CREATED', 'SENT', 'RECEIVED', 'ACCEPTED', 'DECLINED', 'ACTION_TAKEN', 'CLOSED',
      'UPDATED', 'RENDERED', 'VIEWED', 'APPROVED', 'COPIED', 'DOWNLOADED', 'EXTERNAL_CHANNEL_OPENED',
      'MARKED_SUBMITTED', 'STATUS_CHANGED', 'REDACTED'
    ]
  }).notNull(),
  actorId: text('actor_id').notNull().references(() => users.id),
  metadataJson: text('metadata_json'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  refIdx: index('ref_events_ref_idx').on(table.referralId),
  caseIdx: index('ref_events_case_idx').on(table.caseId),
}));

export const referralChannelConfigs = sqliteTable('referral_channel_configs', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  organizationName: text('organization_name').notNull(),
  channelType: text('channel_type', { enum: ['PHONE', 'WEBSITE', 'EMAIL', 'ZALO', 'PRINT', 'MANUAL_DELIVERY'] }).notNull(),
  phone: text('phone'),
  email: text('email'),
  url: text('url'),
  jurisdiction: text('jurisdiction'),
  verificationStatus: text('verification_status', { enum: ['UNVERIFIED', 'VERIFIED', 'EXPIRED', 'DISABLED'] }).default('UNVERIFIED'),
  verifiedAt: text('verified_at'),
  verifiedBy: text('verified_by').references(() => users.id),
  verificationSource: text('verification_source'),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  metadataJson: text('metadata_json'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  codeIdx: index('ref_channels_code_idx').on(table.code),
  statusIdx: index('ref_channels_status_idx').on(table.verificationStatus),
}));

export const documentTemplates = sqliteTable('document_templates', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  version: text('version').notNull(),
  jurisdiction: text('jurisdiction').default('VN'),
  effectiveFrom: text('effective_from'),
  effectiveTo: text('effective_to'),
  verificationStatus: text('verification_status', { enum: ['UNVERIFIED', 'VERIFIED', 'EXPIRED', 'DISABLED'] }).default('UNVERIFIED'),
  templateContent: text('template_content'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  codeVerIdx: index('doc_templates_code_ver_idx').on(table.code, table.version),
}));

// ==========================================
// 13. FOLLOW-UP & OUTCOME DOMAIN
// ==========================================

export const followUps = sqliteTable('follow_ups', {
  id: text('id').primaryKey(),
  caseId: text('case_id').references(() => cases.id),
  passportId: text('passport_id').references(() => livelihoodPassports.id),
  socialWorkerId: text('social_worker_id').references(() => users.id),
  assignedTo: text('assigned_to').references(() => users.id),
  actionType: text('action_type', { enum: ['call', 'visit', 'doc_help', 'medical_check', 'job_trial', 'CALL', 'VISIT', 'HEALTH_CHECK', 'COMMUNITY_CHECK'] }).notNull(),
  notes: text('notes'),
  status: text('status', { enum: ['pending', 'in_progress', 'completed', 'missed', 'PENDING', 'DUE', 'COMPLETED', 'OVERDUE', 'CANCELLED'] }).default('pending'),
  dueDate: text('due_date'),
  dueAt: text('due_at'),
  completedAt: text('completed_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  caseIdx: index('followups_case_idx').on(table.caseId),
  dueDateIdx: index('followups_duedate_idx').on(table.dueDate),
  statusDueIdx: index('followups_status_due_idx').on(table.status, table.dueAt),
  statusIdx: index('followups_status_idx').on(table.status),
}));

export const followUpTasks = followUps;

export const followUpEvents = sqliteTable('follow_up_events', {
  id: text('id').primaryKey(),
  followUpId: text('follow_up_id').notNull().references(() => followUps.id),
  caseId: text('case_id').notNull().references(() => cases.id),
  result: text('result', { enum: ['BETTER', 'SAME', 'HARDER', 'UNREACHABLE', 'UNKNOWN'] }).notNull(),
  notes: text('notes'),
  actorId: text('actor_id').notNull().references(() => users.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  followUpIdx: index('followup_events_fu_idx').on(table.followUpId),
  caseIdx: index('followup_events_case_idx').on(table.caseId),
}));

export const outcomes = sqliteTable('outcomes', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id),
  followUpId: text('follow_up_id').references(() => followUps.id),
  resultStatus: text('result_status', { enum: ['BETTER', 'SAME', 'HARDER', 'UNREACHABLE', 'UNKNOWN'] }).notNull(),
  notes: text('notes'),
  recordedBy: text('recorded_by').references(() => users.id),
  recordedAt: text('recorded_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  caseIdx: index('outcomes_case_idx').on(table.caseId),
  statusIdx: index('outcomes_status_idx').on(table.resultStatus),
}));

export const outcomeEvents = sqliteTable('outcome_events', {
  id: text('id').primaryKey(),
  outcomeId: text('outcome_id').notNull().references(() => outcomes.id),
  caseId: text('case_id').notNull().references(() => cases.id),
  resultStatus: text('result_status').notNull(),
  actorId: text('actor_id').notNull().references(() => users.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  outcomeIdx: index('outcome_events_out_idx').on(table.outcomeId),
  caseIdx: index('outcome_events_case_idx').on(table.caseId),
}));

// ==========================================
// 14. PASSPORTS & OPPORTUNITIES DOMAIN
// ==========================================

export const livelihoodPassports = sqliteTable('livelihood_passports', {
  id: text('id').primaryKey(),
  beneficiaryId: text('beneficiary_id').references(() => beneficiaries.id),
  userId: text('user_id').references(() => users.id),
  ageGroup: text('age_group'),
  skills: text('skills'),
  workPreference: text('work_preference'),
  healthStatus: text('health_status'),
  location: text('location'),
  status: text('status').default('active'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  beneficiaryIdx: index('passports_beneficiary_idx').on(table.beneficiaryId),
}));

export const passportEvents = sqliteTable('passport_events', {
  id: text('id').primaryKey(),
  passportId: text('passport_id').notNull().references(() => livelihoodPassports.id),
  stage: text('stage', {
    enum: ['DRAFT', 'NEEDS_IDENTIFIED', 'SKILLS_ASSESSED', 'MATCHED_OPPORTUNITY', 'COMMUNITY_PLACED', 'CLOSED']
  }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  actorId: text('actor_id').references(() => users.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  passportIdx: index('passport_events_passport_idx').on(table.passportId),
  stageIdx: index('passport_events_stage_idx').on(table.stage),
}));

export const opportunities = sqliteTable('opportunities', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  organizationName: text('organization_name').notNull(),
  description: text('description').notNull(),
  category: text('category', { enum: ['short_term_job', 'training', 'emergency_aid', 'medical_care'] }),
  requiredSkills: text('required_skills'),
  contactInfo: text('contact_info'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const journeys = sqliteTable('journeys', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  teamId: text('team_id').notNull().references(() => teams.id),
  title: text('title').notNull(),
  locationName: text('location_name').notNull(),
  scheduledDate: text('scheduled_date').notNull(),
  status: text('status', { enum: ['planned', 'in_progress', 'completed', 'cancelled'] }).default('planned'),
  notes: text('notes'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  orgTeamIdx: index('journeys_org_team_idx').on(table.organizationId, table.teamId),
  statusIdx: index('journeys_status_idx').on(table.status),
}));

// ==========================================
// 15. AUDIT, NOTIFICATION & OFFLINE SYNC
// ==========================================

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id),
  userId: text('user_id').references(() => users.id),
  actorId: text('actor_id').references(() => users.id),
  actorRole: text('actor_role'),
  action: text('action').notNull(), // 'PII_ACCESS', 'CONSENT_CHANGE', 'FACT_VERIFICATION', 'SAFEGUARDING_ESCALATION', 'RESOURCE_VERIFICATION', 'REFERRAL_TRANSITION', 'OUTCOME_CHANGE', 'AI_RECOMMENDATION_ACCEPTED', 'AI_RECOMMENDATION_REJECTED'
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id'),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  previousState: text('previous_state'),
  newState: text('new_state'),
  metadata: text('metadata'),
  ipAddress: text('ip_address'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  orgIdx: index('audit_logs_org_idx').on(table.organizationId),
  userIdx: index('audit_logs_user_idx').on(table.userId),
  resourceIdx: index('audit_logs_resource_idx').on(table.resourceType, table.resourceId),
  entityIdx: index('audit_logs_entity_created_idx').on(table.entityType, table.entityId, table.createdAt),
}));

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdx: index('notifications_user_idx').on(table.userId),
}));

export const notificationPreferences = sqliteTable('notification_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  followUpDueEnabled: integer('follow_up_due_enabled', { mode: 'boolean' }).default(true),
  referralStatusEnabled: integer('referral_status_enabled', { mode: 'boolean' }).default(true),
  safeguardingAlertsEnabled: integer('safeguarding_alerts_enabled', { mode: 'boolean' }).default(true),
  resourceFreshnessEnabled: integer('resource_freshness_enabled', { mode: 'boolean' }).default(true),
}, (table) => ({
  userIdx: index('notif_pref_user_idx').on(table.userId),
}));

export const offlineSyncJobs = sqliteTable('offline_sync_jobs', {
  id: text('id').primaryKey(),
  navigatorId: text('navigator_id').notNull().references(() => users.id),
  clientJobId: text('client_job_id').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  payloadJson: text('payload_json').notNull(),
  status: text('status', { enum: ['PENDING', 'PROCESSED', 'FAILED'] }).default('PENDING'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  navigatorIdx: index('sync_jobs_nav_idx').on(table.navigatorId),
  idempotencyIdx: index('sync_jobs_idem_idx').on(table.idempotencyKey),
}));

export const domainOutbox = sqliteTable('domain_outbox', {
  id: text('id').primaryKey(),
  aggregateType: text('aggregate_type').notNull(),
  aggregateId: text('aggregate_id').notNull(),
  eventType: text('event_type').notNull(),
  payloadJson: text('payload_json').notNull(),
  status: text('status', { enum: ['PENDING', 'PUBLISHED', 'FAILED'] }).notNull().default('PENDING'),
  attemptCount: integer('attempt_count').notNull().default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  publishedAt: text('published_at'),
}, (table) => ({
  statusIdx: index('domain_outbox_status_idx').on(table.status),
  aggregateIdx: index('domain_outbox_aggregate_idx').on(table.aggregateType, table.aggregateId),
  eventTypeIdx: index('domain_outbox_event_type_idx').on(table.eventType),
}));

// ==========================================
// 16. MIL, SURVEY & ANALYTICS DOMAIN
// ==========================================

export const milModules = sqliteTable('mil_modules', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  category: text('category', {
    enum: ['SCAM_PREVENTION', 'DIGITAL_SAFETY', 'PRIVACY_PROTECTION', 'JOB_VERIFICATION']
  }).notNull(),
  contentJson: text('content_json'),
  quizQuestionsCount: integer('quiz_questions_count').default(5),
  isPublished: integer('is_published', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  catIdx: index('mil_modules_cat_idx').on(table.category),
}));

export const milIncidentLogs = sqliteTable('mil_incident_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  incidentType: text('incident_type', { enum: ['cyberbullying', 'fake_job_scam', 'deepfake', 'misinformation'] }),
  description: text('description'),
  riskLevel: text('risk_level', { enum: ['low', 'medium', 'high', 'critical'] }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdx: index('mil_incidents_user_idx').on(table.userId),
}));

export const verifiedInfoCards = sqliteTable('verified_info_cards', {
  id: text('id').primaryKey(),
  incidentType: text('incident_type').notNull(),
  title: text('title').notNull(),
  warningText: text('warning_text').notNull(),
  issuedAt: text('issued_at').default(sql`CURRENT_TIMESTAMP`),
});

export const impactMetrics = sqliteTable('impact_metrics', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  totalEncounters: integer('total_encounters').default(0),
  activeCases: integer('active_cases').default(0),
  successfulReferrals: integer('successful_referrals').default(0),
  safeguardingActions: integer('safeguarding_actions').default(0),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const metricSnapshots = sqliteTable('metric_snapshots', {
  id: text('id').primaryKey(),
  pilotId: text('pilot_id').references(() => pilots.id),
  isDemo: integer('is_demo', { mode: 'boolean' }).default(false),
  metricsJson: text('metrics_json').notNull(),
  capturedAt: text('captured_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  pilotIdx: index('snapshots_pilot_idx').on(table.pilotId),
}));

export const surveyResponses = sqliteTable('survey_responses', {
  id: text('id').primaryKey(),
  contactName: text('contact_name').notNull(),
  contactPhone: text('contact_phone').notNull(),
  contactEmail: text('contact_email'),
  contactOrg: text('contact_org'),
  a1Experience: text('a1_experience'),
  a2Frequency: text('a2_frequency'),
  a3OrgType: text('a3_org_type'),
  a4Role: text('a4_role'),
  a4ToolUsage: text('a4_tool_usage'),
  a5StopReasons: text('a5_stop_reasons'),
  b1AdoptionRate: text('b1_adoption_rate'),
  b2ChurnFactors: text('b2_churn_factors'),
  b3Tradeoff: text('b3_tradeoff'),
  b4ExtraTime: text('b4_extra_time'),
  b5RetentionDriver: text('b5_retention_driver'),
  b6DataPurpose: text('b6_data_purpose'),
  c1Fears: text('c1_fears'),
  c2MotivationImpact: text('c2_motivation_impact'),
  c3AuthenticitySkepticism: integer('c3_authenticity_skepticism'),
  c4DoubtAction: text('c4_doubt_action'),
  c5VerifyMethod: text('c5_verify_method'),
  c6ReferralWillingness: text('c6_referral_willingness'),
  d1ChildSafeguardingPriority: text('d1_child_safeguarding_priority'),
  d2LivelihoodPassportBarrier: text('d2_livelihood_passport_barrier'),
  d3UiFriction: text('d3_ui_friction'),
  d4IntakePreference: text('d4_intake_preference'),
  betaOptin: text('beta_optin'),
  userFeedback: text('user_feedback'),
  isPriorityLead: integer('is_priority_lead', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  phoneIdx: index('survey_responses_phone_idx').on(table.contactPhone),
  priorityIdx: index('survey_responses_priority_idx').on(table.isPriorityLead),
  createdAtIdx: index('survey_responses_created_at_idx').on(table.createdAt),
}));

// ==========================================
// 15. SSOT DIRECTORIES & CASE ORCHESTRATION LAYER
// ==========================================

export const people = sqliteTable('people', {
  id: text('id').primaryKey(),
  publicCode: text('public_code').notNull().unique(), // e.g. "TNV-8842"
  fullName: text('full_name').notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: ['volunteer', 'navigator', 'coordinator', 'supervisor', 'organisation_member', 'admin'] }).notNull().default('volunteer'),
  organizationId: text('organization_id').references(() => organizations.id),
  teamId: text('team_id').references(() => teams.id),
  status: text('status', { enum: ['active', 'busy', 'on_leave', 'inactive'] }).default('active'),
  capabilities: text('capabilities'), // JSON array of string tags
  serviceAreas: text('service_areas'), // JSON array of districts/areas
  maxActiveCases: integer('max_active_cases').default(5),
  activeCaseCount: integer('active_case_count').default(0),
  verifiedAt: text('verified_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  orgIdx: index('people_org_idx').on(table.organizationId),
  roleIdx: index('people_role_idx').on(table.role),
  statusIdx: index('people_status_idx').on(table.status),
}));

export const supportGateways = sqliteTable('support_gateways', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g. "GW-MED-HOCMON"
  name: text('name').notNull(),
  category: text('category', {
    enum: [
      'healthcare', 'livelihood', 'employment', 'food', 'temporary_shelter',
      'child_safeguarding', 'legal_support', 'documentation', 'education',
      'disability_support', 'elderly_support', 'social_protection', 'emergency',
      'counselling', 'community_support'
    ]
  }).notNull(),
  description: text('description'),
  organizationId: text('organization_id').references(() => organizations.id),
  serviceType: text('service_type'),
  eligibilitySummary: text('eligibility_summary'),
  jurisdiction: text('jurisdiction').default('TP. Hồ Chí Minh'),
  geographicCoverage: text('geographic_coverage'), // JSON array of districts
  channel: text('channel', { enum: ['direct_walkin', 'phone', 'referral_letter', 'zalo_hotline', 'online_form'] }).default('direct_walkin'),
  referralMethod: text('referral_method'),
  contactEndpoint: text('contact_endpoint'),
  openingHours: text('opening_hours'),
  verificationStatus: text('verification_status', { enum: ['VERIFIED', 'NEEDS_RECHECK', 'UNVERIFIED', 'STALE'] }).default('VERIFIED'),
  verifiedAt: text('verified_at'),
  verifiedBy: text('verified_by').references(() => users.id),
  confidence: integer('confidence').default(100),
  status: text('status', { enum: ['AVAILABLE', 'LIMITED', 'FULL', 'PAUSED'] }).default('AVAILABLE'),
  isDemo: integer('is_demo', { mode: 'boolean' }).default(false),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  catIdx: index('gateways_cat_idx').on(table.category),
  orgIdx: index('gateways_org_idx').on(table.organizationId),
  verStatusIdx: index('gateways_ver_status_idx').on(table.verificationStatus),
}));

export const caseTasks = sqliteTable('case_tasks', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().references(() => cases.id),
  referralId: text('referral_id').references(() => referrals.id),
  taskType: text('task_type', {
    enum: [
      'verify_service_availability',
      'call_organization_contact',
      'confirm_eligibility',
      'accompany_participant',
      'follow_up_after_referral',
      'recheck_service_info',
      'request_supervisor_review',
      'custom_action'
    ]
  }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  createdBy: text('created_by').references(() => users.id),
  assignedTo: text('assigned_to').references(() => users.id),
  assignedTeamId: text('assigned_team_id').references(() => teams.id),
  status: text('status', { enum: ['open', 'assigned', 'accepted', 'in_progress', 'blocked', 'completed', 'cancelled'] }).default('open'),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent'] }).default('medium'),
  dueAt: text('due_at'),
  acceptedAt: text('accepted_at'),
  completedAt: text('completed_at'),
  outcomeId: text('outcome_id').references(() => outcomes.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  caseIdx: index('case_tasks_case_idx').on(table.caseId),
  assignedToIdx: index('case_tasks_assigned_to_idx').on(table.assignedTo),
  statusIdx: index('case_tasks_status_idx').on(table.status),
}));

export const organisations = organizations;
