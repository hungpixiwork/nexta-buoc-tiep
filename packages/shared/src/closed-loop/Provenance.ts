/**
 * Provenance — every fact shown in NEXTA says where it came from.
 *
 *   Beneficiary stated → Navigator observed → AI suggested → Human verified → Verified external source
 *
 * AI_SUGGESTED facts are never used for a consequential decision until a human
 * upgrades them to HUMAN_VERIFIED.
 */

export const PROVENANCE_SOURCES = [
  'BENEFICIARY_STATED',
  'NAVIGATOR_OBSERVED',
  'AI_SUGGESTED',
  'HUMAN_VERIFIED',
  'VERIFIED_EXTERNAL',
] as const;
export type ProvenanceSource = (typeof PROVENANCE_SOURCES)[number];

/** Maps `case_facts.source_type` and other stored values onto the chain. */
export function normalizeProvenance(value: string | null | undefined): ProvenanceSource {
  const v = (value ?? '').trim().toUpperCase();
  if ((PROVENANCE_SOURCES as readonly string[]).includes(v)) return v as ProvenanceSource;
  if (v.startsWith('AI') || v === 'MODEL_INFERRED') return 'AI_SUGGESTED';
  if (v.includes('PARTNER') || v.includes('EXTERNAL') || v.includes('DOCUMENT')) return 'VERIFIED_EXTERNAL';
  if (v.includes('VERIFIED')) return 'HUMAN_VERIFIED';
  if (v.includes('NAVIGATOR') || v.includes('VOLUNTEER') || v.includes('OBSERVED')) return 'NAVIGATOR_OBSERVED';
  return 'BENEFICIARY_STATED';
}

/** Whether a fact from this source may drive a consequential decision on its own. */
export function isDecisionGrade(source: ProvenanceSource): boolean {
  return source !== 'AI_SUGGESTED';
}

export interface ProvenancedValue<T> {
  value: T;
  source: ProvenanceSource;
  recordedAt?: string;
  recordedBy?: string | null;
}

/** Human confirmation of an AI suggestion (the only way AI output gains authority). */
export function confirmByHuman<T>(fact: ProvenancedValue<T>, userId: string, at: Date = new Date()): ProvenancedValue<T> {
  return { ...fact, source: 'HUMAN_VERIFIED', recordedBy: userId, recordedAt: at.toISOString() };
}
