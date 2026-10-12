import { z } from 'zod';

export type TargetVulnerabilityGroup =
  | 'street_worker'
  | 'elderly'
  | 'youth'
  | 'homeless'
  | 'minor_child'
  | 'disabled'
  | 'any';

export interface EligibilityRule {
  id: string;
  resourceId?: string;
  targetVulnerabilityGroups: TargetVulnerabilityGroup[];
  minAge?: number;
  maxAge?: number;
  requiresIdentityDoc: boolean; // false = hỗ trợ trường hợp 3 Không (Không giấy tờ)
  geographicBoundaries: string[]; // e.g. ['Hóc Môn', 'Bình Chánh', 'Quận 12', 'Toàn TP.HCM']
  maxIncomeThreshold?: number;
  specialConditions?: string[];
}

export const EligibilityRuleSchema = z.object({
  id: z.string().optional(),
  resourceId: z.string().optional(),
  targetVulnerabilityGroups: z
    .array(
      z.enum([
        'street_worker',
        'elderly',
        'youth',
        'homeless',
        'minor_child',
        'disabled',
        'any',
      ])
    )
    .default(['any']),
  minAge: z.number().min(0).max(120).optional(),
  maxAge: z.number().min(0).max(120).optional(),
  requiresIdentityDoc: z.boolean().default(false),
  geographicBoundaries: z.array(z.string()).default(['Toàn TP.HCM']),
  maxIncomeThreshold: z.number().optional(),
  specialConditions: z.array(z.string()).optional().default([]),
});

export type EligibilityCandidate = {
  age?: number;
  vulnerabilityGroup?: string;
  district?: string;
  hasIdDoc?: boolean;
};

export type EligibilityEvaluationResult = {
  eligible: boolean;
  reasons: string[];
};

/**
 * Đánh giá điều kiện thụ hưởng của một đối tượng so với quy tắc nguồn lực.
 */
export function evaluateEligibility(
  rule: EligibilityRule,
  candidate: EligibilityCandidate
): EligibilityEvaluationResult {
  const reasons: string[] = [];
  let eligible = true;

  // 1. Kiểm tra độ tuổi
  if (candidate.age !== undefined) {
    if (rule.minAge !== undefined && candidate.age < rule.minAge) {
      eligible = false;
      reasons.push(`Độ tuổi (${candidate.age}) nhỏ hơn yêu cầu tối thiểu (${rule.minAge} tuổi).`);
    }
    if (rule.maxAge !== undefined && candidate.age > rule.maxAge) {
      eligible = false;
      reasons.push(`Độ tuổi (${candidate.age}) vượt quá giới hạn tối đa (${rule.maxAge} tuổi).`);
    }
  }

  // 2. Kiểm tra nhóm đối tượng yếu thế
  if (
    candidate.vulnerabilityGroup &&
    !rule.targetVulnerabilityGroups.includes('any') &&
    !rule.targetVulnerabilityGroups.includes(candidate.vulnerabilityGroup as TargetVulnerabilityGroup)
  ) {
    eligible = false;
    reasons.push(
      `Nhóm đối tượng (${candidate.vulnerabilityGroup}) không thuộc danh sách hỗ trợ của nguồn lực này.`
    );
  }

  // 3. Kiểm tra yêu cầu giấy tờ tùy thân (CCCD / Giấy khai sinh)
  if (rule.requiresIdentityDoc && candidate.hasIdDoc === false) {
    eligible = false;
    reasons.push('Nguồn lực này yêu cầu bắt buộc có giấy tờ tùy thân (CCCD/Giấy khai sinh).');
  }

  // 4. Kiểm tra giới hạn khu vực địa lý
  if (candidate.district && rule.geographicBoundaries.length > 0) {
    const isGlobal = rule.geographicBoundaries.some(
      (g) => g.toLowerCase().includes('toàn') || g === 'ALL'
    );
    if (!isGlobal && !rule.geographicBoundaries.includes(candidate.district)) {
      eligible = false;
      reasons.push(
        `Khu vực (${candidate.district}) nằm ngoài phạm vi phục vụ (${rule.geographicBoundaries.join(', ')}).`
      );
    }
  }

  if (eligible && reasons.length === 0) {
    reasons.push('Đủ điều kiện tiếp nhận nguồn lực an sinh.');
  }

  return { eligible, reasons };
}
