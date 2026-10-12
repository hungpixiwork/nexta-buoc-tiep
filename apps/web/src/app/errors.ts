import { ApiError } from '../lib/api';

const COPY: Record<string, { vi: string; en: string }> = {
  CONSENT_REQUIRED: { vi: 'Cần ghi nhận sự đồng ý trước khi hỏi thêm thông tin.', en: 'Record consent before collecting more information.' },
  RISK_GATE_BLOCKED: { vi: 'Hành trình đang được giữ lại ở bước kiểm tra an toàn.', en: 'The journey is held at the safety check.' },
  NOT_A_MATCH: { vi: 'Bước tiếp phải dùng một nguồn lực đã qua bộ lọc.', en: 'A Safe Next Step must use a matched resource.' },
  RESOURCE_NOT_VERIFIED: { vi: 'Nguồn lực này chưa được xác minh.', en: 'This resource is not verified.' },
  CONTACT_CONFIRMATION_REQUIRED: { vi: 'Nguồn lực cần kiểm tra lại: hãy gọi xác nhận trước khi cam kết.', en: 'This resource needs re-check: call to confirm first.' },
  INVALID_TRANSITION: { vi: 'Không thể chuyển sang bước này từ trạng thái hiện tại.', en: 'That step is not possible from the current state.' },
  ACTOR_NOT_ALLOWED: { vi: 'Vai trò của bạn không thực hiện được thao tác này.', en: 'Your role cannot do this.' },
  COORDINATOR_ONLY: { vi: 'Chỉ Điều phối viên mới gỡ được trạng thái tạm dừng.', en: 'Only a coordinator can clear a hold.' },
  REASON_REQUIRED: { vi: 'Vui lòng ghi lý do.', en: 'Please give a reason.' },
  OPEN_REFERRAL: { vi: 'Còn chuyển gửi đang mở — hãy khép lại hoặc chuyển cấp trước.', en: 'An open referral remains — close or escalate it first.' },
  ALREADY_RECORDED: { vi: 'Lần theo dõi này đã được ghi.', en: 'This follow-up is already recorded.' },
  VALIDATION_ERROR: { vi: 'Thông tin chưa đầy đủ hoặc chưa hợp lệ.', en: 'Some information is missing or invalid.' },
  EMPTY_OBSERVATION: { vi: 'Hãy ghi một dòng ngắn hoặc chọn ít nhất một từ khóa.', en: 'Add a short note or at least one keyword.' },
  INVALID_ZALO_TOKEN: { vi: 'Không xác minh được tài khoản Zalo. Hãy thử đăng nhập lại.', en: 'Could not verify your Zalo account. Please sign in again.' },
  ZALO_NOT_CONFIGURED: { vi: 'Máy chủ chưa bật đăng nhập Zalo. Hãy dùng mã qua email.', en: 'Zalo sign-in is not enabled. Use an email code instead.' },
  ZALO_LINK_EXPIRED: { vi: 'Phiên gắn Zalo đã hết hạn. Hãy bấm đăng nhập Zalo lại.', en: 'The Zalo link has expired. Sign in with Zalo again.' },
  ZALO_ALREADY_LINKED: { vi: 'Tài khoản Zalo này đã gắn với một email khác.', en: 'This Zalo account is linked to another email.' },
};

export function errorText(err: unknown, lang: 'vi' | 'en'): string {
  if (err instanceof ApiError) return COPY[err.code]?.[lang] ?? err.message;
  if (err instanceof TypeError) return lang === 'vi' ? 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.' : 'Cannot reach the server. Check the connection and try again.';
  return err instanceof Error ? err.message : String(err);
}
