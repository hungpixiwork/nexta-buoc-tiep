export type UserRole = 'beneficiary' | 'volunteer' | 'social_worker' | 'admin';

export interface User {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  role: UserRole;
  createdAt: string;
}

export interface LivelihoodPassport {
  id: string;
  userId: string;
  ageGroup: 'young_adult' | 'elderly' | 'youth';
  skills: string[]; // Dynamic JSON array of practical skills
  workPreference: string;
  healthStatus?: string;
  location: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface Opportunity {
  id: string;
  title: string;
  organizationName: string;
  description: string;
  category: 'short_term_job' | 'training' | 'emergency_aid' | 'medical_care';
  requiredSkills: string[];
  contactInfo: string;
  createdAt: string;
}

export interface FollowUpTask {
  id: string;
  passportId: string;
  socialWorkerId?: string;
  actionType: 'call' | 'document_help' | 'job_trial' | 'medical_check';
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  createdAt: string;
}

export interface MILIncidentLog {
  id: string;
  userId?: string;
  incidentType: 'cyberbullying' | 'fake_job_scam' | 'deepfake' | 'misinformation';
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
}

export type PriorityNeedKey = 'health' | 'papers' | 'safe' | 'edu' | 'protect' | 'job' | 'expert';

export type CaseStatus = 'open' | 'in_progress' | 'referred' | 'closed' | 'resolved';
export type CasePriority = 'low' | 'medium' | 'high' | 'urgent';
export type FollowUpStatus = 'pending' | 'in_progress' | 'completed' | 'missed';

export interface EncounterCase {
  id: string;
  name: string;
  age?: number;
  location: string;
  summary: string;
  selectedPriority?: PriorityNeedKey;
  priorityLabel?: string;
  status: 'need_followup' | 'in_progress' | 'completed';
  lastEncounterDate: string;
  volunteerName: string;
}

export interface VoiceExtraction {
  id: string;
  name: string;
  location: string;
  priority1: string;
  priority2: string;
  milWarning?: string;
  transcription: string;
  createdAt: string;
}

export interface CheckInRecord {
  id: string;
  caseId: string;
  mood: 'sunny' | 'cloudy' | 'rain';
  helpfulStatus: 'yes' | 'no' | 'pend';
  notes?: string;
  createdAt: string;
}


