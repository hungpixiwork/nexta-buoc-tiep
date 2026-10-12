import { MatchRequest } from './MatchRequest.js';
import { ResourceCandidate, ResourceCandidateType } from './ResourceCandidate.js';

export interface MatchScoreBreakdown {
  skillScore: number;
  locationScore: number;
  urgencyScore: number;
  ageFitScore: number;
  verificationScore?: number;
}

export interface MatchResult {
  candidate: ResourceCandidate;
  score: number;
  passedSafeguard: boolean;
  matchReasons: string[];
  rejectionReason?: string;
  scoreBreakdown: MatchScoreBreakdown;
  rank: number;
}

export interface MatchingPolicyConfig {
  minScoreThreshold?: number;
  strictLocationMatch?: boolean;
  blockStaleResources?: boolean;
}

export class MatchingPolicy {
  private config: Required<MatchingPolicyConfig>;

  constructor(config: MatchingPolicyConfig = {}) {
    this.config = {
      minScoreThreshold: config.minScoreThreshold ?? 30,
      strictLocationMatch: config.strictLocationMatch ?? false,
      blockStaleResources: config.blockStaleResources ?? true,
    };
  }

  /**
   * Đánh giá và sắp xếp danh sách các Resource Candidates cho một MatchRequest.
   * Thuật toán Khớp nối Định hình (Deterministic Scoring & Safeguarding Rules).
   */
  public evaluateCandidates(
    request: MatchRequest,
    candidates: ResourceCandidate[]
  ): MatchResult[] {
    const results: MatchResult[] = [];

    for (const candidate of candidates) {
      const evaluation = this.evaluateSingleCandidate(request, candidate);
      results.push(evaluation);
    }

    // Lọc ra các kết quả thỏa mãn Safeguard và có score >= minScoreThreshold, sắp xếp giảm dần
    const validMatches = results
      .filter((r) => r.passedSafeguard && r.score >= this.config.minScoreThreshold)
      .sort((a, b) => b.score - a.score);

    // Gán thứ hạng Rank
    return validMatches.map((res, index) => ({
      ...res,
      rank: index + 1,
    }));
  }

  /**
   * Đánh giá chi tiết 1 Candidate cho MatchRequest
   */
  public evaluateSingleCandidate(
    request: MatchRequest,
    candidate: ResourceCandidate
  ): MatchResult {
    const matchReasons: string[] = [];

    // -------------------------------------------------------------
    // HARD RULES (SAFEGUARDING & INVARIANTS)
    // -------------------------------------------------------------

    // Rule 1: Trẻ em (< 18t) KHÔNG ĐƯỢC khớp với JOB độc hại hoặc dành cho adult
    if (request.isMinor || request.age < 18) {
      if (candidate.type === 'JOB') {
        if (candidate.isHazardousWork || candidate.ageMin >= 18) {
          return this.createRejectedResult(
            candidate,
            'SAFEGUARD_BLOCKED: Trẻ em dưới 18 tuổi tuyệt đối không khớp nối công việc độc hại hoặc công việc dành cho người trưởng thành.'
          );
        }
      }
    }

    // Rule 2: Kiểm tra Trạng thái Hoạt động (Active) & Slot tiếp nhận
    if (!candidate.isActive) {
      return this.createRejectedResult(
        candidate,
        'INACTIVE_CANDIDATE: Nguồn lực hiện đang tạm ngưng tiếp nhận.'
      );
    }

    if (candidate.availableSlots <= 0) {
      return this.createRejectedResult(
        candidate,
        'NO_CAPACITY: Nguồn lực đã hết chỉ tiêu/hết chỗ tiếp nhận.'
      );
    }

    // Rule 3: Kiểm tra Trạng thái Thẩm định Nguồn lực (Resource Freshness Invariant)
    if (this.config.blockStaleResources) {
      const isStale = candidate.verificationStatus === 'STALE' || candidate.verificationStatus === 'UNAVAILABLE';
      let isExpired = false;
      if (candidate.verificationExpiresAt) {
        isExpired = new Date(candidate.verificationExpiresAt).getTime() < Date.now();
      }
      if (isStale || isExpired) {
        return this.createRejectedResult(
          candidate,
          'STALE_RESOURCE: Nguồn lực đã quá hạn tái thẩm định (>30 ngày). Bắt buộc phải được Điều phối viên thẩm định lại trước khi giới thiệu.'
        );
      }
    }

    // Rule 4: Khớp loại Nhu cầu (Priority Need vs Candidate Type)
    const isCategoryCompatible = this.checkCategoryCompatibility(
      request.priorityNeed,
      candidate.type
    );
    if (!isCategoryCompatible) {
      return this.createRejectedResult(
        candidate,
        `CATEGORY_MISMATCH: Loại nguồn lực ${candidate.type} không tương thích với nhu cầu ưu tiên '${request.priorityNeed}'.`
      );
    }

    // -------------------------------------------------------------
    // SOFT RULES & SCORING (Max 100 điểm)
    // -------------------------------------------------------------

    // 1. Skill Score (Max 30đ)
    let skillScore = 0;
    if (!candidate.requiredSkills || candidate.requiredSkills.length === 0) {
      skillScore = 30;
      matchReasons.push('Không yêu cầu kỹ năng đặc thù');
    } else {
      const reqSkillsLower = candidate.requiredSkills.map((s) => s.toLowerCase());
      const reqUserSkillsLower = (request.skills || []).map((s) => s.toLowerCase());

      const matchedSkills = reqSkillsLower.filter((sk) =>
        reqUserSkillsLower.some((usk) => usk.includes(sk) || sk.includes(usk))
      );

      const ratio = matchedSkills.length / candidate.requiredSkills.length;
      skillScore = Math.round(ratio * 30);
      if (matchedSkills.length > 0) {
        matchReasons.push(`Khớp ${matchedSkills.length}/${candidate.requiredSkills.length} kỹ năng yêu cầu`);
      }
    }

    // 2. Location Score (Max 25đ)
    let locationScore = 0;
    const reqLoc = request.preferredDistrict.toLowerCase().trim();
    const candLoc = candidate.district.toLowerCase().trim();

    if (candLoc === reqLoc || candLoc.includes(reqLoc) || reqLoc.includes(candLoc)) {
      locationScore = 25;
      matchReasons.push(`Cùng địa bàn (${candidate.district})`);
    } else {
      if (this.config.strictLocationMatch) {
        return this.createRejectedResult(
          candidate,
          `LOCATION_MISMATCH: Khác địa bàn yêu cầu trong chế độ khớp nối nghiêm ngặt.`
        );
      }
      locationScore = 10;
      matchReasons.push(`Khác địa bàn (${candidate.district} so với ${request.preferredDistrict})`);
    }

    // 3. Urgency Score (Max 25đ)
    let urgencyScore = 0;
    if (request.urgency === 'CRITICAL' || request.urgency === 'HIGH') {
      if (candidate.urgencySupported) {
        urgencyScore = 25;
        matchReasons.push('Hỗ trợ tiếp nhận cứu trợ khẩn cấp');
      } else {
        urgencyScore = 10;
        matchReasons.push('Nguồn lực tiếp nhận theo quy trình thường');
      }
    } else {
      urgencyScore = 20;
    }

    // 4. Age Fit Score (Max 20đ)
    let ageFitScore = 0;
    if (request.age >= candidate.ageMin && request.age <= candidate.ageMax) {
      ageFitScore = 20;
      matchReasons.push(`Độ tuổi (${request.age}t) phù hợp khung [${candidate.ageMin}-${candidate.ageMax}]`);
    } else {
      ageFitScore = 5;
    }

    const totalScore = Math.min(100, skillScore + locationScore + urgencyScore + ageFitScore);

    return {
      candidate,
      score: totalScore,
      passedSafeguard: true,
      matchReasons,
      scoreBreakdown: {
        skillScore,
        locationScore,
        urgencyScore,
        ageFitScore,
      },
      rank: 0,
    };
  }

  private checkCategoryCompatibility(
    need: string,
    candidateType: ResourceCandidateType
  ): boolean {
    switch (need) {
      case 'job':
        return candidateType === 'JOB' || candidateType === 'TRAINING';
      case 'edu':
        return candidateType === 'TRAINING' || candidateType === 'JOB';
      case 'safe':
        return candidateType === 'SHELTER' || candidateType === 'EMERGENCY_AID';
      case 'health':
        return candidateType === 'MEDICAL_CARE' || candidateType === 'EMERGENCY_AID';
      case 'protect':
      case 'papers':
        return candidateType === 'LEGAL_HELP' || candidateType === 'EMERGENCY_AID';
      case 'expert':
        return true;
      default:
        return true;
    }
  }

  private createRejectedResult(
    candidate: ResourceCandidate,
    reason: string
  ): MatchResult {
    return {
      candidate,
      score: 0,
      passedSafeguard: false,
      matchReasons: [],
      rejectionReason: reason,
      scoreBreakdown: {
        skillScore: 0,
        locationScore: 0,
        urgencyScore: 0,
        ageFitScore: 0,
      },
      rank: 0,
    };
  }
}
