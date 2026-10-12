/**
 * Campaign domain logic — NEXTA RE:ACT Top 20
 *
 * Pure functions for campaign lifecycle, capacity management,
 * eligibility checks, and match scoring. No I/O.
 */

// ---------------------------------------------------------------------------
// Constants & Enums
// ---------------------------------------------------------------------------

export const CAMPAIGN_STATUSES = ['DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const CAMPAIGN_CATEGORIES = [
  'digital_help',
  'health_check',
  'food_drive',
  'legal_aid',
  'education',
  'housing',
  'employment',
  'mental_health',
  'child_protection',
  'general',
] as const;
export type CampaignCategory = (typeof CAMPAIGN_CATEGORIES)[number];

export const SLOT_STATUSES = ['AVAILABLE', 'RESERVED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;
export type SlotStatus = (typeof SLOT_STATUSES)[number];

export const PARTICIPANT_STATUSES = ['INVITED', 'CONFIRMED', 'ATTENDED', 'COMPLETED', 'NO_SHOW'] as const;
export type ParticipantStatus = (typeof PARTICIPANT_STATUSES)[number];

export const MISSION_STATUSES = [
  'ASSIGNED', 'CHECKED_IN', 'IN_PROGRESS', 'EVIDENCE_SUBMITTED', 'VERIFIED', 'COMPLETED',
] as const;
export type MissionStatus = (typeof MISSION_STATUSES)[number];

export const SIGNAL_STATUSES = [
  'DETECTED', 'CAMPAIGN_DRAFTED', 'CAMPAIGN_APPROVED', 'RESOLVED', 'DISMISSED',
] as const;
export type SignalStatus = (typeof SIGNAL_STATUSES)[number];

export const MATCH_STATUSES = ['RECOMMENDED', 'ACCEPTED', 'DECLINED', 'EXPIRED'] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const OUTCOME_STATUSES = ['BETTER', 'SAME', 'HARDER'] as const;
export type OutcomeStatus = (typeof OUTCOME_STATUSES)[number];

export const FOLLOWUP_TYPES = ['24h', '72h', '7d'] as const;
export type FollowupType = (typeof FOLLOWUP_TYPES)[number];

export const MISSION_DURATIONS = [15, 30, 60] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CampaignInput {
  title: string;
  description?: string;
  category: string;
  district: string;
  ward?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  startsAt: string;
  endsAt?: string;
  durationMinutes?: number;
  totalSlots?: number;
  minNavigators?: number;
  requiredSkills?: string[];
  eligibility?: Record<string, unknown>;
}

export interface CampaignRecord {
  id: string;
  status: CampaignStatus;
  totalSlots: number;
  filledSlots: number;
  startsAt: string;
  endsAt?: string;
  category: string;
  district: string;
  requiredSkills?: string[];
}

export interface NavigatorProfile {
  userId: string;
  district?: string;
  skills: string[];
  completedCategories: string[];
  activeMissionCount: number;
  availableDays?: string[]; // e.g. ['sunday','saturday']
}

export interface CampaignMatchResult {
  score: number;
  reasons: string[];
  eligible: boolean;
}

export interface CapacityInfo {
  total: number;
  filled: number;
  available: number;
  percentage: number;
  isFull: boolean;
}

export interface SignalInput {
  category: string;
  district: string;
  ward?: string;
  needCount: number;
  unresolvedCount: number;
  availableNavigators: number;
}

// ---------------------------------------------------------------------------
// Campaign Lifecycle
// ---------------------------------------------------------------------------

export function validateCampaignCreate(input: CampaignInput): { valid: true } | { valid: false; error: string } {
  if (!input.title?.trim()) return { valid: false, error: 'Title is required' };
  if (!input.category?.trim()) return { valid: false, error: 'Category is required' };
  if (!input.district?.trim()) return { valid: false, error: 'District is required' };
  if (!input.startsAt?.trim()) return { valid: false, error: 'Start date is required' };
  const slots = input.totalSlots ?? 20;
  if (slots < 1 || slots > 200) return { valid: false, error: 'Total slots must be between 1 and 200' };
  return { valid: true };
}

export function canPublish(campaign: CampaignRecord): { allowed: true } | { allowed: false; reason: string } {
  if (campaign.status !== 'DRAFT') return { allowed: false, reason: 'Only DRAFT campaigns can be published' };
  if (!campaign.startsAt) return { allowed: false, reason: 'Start date is required to publish' };
  return { allowed: true };
}

export function canActivate(campaign: CampaignRecord): { allowed: true } | { allowed: false; reason: string } {
  if (campaign.status !== 'PUBLISHED') return { allowed: false, reason: 'Only PUBLISHED campaigns can be activated' };
  if (campaign.filledSlots < 1) return { allowed: false, reason: 'At least one participant is needed to activate' };
  return { allowed: true };
}

export function canComplete(campaign: CampaignRecord): { allowed: true } | { allowed: false; reason: string } {
  if (campaign.status !== 'ACTIVE') return { allowed: false, reason: 'Only ACTIVE campaigns can be completed' };
  return { allowed: true };
}

export function canJoin(campaign: CampaignRecord): { allowed: true } | { allowed: false; reason: string } {
  if (campaign.status !== 'PUBLISHED' && campaign.status !== 'ACTIVE') {
    return { allowed: false, reason: 'Campaign is not accepting participants' };
  }
  if (campaign.filledSlots >= campaign.totalSlots) {
    return { allowed: false, reason: 'Campaign is full' };
  }
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Capacity
// ---------------------------------------------------------------------------

export function computeCapacity(totalSlots: number, filledSlots: number): CapacityInfo {
  const available = Math.max(0, totalSlots - filledSlots);
  return {
    total: totalSlots,
    filled: filledSlots,
    available,
    percentage: totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0,
    isFull: available === 0,
  };
}

// ---------------------------------------------------------------------------
// Campaign Autopilot — Match Scoring
// ---------------------------------------------------------------------------

/**
 * Weighted scoring: category +35, district +25, availability +15, experience +15, capacity urgency +10
 * Eligible threshold: score >= 40
 */
export function computeMatchScore(navigator: NavigatorProfile, campaign: CampaignRecord): CampaignMatchResult {
  let score = 0;
  const reasons: string[] = [];

  // Category / skill match (+35)
  const campaignSkills = campaign.requiredSkills ?? [];
  if (campaignSkills.length === 0 || navigator.skills.some(skill => campaignSkills.includes(skill))) {
    score += 35;
    reasons.push('skill_match');
  }

  // District match (+25)
  if (navigator.district && navigator.district === campaign.district) {
    score += 25;
    reasons.push('same_area');
  }

  // Availability — not overloaded (+15)
  if (navigator.activeMissionCount < 3) {
    score += 15;
    reasons.push('available');
  }

  // Past experience in this category (+15)
  if (navigator.completedCategories.includes(campaign.category)) {
    score += 15;
    reasons.push('experience');
  }

  // Campaign capacity urgency (+10)
  const capacityPct = campaign.totalSlots > 0 ? campaign.filledSlots / campaign.totalSlots : 0;
  if (capacityPct >= 0.7) {
    score += 10;
    reasons.push('filling_fast');
  }

  return { score, reasons, eligible: score >= 40 };
}

// ---------------------------------------------------------------------------
// Signal Detection
// ---------------------------------------------------------------------------

const SIGNAL_THRESHOLD = 5;

export function shouldCreateSignal(input: SignalInput): boolean {
  return input.needCount >= SIGNAL_THRESHOLD && input.unresolvedCount >= 3 && input.availableNavigators >= 2;
}

export function suggestCampaignFromSignal(input: SignalInput): {
  suggestedTitle: string;
  suggestedSlots: number;
  estimatedDuration: number;
} {
  const categoryLabels: Record<string, string> = {
    digital_help: 'Hỗ trợ ứng dụng số',
    health_check: 'Khám sức khỏe cộng đồng',
    food_drive: 'Phát lương thực',
    legal_aid: 'Tư vấn pháp lý',
    education: 'Hỗ trợ giáo dục',
    housing: 'Hỗ trợ nhà ở',
    employment: 'Kết nối việc làm',
    mental_health: 'Hỗ trợ tâm lý',
    child_protection: 'Bảo vệ trẻ em',
    general: 'Hỗ trợ cộng đồng',
  };
  const label = categoryLabels[input.category] ?? input.category;

  return {
    suggestedTitle: `${label} tại ${input.district}`,
    suggestedSlots: Math.max(input.availableNavigators, Math.ceil(input.needCount * 1.2)),
    estimatedDuration: 180,
  };
}

// ---------------------------------------------------------------------------
// Follow-up Chain
// ---------------------------------------------------------------------------

export function computeFollowupSchedule(completedAt: string): Array<{ type: FollowupType; dueAt: string }> {
  const base = new Date(completedAt);
  return [
    { type: '24h', dueAt: new Date(base.getTime() + 24 * 60 * 60 * 1000).toISOString() },
    { type: '72h', dueAt: new Date(base.getTime() + 72 * 60 * 60 * 1000).toISOString() },
    { type: '7d', dueAt: new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() },
  ];
}

// ---------------------------------------------------------------------------
// Distance helper (Haversine, km)
// ---------------------------------------------------------------------------

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
