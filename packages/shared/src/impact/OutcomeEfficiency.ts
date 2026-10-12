export interface OutcomeEfficiencyParams {
  totalPassports: number;
  placedJobsCount: number;
  completedTrainingsCount: number;
  emergencyAidResolvedCount: number;
  medicalCareResolvedCount: number;
}

export interface OutcomeEfficiencyResult {
  totalInterventions: number;
  overallEfficiencyRate: number; // %
  categoryBreakdown: {
    jobPlacementRate: number; // %
    trainingCompletionRate: number; // %
    emergencyResolutionRate: number; // %
    medicalResolutionRate: number; // %
  };
  impactMultiplier: number; // Hệ số tác động xã hội (e.g. 1.8x)
  status: 'OPTIMAL' | 'MODERATE' | 'UNDERPERFORMING';
  summaryText: string;
}

/**
 * Tính toán Hiệu quả Kết quả Sinh kế & An sinh Xã hội (Outcome Efficiency)
 * Đánh giá tỷ lệ đối tượng thoát khỏi trạng thái yếu thế thông qua các cơ hội thực tế
 * (Hộ chiếu sinh kế ➔ Đào tạo / Đào tạo ➔ Việc làm ngắn hạn / Can thiệp an sinh khẩn cấp)
 */
export function calculateOutcomeEfficiency(params: OutcomeEfficiencyParams): OutcomeEfficiencyResult {
  const {
    totalPassports,
    placedJobsCount,
    completedTrainingsCount,
    emergencyAidResolvedCount,
    medicalCareResolvedCount,
  } = params;

  const validPassports = Math.max(1, totalPassports); // Tránh chia cho 0

  const totalSuccessfulInterventions =
    placedJobsCount + completedTrainingsCount + emergencyAidResolvedCount + medicalCareResolvedCount;

  const overallEfficiencyRate = Number(
    ((totalSuccessfulInterventions / validPassports) * 100).toFixed(1)
  );

  const jobPlacementRate = Number(((placedJobsCount / validPassports) * 100).toFixed(1));
  const trainingCompletionRate = Number(((completedTrainingsCount / validPassports) * 100).toFixed(1));
  const emergencyResolutionRate = Number(((emergencyAidResolvedCount / validPassports) * 100).toFixed(1));
  const medicalResolutionRate = Number(((medicalCareResolvedCount / validPassports) * 100).toFixed(1));

  // Tính hệ số tác động xã hội (Impact Multiplier) dựa trên trọng số chuyển đổi tích cực
  // Việc làm (weight 2.5), Đào tạo (weight 1.8), Y tế/Cứu trợ (weight 1.2)
  const weightedScore =
    placedJobsCount * 2.5 +
    completedTrainingsCount * 1.8 +
    (emergencyAidResolvedCount + medicalCareResolvedCount) * 1.2;

  const impactMultiplier = Number((1 + weightedScore / (validPassports * 2)).toFixed(2));

  let status: 'OPTIMAL' | 'MODERATE' | 'UNDERPERFORMING' = 'OPTIMAL';
  if (overallEfficiencyRate < 40) {
    status = 'UNDERPERFORMING';
  } else if (overallEfficiencyRate < 70) {
    status = 'MODERATE';
  }

  const summaryText = `Đã tạo ra ${totalSuccessfulInterventions} can thiệp an sinh thành công từ ${validPassports} Hộ chiếu sinh kế. Tỷ lệ hiệu quả tổng thể đạt ${overallEfficiencyRate}% với hệ số tác động ${impactMultiplier}x.`;

  return {
    totalInterventions: totalSuccessfulInterventions,
    overallEfficiencyRate,
    categoryBreakdown: {
      jobPlacementRate,
      trainingCompletionRate,
      emergencyResolutionRate,
      medicalResolutionRate,
    },
    impactMultiplier,
    status,
    summaryText,
  };
}
