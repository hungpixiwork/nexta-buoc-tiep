/**
 * BƯỚC TIẾP routes every person into one of three pathways, because the right help differs:
 *  - child   (<18): protection first — family, school, social work. Never employment.
 *  - elderly (≥60): needs assessment first — health, papers, shelter, welfare; light livelihood only if wanted.
 *  - adult:         Livelihood Passport — skills, MIL, paid trial shifts, steadier work.
 * The UI tags every row with its pathway so a navigator never offers the wrong kind of help.
 */
import type { NeedCategory } from './types';

export type Pathway = 'child' | 'elderly' | 'adult';

export const ELDERLY_AGE = 60;

export function pathwayOf(p: { isMinor?: boolean | null; age?: number | null; targetGroup?: string | null }): Pathway {
  const group = (p.targetGroup ?? '').toLowerCase();
  if (p.isMinor || (p.age != null && p.age < 18) || group === 'child' || group === 'children') return 'child';
  if ((p.age != null && p.age >= ELDERLY_AGE) || group === 'elderly' || group === 'older_people') return 'elderly';
  return 'adult';
}

export const PATHWAY_LABEL: Record<Pathway, { vi: string; en: string }> = {
  child: { vi: 'Trẻ em · Bảo vệ', en: 'Child · Protection' },
  elderly: { vi: 'Người cao tuổi · An sinh', en: 'Older person · Welfare' },
  adult: { vi: 'Người trưởng thành · Sinh kế', en: 'Adult · Livelihood' },
};

export const PATHWAY_TONE: Record<Pathway, 'danger' | 'ai' | 'step'> = {
  child: 'danger',
  elderly: 'ai',
  adult: 'step',
};

/** Need categories that must never be offered on a pathway (mirrors the RiskGate employment block for minors). */
export const PATHWAY_BLOCKED_NEEDS: Record<Pathway, NeedCategory[]> = {
  child: ['employment'],
  elderly: [],
  adult: [],
};

/** Display name that respects safeguarding: children are only ever shown by alias. */
export function displayName(p: { alias: string; preferredAddress?: string | null; isMinor?: boolean | null; age?: number | null; targetGroup?: string | null }): string {
  if (pathwayOf(p) === 'child') return p.alias;
  return p.preferredAddress?.trim() || p.alias;
}

/** Two-letter avatar initials (no photos of beneficiaries are ever stored or shown). */
export function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (/^CHILD-/i.test(name)) return name.slice(-2).toUpperCase();
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : parts[0][1] ?? '';
  return (first + last).toUpperCase();
}
