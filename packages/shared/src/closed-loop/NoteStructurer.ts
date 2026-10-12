/**
 * NoteStructurer — turns a fragmented field note into SUGGESTED structure.
 *
 * Output is always a suggestion (provenance AI_SUGGESTED) that the Navigator
 * accepts, edits or discards. It never writes to the case on its own.
 * Deterministic keyword rules run everywhere (offline, no model); the API may
 * merge an LLM suggestion on top, still labelled as a suggestion.
 */
import { foldVietnamese, extractAgesFromText } from './RiskGate';
import type { NeedCategory } from './MatchPipeline';

export interface NoteSuggestion {
  need: NeedCategory | null;
  needCandidates: Array<{ need: NeedCategory; hits: string[] }>;
  district: 'Hóc Môn' | 'Quận 12' | null;
  ward: string | null;
  age: number | null;
  strengths: string[];
  constraints: { daytimeOnly: boolean; weekendOnly: boolean };
  urgency: 'normal' | 'urgent';
  method: 'rules';
}

const NEED_WORDS: Record<Exclude<NeedCategory, 'emergency'>, string[]> = {
  employment: ['việc làm', 'tìm việc', 'mất việc', 'thất nghiệp', 'xin việc', 'công việc ổn định', 'thu nhập ổn định', 'làm thuê'],
  training: ['học nghề', 'học may', 'đào tạo', 'khóa học', 'học chữ'],
  health: ['bệnh', 'đau', 'khám', 'thuốc', 'ốm', 'sốt', 'thai', 'tiểu đường', 'huyết áp'],
  legal: ['pháp lý', 'kiện', 'tranh chấp', 'luật sư', 'bị lừa tiền', 'nợ nần'],
  documents: ['giấy tờ', 'căn cước', 'cccd', 'khai sinh', 'tạm trú', 'hộ khẩu', 'cư trú', 'mất giấy'],
  shelter: ['chỗ ở', 'chỗ ngủ', 'tiền trọ', 'nhà trọ', 'vô gia cư', 'bị đuổi'],
  food: ['đói', 'thiếu ăn', 'gạo', 'bữa ăn', 'không có gì ăn'],
  social_assistance: ['trợ cấp', 'tâm lý', 'buồn chán', 'khủng hoảng', 'hỗ trợ xã hội'],
};

const STRENGTH_WORDS = [
  'nấu ăn',
  'phụ bếp',
  'may',
  'bán hàng',
  'lái xe',
  'chăm sóc người già',
  'giữ trẻ',
  'dọn dẹp',
  'sửa xe',
  'tin học',
  'làm vườn',
  'thợ hồ',
];

const HOC_MON_AREAS = ['hóc môn', 'bà điểm', 'xuân thới sơn', 'đông thạnh', 'tân xuân', 'thới tam thôn'];
const Q12_AREAS = ['quận 12', 'q12', 'q.12', 'đông hưng thuận', 'trung mỹ tây', 'tân thới hiệp', 'thới an', 'an phú đông', 'tân chánh hiệp'];

function hitsIn(folded: string, words: string[]): string[] {
  return words.filter((w) => folded.includes(foldVietnamese(w)));
}

export function suggestFromNote(text: string): NoteSuggestion {
  const folded = foldVietnamese(text ?? '');

  const needCandidates = (Object.keys(NEED_WORDS) as Array<keyof typeof NEED_WORDS>)
    .map((need) => ({ need: need as NeedCategory, hits: hitsIn(folded, NEED_WORDS[need]) }))
    .filter((c) => c.hits.length > 0)
    .sort((a, b) => b.hits.length - a.hits.length);

  const hm = hitsIn(folded, HOC_MON_AREAS);
  const q12 = hitsIn(folded, Q12_AREAS);
  const district = hm.length > q12.length ? 'Hóc Môn' : q12.length > 0 ? 'Quận 12' : null;
  const wardHit = [...hm, ...q12].find((w) => !['hóc môn', 'quận 12', 'q12', 'q.12'].includes(w)) ?? null;

  const ages = extractAgesFromText(text ?? '');

  return {
    need: needCandidates[0]?.need ?? null,
    needCandidates,
    district,
    ward: wardHit ? wardHit.replace(/(^|\s)\S/g, (s) => s.toUpperCase()) : null,
    age: ages[0] ?? null,
    strengths: hitsIn(folded, STRENGTH_WORDS),
    constraints: {
      daytimeOnly: hitsIn(folded, ['ban ngày', 'không làm đêm', 'không làm ca đêm', 'đưa đón con']).length > 0,
      weekendOnly: hitsIn(folded, ['chỉ cuối tuần', 'thứ bảy chủ nhật']).length > 0,
    },
    urgency: hitsIn(folded, ['gấp', 'khẩn', 'ngay hôm nay', 'tối nay']).length > 0 ? 'urgent' : 'normal',
    method: 'rules',
  };
}
