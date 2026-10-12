export interface SafeNextStepParams {
  totalFollowUps: number;
  completedFollowUps: number;
  safeguardingViolations?: number;
  anonymizedCasesCount?: number;
  totalCasesWithMinor?: number;
}

export interface SafeNextStepResult {
  completionRate: number; // %
  safeguardingComplianceRate: number; // %
  privacyProtectionScore: number; // 0-100
  safeNextStepScore: number; // Overall 0-100
  isSafeToProceed: boolean;
  securityRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  insights: string[];
}

/**
 * Đo lường chỉ số Bước tiếp theo an toàn (SafeNextStep Metric)
 * Đảm bảo các can thiệp sau tiếp xúc (Follow-ups) vừa hoàn thành tiến độ
 * vừa tuân thủ tuyệt đối quy tắc Bảo vệ trẻ em (Child Safeguarding) & Bảo mật dữ liệu cá nhân.
 */
export function calculateSafeNextStep(params: SafeNextStepParams): SafeNextStepResult {
  const {
    totalFollowUps,
    completedFollowUps,
    safeguardingViolations = 0,
    anonymizedCasesCount = 0,
    totalCasesWithMinor = 0,
  } = params;

  const validTotal = Math.max(0, totalFollowUps);
  const validCompleted = Math.max(0, completedFollowUps);

  const completionRate = validTotal > 0
    ? Number(((validCompleted / validTotal) * 100).toFixed(1))
    : 100;

  // Tiêu chí Bảo vệ an toàn: Mỗi violation giảm 25% điểm compliance
  const safeguardingComplianceRate = Math.max(
    0,
    Number((100 - safeguardingViolations * 25).toFixed(1))
  );

  // Điểm bảo vệ riêng tư: Tỷ lệ trẻ em được mã hóa danh tính/alias CHILD-2026
  let privacyProtectionScore = 100;
  if (totalCasesWithMinor > 0) {
    privacyProtectionScore = Number(
      Math.min(100, (anonymizedCasesCount / totalCasesWithMinor) * 100).toFixed(1)
    );
  }

  // Điểm tổng hợp SafeNextStep Score (Trọng số: 40% Completion, 40% Safeguarding Compliance, 20% Privacy)
  const safeNextStepScore = Number(
    (completionRate * 0.4 + safeguardingComplianceRate * 0.4 + privacyProtectionScore * 0.2).toFixed(1)
  );

  const insights: string[] = [];

  let securityRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

  if (safeguardingViolations > 0) {
    securityRiskLevel = safeguardingViolations >= 3 ? 'CRITICAL' : 'HIGH';
    insights.push(`Phát hiện ${safeguardingViolations} rủi ro/vi phạm quy định Bảo vệ Trẻ em (Safeguarding Flag).`);
  } else if (privacyProtectionScore < 90) {
    securityRiskLevel = 'MEDIUM';
    insights.push('Một số hồ sơ vị thành niên chưa áp dụng mã hóa alias bảo vệ danh tính tuyệt đối.');
  } else {
    insights.push('Toàn bộ các bước tiếp theo tuân thủ quy chuẩn an toàn và bảo mật dữ liệu.');
  }

  if (completionRate < 60) {
    insights.push('Tỷ lệ hoàn thành nhiệm vụ theo dõi (Follow-up) còn thấp. Cần nhắc nhở Tình nguyện viên.');
  }

  return {
    completionRate,
    safeguardingComplianceRate,
    privacyProtectionScore,
    safeNextStepScore,
    isSafeToProceed: safeguardingViolations === 0 && safeNextStepScore >= 70,
    securityRiskLevel,
    insights,
  };
}
