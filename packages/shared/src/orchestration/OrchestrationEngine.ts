/**
 * NEXTA Domain Orchestration Engine
 * Pure business logic for Case Orchestration, Deterministic Routing, Task Assignment Ranking & Human Outcomes
 */

export interface PersonRecord {
  id: string;
  publicCode: string;
  fullName: string;
  avatarUrl?: string;
  role: 'volunteer' | 'navigator' | 'coordinator' | 'supervisor' | 'organisation_member' | 'admin';
  organizationId?: string;
  teamId?: string;
  status: 'active' | 'busy' | 'on_leave' | 'inactive';
  capabilities: string[]; // e.g. ['medical_escort', 'youth_work', 'legal_aid', 'field_survey']
  serviceAreas: string[]; // e.g. ['Hóc Môn', 'Quận 12', 'Bình Chánh']
  maxActiveCases: number;
  activeCaseCount: number;
  verifiedAt?: string;
}

export interface SupportGatewayRecord {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  organizationId?: string;
  serviceType?: string;
  eligibilitySummary?: string;
  jurisdiction: string;
  geographicCoverage: string[];
  channel: string;
  verificationStatus: 'VERIFIED' | 'NEEDS_RECHECK' | 'UNVERIFIED' | 'STALE';
  status: 'AVAILABLE' | 'LIMITED' | 'FULL' | 'PAUSED';
  isDemo?: boolean;
  confidence: number;
}

export interface RankedAssignee {
  person: PersonRecord;
  score: number;
  matchReasons: string[];
  isRecommended: boolean;
}

/**
 * Ranks potential assignees deterministically based on capability, district, and current workload.
 */
export function rankAssignees(
  candidates: PersonRecord[],
  requiredArea?: string,
  requiredCapability?: string,
  targetRole: string = 'volunteer'
): RankedAssignee[] {
  return candidates
    .filter(p => p.status !== 'inactive' && p.status !== 'on_leave')
    .map(person => {
      let score = 50; // base score
      const matchReasons: string[] = [];

      // 1. Role suitability
      if (person.role === targetRole || (targetRole === 'volunteer' && person.role === 'navigator')) {
        score += 20;
        matchReasons.push('Vai trò phù hợp');
      }

      // 2. Geographic area proximity
      if (requiredArea && person.serviceAreas?.some(area => requiredArea.toLowerCase().includes(area.toLowerCase()) || area.toLowerCase().includes(requiredArea.toLowerCase()))) {
        score += 25;
        matchReasons.push(`Phụ trách địa bàn ${requiredArea}`);
      }

      // 3. Capability match
      if (requiredCapability && person.capabilities?.includes(requiredCapability)) {
        score += 20;
        matchReasons.push(`Có kỹ năng chuyên trách: ${requiredCapability}`);
      }

      // 4. Workload penalty (favor lower active cases)
      const loadRatio = person.activeCaseCount / (person.maxActiveCases || 5);
      if (loadRatio < 0.5) {
        score += 15;
        matchReasons.push('Khối lượng ca nhẹ (sẵn sàng tiếp nhận)');
      } else if (loadRatio >= 1.0) {
        score -= 30;
        matchReasons.push('Đã đạt ngưỡng ca tối đa');
      }

      return {
        person,
        score: Math.max(0, Math.min(100, score)),
        matchReasons,
        isRecommended: score >= 75
      };
    })
    .sort((a, b) => b.score - a.score);
}

export interface EscalationAlert {
  level: 'SUPERVISOR' | 'HOTLINE_111' | 'COORDINATOR_ALERT';
  reason: string;
  actionRequired: string;
  isUrgent: boolean;
}

/**
 * Evaluates operational escalation triggers
 */
export function evaluateEscalationTriggers(
  caseRecord: { isMinor?: boolean; priority?: string; riskLevel?: string },
  referralStatus?: string,
  followUpResult?: string,
  hoursSinceReferralSent?: number
): EscalationAlert[] {
  const alerts: EscalationAlert[] = [];

  // Rule 0: Minor Child Safeguarding Invariant
  if (caseRecord.isMinor || caseRecord.riskLevel === 'CRITICAL' || caseRecord.priority === 'urgent') {
    alerts.push({
      level: 'SUPERVISOR',
      reason: 'Ca bảo vệ trẻ em / đối tượng nguy cơ khẩn cấp (P0)',
      actionRequired: 'Điều phối ngay đến Cán bộ Bảo trợ Trẻ em và tổng đài 111',
      isUrgent: true
    });
  }

  // SLA Overdue Trigger (>24h without acceptance)
  if (referralStatus === 'sent' && hoursSinceReferralSent && hoursSinceReferralSent > 24) {
    alerts.push({
      level: 'COORDINATOR_ALERT',
      reason: `Chuyển tuyến chưa được cơ sở tiếp nhận sau ${hoursSinceReferralSent} giờ`,
      actionRequired: 'Liên hệ hotline trực tiếp hoặc tìm điểm hỗ trợ thay thế',
      isUrgent: false
    });
  }

  // Worsening health / situation on follow-up
  if (followUpResult === 'WORSE' || followUpResult === 'HARDER') {
    alerts.push({
      level: 'COORDINATOR_ALERT',
      reason: 'Phản hồi hỏi thăm: Tình trạng của người được hỗ trợ diễn biến xấu hơn',
      actionRequired: 'Tái thẩm định nhu cầu và lập Bước Tiếp An Sinh khẩn cấp',
      isUrgent: true
    });
  }

  return alerts;
}

export interface HumanImpactSummary {
  peopleListenedTo: number;
  safeNextStepsCreated: number;
  peopleConnected: number;
  followUpsCompleted: number;
  improvedOutcomes: number;
  stillOnJourney: number;
  satisfactionRatePercent: number;
}

/**
 * Computes authentic human-centered impact numbers from real query results
 */
export function computeHumanImpactSummary(
  totalCases: number,
  snsCount: number,
  acceptedReferralsCount: number,
  followUpsCount: number,
  improvedCount: number
): HumanImpactSummary {
  const stillOnJourney = Math.max(0, totalCases - improvedCount);
  const satisfactionRatePercent = followUpsCount > 0
    ? Math.round((improvedCount / followUpsCount) * 100)
    : 0;

  return {
    peopleListenedTo: totalCases,
    safeNextStepsCreated: snsCount,
    peopleConnected: acceptedReferralsCount,
    followUpsCompleted: followUpsCount,
    improvedOutcomes: improvedCount,
    stillOnJourney,
    satisfactionRatePercent
  };
}
