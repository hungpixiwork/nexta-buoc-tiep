/**
 * Gọi đúng nơi phụ trách tình huống — không phải lúc nào cũng 111.
 * 111 là tổng đài BẢO VỆ TRẺ EM: chỉ gợi ý khi có trẻ dưới 18 tuổi. Người lớn/người cao tuổi
 * được gợi ý 113/115 và các đường dây chuyên biệt khớp với cờ an toàn.
 * Số điện thoại lấy từ danh bạ đã kiểm chứng của web (`SUPPORT_CONTACTS`, có nguồn).
 */
import { COORDINATOR_LINE, SUPPORT_CONTACTS, type SupportContact } from '@web/lib/supportContacts';

export type Pathway = 'child' | 'elderly' | 'adult';

export interface Situation {
  pathway?: Pathway | null;
  /** Mã cờ an toàn (RiskGate / người đồng hành đánh dấu), VD 'MEDICAL_EMERGENCY'. */
  flags?: string[];
  riskDecision?: 'PROCEED' | 'ASK_MORE' | 'HUMAN_REVIEW' | 'EMERGENCY_111' | null;
}

export interface RoutedContact {
  contact: SupportContact;
  /** Là số nên gọi trước cho tình huống này. */
  recommended: boolean;
}

/** Đường dây điều phối viên trực của điểm pilot, dạng SupportContact (null nếu chưa cấu hình). */
export function coordinatorContact(line: string | null = COORDINATOR_LINE): SupportContact | null {
  if (!line) return null;
  return {
    id: 'ours-coordinator',
    group: 'ours',
    name: { vi: 'Điều phối viên trực', en: 'On-duty coordinator' },
    when: { vi: 'Chưa rõ nên chuyển đi đâu, cần người quyết định cùng', en: 'Unsure where to refer, need a second decision-maker' },
    number: line,
    free: false,
    allDay: false,
  };
}

const byId = (id: string) => SUPPORT_CONTACTS.find((c) => c.id === id);

/** Không có ngữ cảnh: đủ các nhóm theo thứ tự như menu "Gọi hỗ trợ" của web. */
function allGrouped(coordinator: SupportContact | null): RoutedContact[] {
  const order = ['emergency', 'child', 'specialist'] as const;
  const list = order.flatMap((g) => SUPPORT_CONTACTS.filter((c) => c.group === g));
  return [...(coordinator ? [coordinator] : []), ...list].map((contact) => ({ contact, recommended: false }));
}

/**
 * Danh sách số theo tình huống, số đầu tiên (recommended) là số nên gọi trước.
 * Không truyền situation → trả đủ danh bạ theo nhóm, không gợi ý số nào.
 */
export function contactsFor(situation?: Situation | null, coordinatorLine: string | null = COORDINATOR_LINE): RoutedContact[] {
  const coordinator = coordinatorContact(coordinatorLine);
  if (!situation) return allGrouped(coordinator);

  const flags = new Set(situation.flags ?? []);
  const child = situation.pathway === 'child' || flags.has('CHILD_PRESENT');
  const ids: string[] = [];
  const add = (id: string) => !ids.includes(id) && byId(id) && ids.push(id);

  // 1. Nguy hiểm tính mạng trước tiên.
  if (flags.has('MEDICAL_EMERGENCY')) add('emergency-115');
  if (flags.has('SELF_HARM')) {
    add('mental-ngay-mai');
    add('emergency-115');
  }
  // 2. Trẻ em → 111 (bạo lực, bóc lột, mua bán trẻ em đều thuộc 111).
  if (child) add('child-111');
  if (flags.has('VIOLENCE_OR_ABUSE')) {
    add('emergency-113');
    add('gbv-peace-house');
  }
  if (flags.has('EXPLOITATION_OR_TRAFFICKING')) add('emergency-113');
  if (flags.has('SCAM_PATTERN') || flags.has('IMPERSONATION_PATTERN')) add('scam-156');
  // 3. Luôn còn đường gọi khi nguy hiểm tức thời.
  add('emergency-113');
  add('emergency-115');

  const routed = ids.map((id) => byId(id)!);
  const hasSpecificMatch = flags.size > 0 || child || situation.riskDecision === 'EMERGENCY_111';
  // Điều phối viên trực đứng đầu khi không có dấu hiệu cụ thể (họ biết ca và biết đơn vị hỗ trợ);
  // khi có dấu hiệu nguy hiểm, số chuyên trách đứng đầu, điều phối viên ngay sau.
  const ordered = coordinator ? (hasSpecificMatch ? [routed[0], coordinator, ...routed.slice(1)] : [coordinator, ...routed]) : routed;
  return ordered.map((contact, i) => ({ contact, recommended: i === 0 }));
}

/** Có cần hiện nút gọi ở trạng thái nổi bật (đỏ) không — chỉ khi khẩn cấp thật. */
export function isUrgent(situation?: Situation | null): boolean {
  if (!situation) return false;
  const flags = new Set(situation.flags ?? []);
  return situation.riskDecision === 'EMERGENCY_111' || flags.has('MEDICAL_EMERGENCY') || flags.has('SELF_HARM');
}

/** Lấy mã cờ từ chuỗi lý do "MÃ bằng chứng; MÃ …" của escalation. */
export function flagsFromReason(reason: string): string[] {
  return reason
    .split(/;\s*/)
    .map((p) => p.match(/^([A-Z][A-Z0-9_]{2,})\b/)?.[1])
    .filter((x): x is string => Boolean(x));
}
