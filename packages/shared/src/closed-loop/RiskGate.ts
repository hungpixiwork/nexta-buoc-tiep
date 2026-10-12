/**
 * RiskGate — deterministic safeguarding gate that runs BEFORE any AI output is used.
 *
 * "The greater the consequence, the less authority the AI receives."
 *  - Rules decide. AI may only ADD flags (source AI_SUGGESTED); it can never
 *    remove a flag or lower the decision.
 *  - Children are never a customer segment: any minor signal forces human review
 *    and blocks employment referrals.
 *  - Scam/impersonation is language-pattern detection only → Verification Card,
 *    never a forensic verdict.
 */
import { detectScamRiskInText } from '../learning/VerifiedInfoCard';

export type RiskDecision = 'PROCEED' | 'ASK_MORE' | 'HUMAN_REVIEW' | 'EMERGENCY_111';
export type GateSeverity = 'info' | 'caution' | 'review' | 'emergency';
export type RiskFlagSource = 'RULE' | 'NAVIGATOR' | 'AI_SUGGESTED';

export type RiskFlagCode =
  | 'CHILD_PRESENT'
  | 'VIOLENCE_OR_ABUSE'
  | 'SELF_HARM'
  | 'MEDICAL_EMERGENCY'
  | 'EXPLOITATION_OR_TRAFFICKING'
  | 'SCAM_PATTERN'
  | 'IMPERSONATION_PATTERN'
  | 'NO_SAFE_SHELTER_TONIGHT'
  | 'OTHER';

export interface RiskFlag {
  code: RiskFlagCode;
  severity: GateSeverity;
  source: RiskFlagSource;
  /** The matched phrase or reason, so a human can check it */
  evidence: string;
}

export type MissingContextKey = 'consent' | 'need' | 'location' | 'age_if_child_suspected';

export interface RiskGateInput {
  /** All free-text captured so far (note, transcript, keywords) */
  text?: string | null;
  age?: number | null;
  isMinor?: boolean | null;
  hasConsent: boolean;
  need?: string | null;
  district?: string | null;
  /** Flags ticked by the Navigator */
  navigatorFlags?: RiskFlagCode[];
  /** Flags proposed by AI — additive only */
  aiFlags?: RiskFlagCode[];
}

export interface RiskGateResult {
  decision: RiskDecision;
  flags: RiskFlag[];
  missingContext: MissingContextKey[];
  requiresHuman: boolean;
  call111: boolean;
  blocksReferral: boolean;
  blocksEmploymentReferral: boolean;
  /** Show a Verification Card with a safe alternative (scam/impersonation) */
  showVerificationCard: boolean;
  aiAuthority: 'SUGGEST_ONLY';
  evaluatedAt: string;
}

const SEVERITY_OF: Record<RiskFlagCode, GateSeverity> = {
  CHILD_PRESENT: 'review',
  VIOLENCE_OR_ABUSE: 'emergency',
  SELF_HARM: 'emergency',
  MEDICAL_EMERGENCY: 'emergency',
  EXPLOITATION_OR_TRAFFICKING: 'review',
  SCAM_PATTERN: 'caution',
  IMPERSONATION_PATTERN: 'caution',
  NO_SAFE_SHELTER_TONIGHT: 'review',
  OTHER: 'caution',
};

const PHRASES: Array<{ code: RiskFlagCode; phrases: string[] }> = [
  {
    code: 'VIOLENCE_OR_ABUSE',
    phrases: ['bạo hành', 'bị đánh', 'đánh đập', 'xâm hại', 'hiếp dâm', 'đe dọa giết', 'bị đuổi đánh', 'violence', 'abuse'],
  },
  { code: 'SELF_HARM', phrases: ['tự tử', 'tự sát', 'muốn chết', 'không muốn sống', 'suicide'] },
  {
    code: 'MEDICAL_EMERGENCY',
    phrases: ['bất tỉnh', 'khó thở', 'co giật', 'đột quỵ', 'chảy máu nhiều', 'ngất xỉu', 'đau ngực dữ dội'],
  },
  {
    code: 'EXPLOITATION_OR_TRAFFICKING',
    phrases: ['giữ giấy tờ', 'không cho về', 'ép làm', 'chăn dắt', 'bóc lột', 'bán sang', 'lao động trẻ em', 'dụ dỗ đi xa'],
  },
  { code: 'NO_SAFE_SHELTER_TONIGHT', phrases: ['không có chỗ ngủ', 'ngủ ngoài đường tối nay', 'bị đuổi khỏi nhà'] },
  { code: 'CHILD_PRESENT', phrases: ['trẻ em', 'con nhỏ đi bán', 'bỏ học đi làm', 'đứa bé', 'em bé bán vé số'] },
];

const IMPERSONATION_PHRASES = ['tài khoản công an', 'viện kiểm sát', 'giả danh', 'chuyển tiền gấp', 'tai nạn khẩn cấp'];

/** Lowercase + strip Vietnamese diacritics so unaccented field notes still match. */
export function foldVietnamese(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
}

function findPhrase(folded: string, phrases: string[]): string | null {
  for (const p of phrases) {
    if (folded.includes(foldVietnamese(p))) return p;
  }
  return null;
}

/** Extracts "12 tuổi" / "12 tuoi" style ages from free text. */
export function extractAgesFromText(text: string): number[] {
  const folded = foldVietnamese(text);
  const ages: number[] = [];
  const re = /(\d{1,2})\s*tuoi/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(folded)) !== null) ages.push(Number(m[1]));
  return ages;
}

const SEVERITY_RANK: Record<GateSeverity, number> = { info: 0, caution: 1, review: 2, emergency: 3 };

export function evaluateRiskGate(input: RiskGateInput, now: Date = new Date()): RiskGateResult {
  const text = input.text ?? '';
  const folded = foldVietnamese(text);
  const flags: RiskFlag[] = [];
  const add = (code: RiskFlagCode, source: RiskFlagSource, evidence: string) => {
    if (flags.some((f) => f.code === code && f.source === source)) return;
    flags.push({ code, severity: SEVERITY_OF[code], source, evidence });
  };

  // 1. Deterministic rules
  for (const group of PHRASES) {
    const hit = findPhrase(folded, group.phrases);
    if (hit) add(group.code, 'RULE', `"${hit}"`);
  }
  const textAges = extractAgesFromText(text).filter((a) => a < 18);
  if (input.isMinor) add('CHILD_PRESENT', 'RULE', 'Marked as under 18');
  if (input.age != null && input.age < 18) add('CHILD_PRESENT', 'RULE', `Age ${input.age}`);
  if (textAges.length > 0) add('CHILD_PRESENT', 'RULE', `"${textAges[0]} tuổi" in note`);

  const scam = detectScamRiskInText(text);
  if (scam.detectedCategories.includes('fake_job_scam')) add('SCAM_PATTERN', 'RULE', `"${scam.matchedKeywords[0]}"`);
  const impersonation = findPhrase(folded, IMPERSONATION_PHRASES);
  if (impersonation) add('IMPERSONATION_PATTERN', 'RULE', `"${impersonation}"`);

  // 2. Navigator judgement
  for (const code of input.navigatorFlags ?? []) add(code, 'NAVIGATOR', 'Flagged by Navigator');

  // 3. AI suggestions — additive only
  for (const code of input.aiFlags ?? []) add(code, 'AI_SUGGESTED', 'Suggested by AI, needs human check');

  // 4. Missing critical context
  const missingContext: MissingContextKey[] = [];
  if (!input.hasConsent) missingContext.push('consent');
  if (!input.need?.trim()) missingContext.push('need');
  if (!input.district?.trim()) missingContext.push('location');
  const childSuspected = flags.some((f) => f.code === 'CHILD_PRESENT');
  if (childSuspected && input.age == null && textAges.length === 0 && !input.isMinor) {
    missingContext.push('age_if_child_suspected');
  }

  // 5. Decision = highest severity wins; AI can raise but never lower
  const top = flags.reduce<GateSeverity>(
    (acc, f) => (SEVERITY_RANK[f.severity] > SEVERITY_RANK[acc] ? f.severity : acc),
    'info',
  );
  let decision: RiskDecision = 'PROCEED';
  if (top === 'emergency') decision = 'EMERGENCY_111';
  else if (top === 'review') decision = 'HUMAN_REVIEW';
  else if (missingContext.length > 0) decision = 'ASK_MORE';

  const requiresHuman = decision === 'EMERGENCY_111' || decision === 'HUMAN_REVIEW';

  return {
    decision,
    flags,
    missingContext,
    requiresHuman,
    // 111 = national child-protection hotline: emergencies, or a child with exploitation signals
    call111:
      decision === 'EMERGENCY_111' ||
      (childSuspected && flags.some((f) => f.code === 'EXPLOITATION_OR_TRAFFICKING')),
    blocksReferral: decision !== 'PROCEED',
    blocksEmploymentReferral: childSuspected || flags.some((f) => f.code === 'EXPLOITATION_OR_TRAFFICKING'),
    showVerificationCard: flags.some((f) => f.code === 'SCAM_PATTERN' || f.code === 'IMPERSONATION_PATTERN'),
    aiAuthority: 'SUGGEST_ONLY',
    evaluatedAt: now.toISOString(),
  };
}

/**
 * A human reviewer can clear HUMAN_REVIEW (never EMERGENCY_111 — that requires
 * the 111 escalation to be logged first). Returns the decision after review.
 */
export function applyHumanReview(
  result: RiskGateResult,
  review: { approved: boolean; escalationLogged?: boolean },
): RiskDecision {
  if (!review.approved) return result.decision;
  if (result.decision === 'EMERGENCY_111' && !review.escalationLogged) return 'EMERGENCY_111';
  if (result.missingContext.length > 0) return 'ASK_MORE';
  return 'PROCEED';
}
