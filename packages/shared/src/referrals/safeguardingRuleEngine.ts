import { SafeguardingAssessment } from './types';

export interface CaseSafeguardingInput {
  isMinor?: boolean | null;
  birthYear?: number | null;
  estimatedAge?: number | null;
  vulnerabilityGroup?: string | null;
  vulnerabilityFlags?: string[];
  riskFlags?: string[];
  notes?: string | null;
}

/**
 * Deterministic Safeguarding Assessment Rule Engine
 * 
 * Rules:
 * 1. Minor Detection: If isMinor === true OR birthYear indicates age < 18 OR estimatedAge < 18 OR flags contain CHILD -> isPotentialMinor = true.
 * 2. Employment Hard Deny: If isPotentialMinor === true OR riskFlags contain CHILD_EXPLOITATION / CHILD_ABUSE / TRAFFICKING_RISK -> employmentBlocked = true.
 * 3. Urgency Evaluation:
 *    - CRITICAL: Direct abuse, violence, or immediate severe exploitation.
 *    - HIGH: Forced child labor, street working minors at night, trafficking risks.
 *    - MEDIUM: General child vulnerability without immediate violence.
 *    - LOW: Standard adult assistance cases without child flags.
 *    - UNKNOWN: Incomplete data.
 */
export function evaluateSafeguardingRisk(input: CaseSafeguardingInput): SafeguardingAssessment {
  const currentYear = new Date().getFullYear();
  const reasons: string[] = [];

  let calculatedAge: number | null = null;
  if (input.birthYear && input.birthYear > 1900) {
    calculatedAge = currentYear - input.birthYear;
  } else if (input.estimatedAge != null && input.estimatedAge > 0) {
    calculatedAge = input.estimatedAge;
  }

  const isMinorByAge = calculatedAge !== null && calculatedAge < 18;
  const isMinorByFlag = Boolean(input.isMinor);
  const isMinorByGroup = input.vulnerabilityGroup?.toLowerCase().includes('child') || input.vulnerabilityGroup?.toLowerCase().includes('youth_street');
  const vulnFlags = input.vulnerabilityFlags || [];
  const riskFlags = input.riskFlags || [];

  const hasChildVulnFlag = vulnFlags.some(f => typeof f === 'string' && (f.toUpperCase().includes('CHILD') || f.toUpperCase().includes('MINOR')));
  const hasExploitationRisk = riskFlags.some(r => typeof r === 'string' && ['CHILD_EXPLOITATION', 'CHILD_ABUSE', 'TRAFFICKING_RISK', 'FORCED_LABOR', 'VIOLENCE', 'SCAM_TRAP', 'FAKE_JOB_SCAM'].includes(r.toUpperCase()));
  const hasScamVuln = vulnFlags.some(f => typeof f === 'string' && (f.toUpperCase().includes('SCAM') || f.toUpperCase().includes('FEE_BEFORE_WORK')));

  const isPotentialMinor = isMinorByAge || isMinorByFlag || isMinorByGroup || hasChildVulnFlag;

  if (isMinorByFlag) reasons.push('Được đánh dấu là trẻ em vị thành niên (isMinor === true)');
  if (isMinorByAge) reasons.push(`Độ tuổi ước tính là ${calculatedAge} (< 18 tuổi)`);
  if (isMinorByGroup) reasons.push(`Nhóm đối tượng yếu thế thuộc nhóm trẻ em/thanh thiếu niên: ${input.vulnerabilityGroup}`);
  if (hasChildVulnFlag) reasons.push('Có cờ cảnh báo đối tượng trẻ em (vulnerabilityFlags)');

  let urgency: SafeguardingAssessment['urgency'] = 'LOW';
  let immediateCallRecommended = false;

  if (hasExploitationRisk) {
    reasons.push('Phát hiện nguy cơ bóc lột, bạo lực, cưỡng bức, bẫy lừa đảo hoặc chăn dắt trẻ em (riskFlags)');
    urgency = 'CRITICAL';
    immediateCallRecommended = true;
  } else if (hasScamVuln) {
    reasons.push('Phát hiện bẫy lừa đảo việc làm hoặc thu phí trước (vulnerabilityFlags)');
    urgency = 'HIGH';
    immediateCallRecommended = true;
  } else if (isPotentialMinor) {
    urgency = 'HIGH';
    immediateCallRecommended = true;
  } else if (calculatedAge === null && !input.vulnerabilityGroup) {
    urgency = 'UNKNOWN';
    reasons.push('Thiếu thông tin tuổi và thông tin nhóm đối tượng');
  }

  const employmentBlocked = isPotentialMinor || hasExploitationRisk;
  const requiresHumanReview = isPotentialMinor || hasExploitationRisk || urgency === 'CRITICAL' || urgency === 'HIGH';

  return {
    isPotentialMinor,
    urgency,
    reasons,
    employmentBlocked,
    immediateCallRecommended,
    requiresHumanReview,
  };
}

/**
 * Hard Deny Policy helper for Employment Referrals
 */
export function canCreateEmploymentReferral(input: CaseSafeguardingInput): { allowed: boolean; reason?: string } {
  const assessment = evaluateSafeguardingRisk(input);
  if (assessment.employmentBlocked) {
    return {
      allowed: false,
      reason: `Nghiêm cấm giới thiệu việc làm trực tiếp cho trường hợp trẻ em vị thành niên (<18t) hoặc có nguy cơ bóc lột. Lí do: ${assessment.reasons.join('; ')}`,
    };
  }
  return { allowed: true };
}

/**
 * Hard Deny Policy helper for Livelihood Passport Creation / Updates
 */
export function canCreateLivelihoodPassport(input: CaseSafeguardingInput): { allowed: boolean; reason?: string } {
  const assessment = evaluateSafeguardingRisk(input);
  if (assessment.isPotentialMinor) {
    return {
      allowed: false,
      reason: `BẢO VỆ TRẺ EM: Trẻ em vị thành niên (<18t) không tạo Hộ chiếu Sinh kế lao động. Lí do: ${assessment.reasons.join('; ')}`,
    };
  }
  return { allowed: true };
}

