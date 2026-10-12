/**
 * Nhãn hiển thị dùng lại nhiều màn. Từ ngữ theo bảng từ NEXTA:
 * Hành trình, Người đồng hành, Chuyển gửi, Đơn vị hỗ trợ, Hỏi thăm, Kiểm tra an toàn, Nơi hỗ trợ…
 */
import type { FollowUpResult, JourneyStage, LoopStage, NeedCategory } from '@web/lib/types';
import { ApiError } from './api';
import type { Copy, Lang } from './i18n';

export const NEED: Record<NeedCategory, Copy> = {
  employment: { vi: 'Việc làm', en: 'Work' },
  training: { vi: 'Học nghề', en: 'Training' },
  health: { vi: 'Sức khỏe', en: 'Health' },
  legal: { vi: 'Pháp lý', en: 'Legal' },
  documents: { vi: 'Giấy tờ', en: 'Documents' },
  shelter: { vi: 'Chỗ ở', en: 'Shelter' },
  food: { vi: 'Bữa ăn', en: 'Food' },
  social_assistance: { vi: 'Hỗ trợ xã hội', en: 'Social assistance' },
  emergency: { vi: 'Khẩn cấp', en: 'Emergency' },
};

export const needLabel = (n: string | null | undefined, lang: Lang) => (n && n in NEED ? NEED[n as NeedCategory][lang] : '—');

export const STAGE: Record<JourneyStage, Copy> = {
  CONSENT: { vi: 'Chờ sự đồng ý', en: 'Awaiting consent' },
  UNDERSTAND: { vi: 'Đang tìm hiểu', en: 'Understanding' },
  RISK: { vi: 'Kiểm tra an toàn', en: 'Safety check' },
  MATCH: { vi: 'Tìm nơi phù hợp', en: 'Finding a place' },
  NEXT_STEP: { vi: 'Chọn bước tiếp', en: 'Choosing next step' },
  CONNECTED: { vi: 'Đã chuyển gửi', en: 'Referred' },
  FOLLOW_UP: { vi: 'Chờ hỏi thăm', en: 'Check-in due' },
  CLOSED: { vi: 'Đã khép lại', en: 'Closed' },
  ESCALATED: { vi: 'Đã báo điều phối viên', en: 'Coordinator alerted' },
};

export const REFERRAL_STAGE: Record<LoopStage, Copy> = {
  CREATED: { vi: 'Đã gửi', en: 'Sent' },
  RECEIVED: { vi: 'Đơn vị hỗ trợ đã xem', en: 'Seen by the service' },
  ACCEPTED: { vi: 'Đơn vị hỗ trợ đã nhận', en: 'Accepted' },
  DECLINED: { vi: 'Bị từ chối', en: 'Declined' },
  ACTION_TAKEN: { vi: 'Đã hỗ trợ', en: 'Support given' },
  OUTCOME_RECORDED: { vi: 'Đã có kết quả', en: 'Outcome recorded' },
  FOLLOW_UP_DONE: { vi: 'Đã hỏi thăm', en: 'Checked in' },
  CLOSED: { vi: 'Đã khép lại', en: 'Closed' },
  ESCALATED: { vi: 'Đã báo điều phối viên', en: 'Coordinator alerted' },
};

export const OUTCOME: Record<FollowUpResult, Copy> = {
  BETTER: { vi: 'Tốt hơn', en: 'Better' },
  SAME: { vi: 'Như cũ', en: 'Same' },
  HARDER: { vi: 'Khó hơn', en: 'Harder' },
  UNREACHABLE: { vi: 'Chưa liên lạc được', en: 'Could not reach' },
};

export const FLAG: Record<string, Copy> = {
  CHILD_PRESENT: { vi: 'Có trẻ em (<18 tuổi)', en: 'A child (<18) is involved' },
  VIOLENCE_OR_ABUSE: { vi: 'Bạo lực / xâm hại', en: 'Violence or abuse' },
  SELF_HARM: { vi: 'Nguy cơ tự hại', en: 'Risk of self-harm' },
  MEDICAL_EMERGENCY: { vi: 'Cấp cứu y tế', en: 'Medical emergency' },
  EXPLOITATION_OR_TRAFFICKING: { vi: 'Bóc lột / mua bán người', en: 'Exploitation or trafficking' },
  SCAM_PATTERN: { vi: 'Dấu hiệu lừa đảo việc làm', en: 'Job-scam language' },
  IMPERSONATION_PATTERN: { vi: 'Dấu hiệu giả danh', en: 'Impersonation language' },
  NO_SAFE_SHELTER_TONIGHT: { vi: 'Không có chỗ ngủ an toàn tối nay', en: 'No safe place to sleep tonight' },
  OTHER: { vi: 'Khác', en: 'Other' },
};

export const flagLabel = (code: string, lang: Lang) => FLAG[code]?.[lang] ?? code;

/** Lý do chuyển cho điều phối viên lưu dạng "MÃ bằng chứng; MÃ …" — đổi sang chữ dễ đọc. */
export function humanizeReason(reason: string, lang: Lang) {
  return reason
    .split(/;\s*/)
    .map((part) => {
      const m = part.match(/^([A-Z][A-Z0-9_]{2,})\b/);
      return m && FLAG[m[1]] ? FLAG[m[1]][lang] : part;
    })
    .filter((v, i, a) => v && a.indexOf(v) === i)
    .join(' · ');
}

/** Mã lý do của bộ lọc tìm nơi phù hợp → câu dễ hiểu. */
export function reasonLabel(r: { code: string; value?: string | number }, lang: Lang): string {
  const need = needLabel(String(r.value ?? ''), lang).toLowerCase();
  const t = (vi: string, en: string) => (lang === 'vi' ? vi : en);
  switch (r.code) {
    case 'PROVIDES_NEED': return t(`Đúng nhu cầu ${need}`, `Offers ${need}`);
    case 'RELATED_SERVICE': return t(`Dịch vụ liên quan (${need})`, `Related service (${need})`);
    case 'SAME_DISTRICT': return t('Phục vụ đúng khu vực', 'Serves this area');
    case 'ADJACENT_DISTRICT': return t('Khu vực lân cận', 'Neighbouring area');
    case 'CITYWIDE': return t('Phục vụ toàn thành phố', 'Serves the whole city');
    case 'VERIFIED_ON': return t(`Đã xác minh ${r.value ?? ''}`, `Verified ${r.value ?? ''}`).trim();
    case 'STRENGTH': return t(`Phát huy điểm mạnh: ${r.value}`, `Builds on strength: ${r.value}`);
    case 'NEEDS_RECHECK': return t('Cần gọi xác nhận trước khi chuyển gửi', 'Call to confirm before referring');
    case 'LIMITED_CAPACITY': return t('Còn ít chỗ', 'Limited places');
    case 'CAPACITY_UNKNOWN': return t('Chưa rõ còn nhận không', 'Capacity not confirmed');
    case 'SAFEGUARDING_EMPLOYMENT_BLOCK': return t('An toàn trẻ em: không giới thiệu việc làm', 'Child safety: no employment referral');
    case 'REQUIRES_ID': return t('Bắt buộc có giấy tờ tùy thân', 'Requires ID documents');
    case 'FULL': return t('Hiện đã hết chỗ', 'Full right now');
    default: return r.code;
  }
}

const ERROR_COPY: Record<string, Copy> = {
  CONSENT_REQUIRED: { vi: 'Cần ghi nhận sự đồng ý trước khi hỏi thêm thông tin.', en: 'Record consent before collecting more information.' },
  RISK_GATE_BLOCKED: { vi: 'Hành trình đang được giữ lại ở bước kiểm tra an toàn.', en: 'The journey is held at the safety check.' },
  RESOURCE_NOT_VERIFIED: { vi: 'Nơi hỗ trợ này chưa được xác minh.', en: 'This place is not verified.' },
  CONTACT_CONFIRMATION_REQUIRED: { vi: 'Nơi hỗ trợ cần gọi xác nhận trước khi chốt.', en: 'Call the place to confirm first.' },
  INVALID_TRANSITION: { vi: 'Không thể chuyển sang bước này từ trạng thái hiện tại.', en: 'That step is not possible from the current state.' },
  COORDINATOR_ONLY: { vi: 'Chỉ điều phối viên làm được việc này.', en: 'Only a coordinator can do this.' },
  ALREADY_RECORDED: { vi: 'Lần hỏi thăm này đã được ghi.', en: 'This check-in is already recorded.' },
  OPEN_REFERRAL: { vi: 'Còn chuyển gửi đang mở — hãy khép lại hoặc báo điều phối viên trước.', en: 'A referral is still open — close or escalate it first.' },
  VALIDATION_ERROR: { vi: 'Thông tin chưa đầy đủ hoặc chưa hợp lệ.', en: 'Some information is missing or invalid.' },
  TRAINING_REQUIRED: { vi: 'Bạn cần hoàn thành buổi tập huấn người đồng hành trước khi mở hành trình.', en: 'Finish the navigator training before opening journeys.' },
  EMPTY_OBSERVATION: { vi: 'Hãy ghi một dòng ngắn hoặc chọn ít nhất một từ khóa.', en: 'Add a short note or at least one keyword.' },
  SCOPE_FORBIDDEN: { vi: 'Hành trình này thuộc tổ chức khác.', en: 'This journey belongs to another organisation.' },
  INVALID_EMAIL: { vi: 'Email chưa đúng. Kiểm tra lại giúp nhé.', en: 'That email does not look right.' },
  WRONG_CODE: { vi: 'Mã chưa đúng. Kiểm tra lại email và nhập lại.', en: 'Wrong code. Check your email and try again.' },
  CODE_EXPIRED: { vi: 'Mã đã hết hạn. Hãy lấy mã mới.', en: 'The code has expired. Request a new one.' },
  TOO_MANY_ATTEMPTS: { vi: 'Nhập sai quá nhiều lần. Hãy lấy mã mới.', en: 'Too many attempts. Request a new code.' },
  RATE_LIMITED: { vi: 'Bạn đã lấy nhiều mã quá. Thử lại sau 15 phút.', en: 'Too many codes requested. Try again in 15 minutes.' },
  SUSPENDED: { vi: 'Tài khoản đang tạm khóa. Liên hệ điều phối viên.', en: 'Account suspended. Contact your coordinator.' },
  DEMO_DISABLED: { vi: 'Mã dùng thử chưa đúng.', en: 'Wrong demo code.' },
  INVALID_ZALO_TOKEN: { vi: 'Không xác minh được tài khoản Zalo. Hãy thử lại.', en: 'Could not verify your Zalo account. Try again.' },
  ZALO_NOT_CONFIGURED: { vi: 'Máy chủ chưa bật đăng nhập Zalo. Hãy dùng mã qua email.', en: 'Zalo sign-in is not enabled. Use an email code.' },
  ZALO_LINK_EXPIRED: { vi: 'Phiên gắn Zalo đã hết hạn. Bấm đăng nhập Zalo lại.', en: 'The Zalo link expired. Sign in with Zalo again.' },
  ZALO_ALREADY_LINKED: { vi: 'Tài khoản Zalo này đã gắn với một email khác.', en: 'This Zalo account is linked to another email.' },
};

export function errorText(err: unknown, lang: Lang): string {
  if (err instanceof ApiError) return ERROR_COPY[err.code]?.[lang] ?? err.message;
  if (err instanceof TypeError)
    return lang === 'vi' ? 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.' : 'Cannot reach the server. Check the connection and try again.';
  return err instanceof Error ? err.message : String(err);
}
