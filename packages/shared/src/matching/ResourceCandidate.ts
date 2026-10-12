import { z } from 'zod';

export type ResourceCandidateType =
  | 'JOB'
  | 'TRAINING'
  | 'EMERGENCY_AID'
  | 'MEDICAL_CARE'
  | 'SHELTER'
  | 'LEGAL_HELP';

export type CandidateVerificationStatus =
  | 'VERIFIED'
  | 'NEEDS_RECHECK'
  | 'UNCONFIRMED'
  | 'STALE'
  | 'UNAVAILABLE';

export interface ResourceCandidate {
  id: string;
  name: string;
  type: ResourceCandidateType;
  category: string;
  description: string;
  requiredSkills: string[];
  district: string;
  address?: string;
  ageMin: number;
  ageMax: number;
  isActive: boolean;
  availableSlots: number;
  urgencySupported: boolean;
  isHazardousWork?: boolean;
  verificationStatus?: CandidateVerificationStatus;
  verifiedAt?: string;
  verificationExpiresAt?: string;
  contactInfo: string;
  providerId: string;
  providerName: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export const ResourceCandidateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['JOB', 'TRAINING', 'EMERGENCY_AID', 'MEDICAL_CARE', 'SHELTER', 'LEGAL_HELP']),
  category: z.string().min(1),
  description: z.string(),
  requiredSkills: z.array(z.string()).default([]),
  district: z.string().min(1),
  address: z.string().optional(),
  ageMin: z.number().min(0).default(0),
  ageMax: z.number().max(120).default(100),
  isActive: z.boolean().default(true),
  availableSlots: z.number().min(0).default(1),
  urgencySupported: z.boolean().default(false),
  isHazardousWork: z.boolean().optional().default(false),
  verificationStatus: z.enum(['VERIFIED', 'NEEDS_RECHECK', 'UNCONFIRMED', 'STALE', 'UNAVAILABLE']).optional().default('VERIFIED'),
  verifiedAt: z.string().optional(),
  verificationExpiresAt: z.string().optional(),
  contactInfo: z.string(),
  providerId: z.string().min(1),
  providerName: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string(),
});
