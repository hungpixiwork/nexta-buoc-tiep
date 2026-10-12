import { z } from 'zod';

export type MatchUrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface MatchRequest {
  id: string;
  caseId: string;
  beneficiaryName?: string;
  age: number;
  isMinor: boolean;
  skills: string[];
  priorityNeed: 'health' | 'papers' | 'safe' | 'edu' | 'protect' | 'job' | 'expert';
  preferredDistrict: string;
  urgency: MatchUrgencyLevel;
  healthRestrictions?: string[];
  preferredCategories?: string[];
  createdAt: string;
}

export const MatchRequestSchema = z.object({
  id: z.string().min(1, 'Mã yêu cầu không được để trống'),
  caseId: z.string().min(1, 'Mã ca bệnh/hồ sơ không được để trống'),
  beneficiaryName: z.string().optional(),
  age: z.number().min(0).max(120),
  isMinor: z.boolean(),
  skills: z.array(z.string()).default([]),
  priorityNeed: z.enum(['health', 'papers', 'safe', 'edu', 'protect', 'job', 'expert']),
  preferredDistrict: z.string().min(1, 'Địa bàn ưu tiên không được để trống'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  healthRestrictions: z.array(z.string()).optional(),
  preferredCategories: z.array(z.string()).optional(),
  createdAt: z.string(),
});
