import { z } from 'zod';

export interface ImpactMetricParams {
  successfulReferrals: number;
  totalEligibleCases: number;
  targetThreshold?: number;
}

export interface SNSRResult {
  percentage: number;
  numerator: number;
  denominator: number;
  formula: string;
  unit: string;
  isTargetAchieved: boolean;
  evaluationLevel: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';
  description: string;
}

export interface ImpactSummaryData {
  totalCases: number;
  activeCases: number;
  totalEncounters: number;
  totalResources: number;
  verifiedResources: number;
  totalReferrals: number;
  successfulReferrals: number;
  safeguardingActions: number;
  snsr: SNSRResult;
  updatedAt: string;
}

export const ImpactMetricFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  organizationId: z.string().optional(),
  district: z.string().optional(),
});

export type ImpactMetricFilter = z.infer<typeof ImpactMetricFilterSchema>;

/**
 * Tính toán Chỉ số Tỷ lệ Chuyển tuyến Mạng lưới An toàn (SNSR - Safe Network Referral Rate)
 * Tiêu chuẩn UNESCO Youth Hackathon 2026:
 * - SNSR >= 85%: EXCELLENT (Mạng lưới an toàn vận hành cực kỳ hiệu quả)
 * - SNSR >= 70%: GOOD (Đạt chỉ số mục tiêu cơ bản)
 * - SNSR >= 50%: NEEDS_IMPROVEMENT (Cần mở rộng danh bạ nguồn lực)
 * - SNSR < 50%: CRITICAL (Cảnh báo nghẽn mạng lưới hỗ trợ)
 */
export function calculateSNSR(params: ImpactMetricParams): SNSRResult {
  const { successfulReferrals, totalEligibleCases, targetThreshold = 70.0 } = params;

  const validNumerator = Math.max(0, successfulReferrals);
  const validDenominator = Math.max(1, totalEligibleCases); // Tránh chia cho 0

  const rawPercentage = (validNumerator / validDenominator) * 100;
  const percentage = Number(rawPercentage.toFixed(1));

  let evaluationLevel: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';
  let description = '';

  if (percentage >= 85) {
    evaluationLevel = 'EXCELLENT';
    description = 'Mạng lưới chuyển tuyến an toàn đạt hiệu suất xuất sắc (>85%). Đối tượng được tiếp cận nguồn lực xác thực tốt.';
  } else if (percentage >= targetThreshold) {
    evaluationLevel = 'GOOD';
    description = 'Đạt chỉ số an toàn tối thiểu theo khung mục tiêu UNESCO.';
  } else if (percentage >= 50) {
    evaluationLevel = 'NEEDS_IMPROVEMENT';
    description = 'Tỷ lệ chuyển tuyến thành công cần cải thiện. Cần tăng cường đối tác an sinh xác thực.';
  } else {
    evaluationLevel = 'CRITICAL';
    description = 'Tỷ lệ kết nối quá thấp (<50%). Cần can thiệp hỗ trợ khẩn cấp.';
  }

  return {
    percentage,
    numerator: validNumerator,
    denominator: validDenominator,
    formula: 'SNSR (%) = (Verified & Consent-based Successful Referrals / Total Eligible Cases) * 100',
    unit: '%',
    isTargetAchieved: percentage >= targetThreshold,
    evaluationLevel,
    description,
  };
}

/**
 * Đánh giá sức khỏe tổng thể của hệ thống tác động xã hội
 */
export function evaluateImpactHealth(data: Partial<ImpactSummaryData>): {
  healthScore: number; // 0 - 100
  status: 'HEALTHY' | 'WARNING' | 'ALERT';
  recommendations: string[];
} {
  const recommendations: string[] = [];
  let healthScore = 100;

  const snsrPct = data.snsr?.percentage ?? 0;
  if (snsrPct < 50) {
    healthScore -= 30;
    recommendations.push('Tăng cường kết nối các nhà cung cấp dịch vụ an sinh (Y tế, Pháp lý, Mái ấm).');
  } else if (snsrPct < 70) {
    healthScore -= 15;
    recommendations.push('Tối ưu hóa quy trình duyệt hồ sơ chuyển tuyến.');
  }

  const totalRes = data.totalResources ?? 0;
  const verifiedRes = data.verifiedResources ?? 0;
  const verifiedRatio = totalRes > 0 ? (verifiedRes / totalRes) * 100 : 0;

  if (verifiedRatio < 80) {
    healthScore -= 20;
    recommendations.push('Rà soát và xác minh (Verification) lại các địa chỉ nguồn lực chưa kiểm định.');
  }

  if ((data.safeguardingActions ?? 0) > 0) {
    recommendations.push(`Đã ghi nhận ${data.safeguardingActions} hành động Safeguarding bảo vệ đối tượng yếu thế.`);
  }

  healthScore = Math.max(0, healthScore);

  let status: 'HEALTHY' | 'WARNING' | 'ALERT' = 'HEALTHY';
  if (healthScore < 60) {
    status = 'ALERT';
  } else if (healthScore < 85) {
    status = 'WARNING';
  }

  return {
    healthScore,
    status,
    recommendations,
  };
}
