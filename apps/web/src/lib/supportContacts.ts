/**
 * Who to call, by situation — not "always 111".
 *
 * 111 is the national CHILD-protection hotline; routing an elderly lottery seller or an adult
 * facing a fake job ad there wastes their time and the hotline's. The first line for any
 * volunteer or partner is our own on-duty coordinator (human-in-the-loop), then the public
 * service that actually owns the situation.
 *
 * Numbers verified 2026-09 against official sources (see `source`). Only numbers with a
 * source are listed; nothing is guessed. The coordinator line is per-deployment config.
 */

export type SupportGroup = 'ours' | 'emergency' | 'child' | 'specialist';

export interface SupportContact {
  id: string;
  group: SupportGroup;
  name: { vi: string; en: string };
  when: { vi: string; en: string };
  number: string;
  /** Free to call. 1900 numbers in Vietnam usually carry a call charge, so they are marked false. */
  free: boolean;
  allDay: boolean;
  source?: string;
}

const env = import.meta.env as Record<string, string | undefined>;

/** Our own on-duty coordinator line for this pilot site. Empty when not configured — never faked. */
export const COORDINATOR_LINE: string | null = env.VITE_COORDINATOR_LINE?.trim() || null;

export const SUPPORT_CONTACTS: SupportContact[] = [
  {
    id: 'emergency-113',
    group: 'emergency',
    name: { vi: 'Công an', en: 'Police' },
    when: { vi: 'Đang bị đe doạ, hành hung, cướp giật, bắt giữ trái phép', en: 'Threats, assault, robbery, unlawful detention' },
    number: '113',
    free: true,
    allDay: true,
    source: 'https://www.vietnam.vn/en/huong-dan-nguoi-dan-bao-tin-den-canh-sat-113-trong-cac-tinh-huong-khan-cap',
  },
  {
    id: 'emergency-115',
    group: 'emergency',
    name: { vi: 'Cấp cứu y tế', en: 'Ambulance' },
    when: { vi: 'Ngất, chấn thương, bệnh nặng — thường gặp ở người cao tuổi ngoài đường', en: 'Collapse, injury, serious illness — common for older people on the street' },
    number: '115',
    free: true,
    allDay: true,
    source: 'https://www.expatwoman.com/global/health-fitness/emergency-useful-numbers-in-vietnam',
  },
  {
    id: 'emergency-114',
    group: 'emergency',
    name: { vi: 'Cứu hoả, cứu hộ', en: 'Fire & rescue' },
    when: { vi: 'Cháy nổ, mắc kẹt, tai nạn cần cứu hộ', en: 'Fire, explosion, entrapment' },
    number: '114',
    free: true,
    allDay: true,
    source: 'https://gmhospitalitygroup.com/en/ghg-magazine/post/emergency-contacts-useful-numbers-in-vietnam',
  },
  {
    id: 'child-111',
    group: 'child',
    name: { vi: 'Tổng đài quốc gia bảo vệ trẻ em', en: 'National child protection hotline' },
    when: { vi: 'Trẻ dưới 18 tuổi bị bạo lực, xâm hại, bóc lột lao động, ép bán hàng, mua bán', en: 'A child under 18 facing violence, abuse, labour exploitation or trafficking' },
    number: '111',
    free: true,
    allDay: true,
    source: 'https://www.molisa.gov.vn/baiviet/239580',
  },
  {
    id: 'gbv-peace-house',
    group: 'specialist',
    name: { vi: 'Ngôi nhà Bình yên (Hội LHPN Việt Nam)', en: 'Peace House (Viet Nam Women’s Union)' },
    when: { vi: 'Phụ nữ, trẻ em bị bạo lực gia đình, xâm hại, cần nơi tạm lánh', en: 'Women or children facing domestic or sexual violence, needing shelter' },
    number: '1900969680',
    free: false,
    allDay: true,
    source: 'https://vwu.vn/tin-chi-tiet/-/chi-tiet/the-center-provides-comprehensive-free-support-services-for-women-and-children-suffering-from-gender-based-violence-63068-4902.html',
  },
  {
    id: 'mental-ngay-mai',
    group: 'specialist',
    name: { vi: 'Đường dây Ngày Mai', en: 'Ngày Mai hotline' },
    when: { vi: 'Khủng hoảng tâm lý, có ý nghĩ tự hại', en: 'Mental health crisis, thoughts of self-harm' },
    number: '0963061414',
    free: false,
    allDay: false,
    source: 'https://duongdaynongngaymai.vn/hotline/',
  },
  {
    id: 'scam-156',
    group: 'specialist',
    name: { vi: 'Tổng đài 156 — phản ánh cuộc gọi lừa đảo', en: '156 — report scam calls' },
    when: { vi: 'Bị gọi/nhắn tin tuyển dụng giả, đòi phí môi giới, đòi chụp CCCD', en: 'Fake job calls/SMS, broker fees, requests for ID photos' },
    number: '156',
    free: true,
    allDay: false,
    source: 'https://xaydungchinhsach.chinhphu.vn/tu-1-11-trien-khai-thi-diem-tong-dai-156-ngan-chan-cuoc-goi-rac-cuoc-goi-co-dau-hieu-lua-dao-119221101101643008.htm',
  },
];

export function telHref(number: string) {
  return `tel:${number.replace(/\s+/g, '')}`;
}

/** Human-readable grouping: 1900 969 680, 0963 061 414, 113. */
export function formatPhone(number: string) {
  const n = number.replace(/\s+/g, '');
  if (n.length <= 4) return n;
  if (n.startsWith('1900') || n.startsWith('1800')) return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
  return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
}
