/**
 * Derived, explainable signals for list screens. Every rule here is simple on purpose:
 * a volunteer must be able to see WHY a row is red.
 */
import type { CaseListItem, DirectoryResource, FollowUp, NeedCategory } from './types';
import type { Priority } from '../design/dashboard';
import { pathwayOf, type Pathway } from './pathway';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export type DueStatus = 'overdue' | 'soon' | 'on_time';

/** overdue = past due · soon = within 24h · on_time = later */
export function dueStatus(dueAt: string | null | undefined, now = Date.now()): DueStatus {
  if (!dueAt) return 'on_time';
  const t = new Date(dueAt).getTime();
  if (t < now) return 'overdue';
  if (t - now <= DAY) return 'soon';
  return 'on_time';
}

export function daysOverdue(dueAt: string, now = Date.now()) {
  return Math.max(0, Math.floor((now - new Date(dueAt).getTime()) / DAY));
}

/**
 * Priority, in plain rules:
 *  high   — safety hold (risk review / emergency), urgent flag, a child, or already overdue
 *  medium — due within 24h, or an older person (health can change fast)
 *  low    — everything else
 */
export function priorityOf(c: Pick<CaseListItem, 'urgency' | 'riskDecision' | 'isMinor' | 'age' | 'targetGroup'> | undefined, dueAt?: string | null): Priority {
  const status = dueStatus(dueAt);
  if (c && (c.riskDecision === 'HUMAN_REVIEW' || c.riskDecision === 'EMERGENCY_111' || c.urgency === 'urgent')) return 'high';
  if (c && pathwayOf(c) === 'child') return 'high';
  if (status === 'overdue') return 'high';
  if (status === 'soon') return 'medium';
  if (c && pathwayOf(c) === 'elderly') return 'medium';
  return 'low';
}

/** Journey stage → the 6 visible steps (Quan sát … Theo dõi). */
export function stepOfStage(stage: string): number {
  switch (stage) {
    case 'CONSENT':
      return 1;
    case 'UNDERSTAND':
      return 2;
    case 'RISK':
    case 'ESCALATED':
      return 3;
    case 'MATCH':
    case 'NEXT_STEP':
      return 4;
    case 'CONNECTED':
      return 5;
    case 'FOLLOW_UP':
    case 'CLOSED':
      return 6;
    default:
      return 1;
  }
}

export function isThisWeek(iso: string | null | undefined, now = new Date()) {
  if (!iso) return false;
  const d = new Date(iso);
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return d >= monday;
}

export function startOfWeekIso(now = new Date()) {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday.toISOString();
}

export function isToday(iso: string | null | undefined, now = new Date()) {
  return Boolean(iso) && new Date(iso as string).toDateString() === now.toDateString();
}

// ---------------------------------------------------------------------------
// Open questions for check-ins, by need and pathway.
// Open questions ("Tuần này … thế nào?") get real answers; "Có ổn không?" gets "ổn".
// ---------------------------------------------------------------------------

type Copy = { vi: string; en: string };

const BY_NEED: Partial<Record<NeedCategory, Copy[]>> = {
  employment: [
    { vi: 'Buổi thử việc/việc mới tuần này diễn ra thế nào?', en: 'How did the trial shift / new job go this week?' },
    { vi: 'Có ai đòi phí, giữ giấy tờ hay hứa lương cao bất thường không?', en: 'Has anyone asked for a fee, kept your papers or promised unusually high pay?' },
    { vi: 'Thu nhập tuần này so với lúc bán ngoài đường ra sao?', en: 'How does this week’s income compare with street selling?' },
  ],
  training: [
    { vi: 'Lịch học có khớp với giờ đi bán/đi làm không?', en: 'Does the class schedule fit your working hours?' },
    { vi: 'Phần nào trong khoá học thấy khó nhất?', en: 'Which part of the course is hardest?' },
  ],
  health: [
    { vi: 'Từ lần khám trước, sức khoẻ thay đổi thế nào?', en: 'How has your health changed since the last visit?' },
    { vi: 'Thuốc có đủ dùng và có tiền mua tiếp không?', en: 'Do you have enough medicine, and money for more?' },
  ],
  documents: [
    { vi: 'Hồ sơ giấy tờ đang vướng ở bước nào?', en: 'Where is the paperwork stuck?' },
    { vi: 'Có ai giữ hộ CCCD hay giấy tờ gốc của mình không?', en: 'Is anyone holding your ID or original papers?' },
  ],
  shelter: [
    { vi: 'Tối qua ngủ ở đâu, có thấy an toàn không?', en: 'Where did you sleep last night — did it feel safe?' },
    { vi: 'Chỗ ở hiện tại còn ở được bao lâu?', en: 'How long can you stay where you are now?' },
  ],
  social_assistance: [
    { vi: 'Khoản trợ cấp/hỗ trợ đã nhận được chưa? Còn vướng gì?', en: 'Has the allowance arrived? What is still blocking it?' },
  ],
  legal: [
    { vi: 'Sau buổi tư vấn, bước tiếp theo mình cần làm là gì?', en: 'After the legal advice, what is your next step?' },
  ],
  food: [{ vi: 'Tuần này có bữa nào phải nhịn không?', en: 'Did you skip any meals this week?' }],
};

const BY_PATHWAY: Record<Pathway, Copy[]> = {
  child: [
    { vi: 'Tuần này em đi học được mấy buổi? Có gì làm em ngại đến lớp không?', en: 'How many school days this week? Anything making you avoid class?' },
    { vi: 'Có ai bắt em đi bán hoặc giữ tiền của em không?', en: 'Is anyone making you sell or keeping your money?' },
    { vi: 'Người lớn nào em tin tưởng nhất lúc này?', en: 'Which adult do you trust most right now?' },
  ],
  elderly: [
    { vi: 'Mấy hôm nay cô/chú ăn uống, ngủ nghỉ thế nào?', en: 'How have you been eating and sleeping these days?' },
    { vi: 'Có cần người đi cùng khi đến phường hay trạm y tế không?', en: 'Would you like someone to go with you to the ward office or clinic?' },
  ],
  adult: [{ vi: 'Điều gì đang làm mình lo nhất tuần này?', en: 'What worries you most this week?' }],
};

export function checkInQuestions(need: NeedCategory | null | undefined, pathway: Pathway, n = 3): Copy[] {
  // Children never get employment questions, whatever the recorded need.
  const needQs = need && !(pathway === 'child' && need === 'employment') ? BY_NEED[need] ?? [] : [];
  const out: Copy[] = [];
  // Children and older people: safety / wellbeing first. Adults: the concrete step they are working on first.
  const order = pathway === 'adult' ? [...needQs, ...BY_PATHWAY.adult] : [...BY_PATHWAY[pathway].slice(0, 1), ...needQs, ...BY_PATHWAY[pathway].slice(1)];
  for (const q of order) {
    if (out.length >= n) break;
    if (!out.includes(q)) out.push(q);
  }
  return out;
}

/** Index cases by id for joining follow-ups / referrals to case details. */
export function byCaseId(cases: CaseListItem[] | undefined) {
  return new Map((cases ?? []).map((c) => [c.id, c]));
}

export function lastDoneFor(caseId: string, done: FollowUp[] | undefined) {
  return (done ?? []).filter((f) => f.caseId === caseId).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))[0];
}

/**
 * Quick "likely partner" hint for list screens: a verified, accepting service for this need that
 * serves the district. The real decision always goes through the match pipeline on the match screen.
 */
export function likelyPartner(c: Pick<CaseListItem, 'need' | 'district' | 'isMinor' | 'age' | 'targetGroup'>, directory: DirectoryResource[] | undefined): DirectoryResource | undefined {
  if (!c.need) return undefined;
  if (pathwayOf(c) === 'child' && c.need === 'employment') return undefined;
  const ok = (directory ?? []).filter((d) => d.category === c.need && d.freshness === 'VERIFIED' && d.capacityStatus !== 'FULL' && !d.availability?.paused);
  const local = ok.find((d) => d.district === c.district || d.serviceArea?.includes(c.district ?? '') || d.serviceArea?.some((a) => /toàn/i.test(a)));
  return local ?? ok[0];
}
