import { Env } from '../bindings';

/**
 * notificationService — Section 25 REALTIME ARCHITECTURE (BUOC_TIEP_SYSTEM_ARCHITECTURE_V2.md)
 *
 *   Referral transition
 *   ↓
 *   D1
 *   ↓
 *   domain event
 *   ↓
 *   Queue                    <-- CHƯA có Cloudflare Queue wiring trong hạ tầng hiện tại
 *   ↓
 *   notification worker      <-- hàm notifyReferralTransition() dưới đây đóng vai trò rút gọn
 *   ↓
 *   PartnerInboxRoom Durable Object
 *   ↓
 *   WebSocket
 *   ↓
 *   Partner Portal
 *
 * Ghi chú kiến trúc quan trọng:
 * - `packages/api/wrangler.jsonc` HIỆN CHƯA có Cloudflare Queues binding. Vòng lặp đầy đủ
 *   "domain event → Queue → notification worker" theo đúng Section 12/13 KHÔNG nằm trong
 *   phạm vi subagent này. Hàm dưới đây gọi trực tiếp (fire-and-forget an toàn) tới
 *   PartnerInboxRoom ngay sau khi D1 transition commit — đây là một "rút gọn MVP" hợp lệ vì
 *   Section 25 khẳng định rõ: "Realtime is therefore an optimisation. D1 remains truth."
 * - Nâng cấp production đầy đủ (tương lai): thay lời gọi trực tiếp này bằng việc publish
 *   một domain event (`referral.transitioned`) vào Cloudflare Queue, và để một Queue Consumer
 *   Worker riêng biệt gọi tới PartnerInboxRoom — tách rời hoàn toàn khỏi request path chính.
 *
 * Section 39 FAILURE MODEL — "Durable Object unavailable/reconnecting":
 *   realtime tạm thời không khả dụng; D1 reconciliation khôi phục trạng thái canonical.
 *   => Hàm này BẮT BUỘC không bao giờ throw ra ngoài. Mọi lỗi (binding chưa provision,
 *      DO fetch lỗi mạng, DO instance bị evict...) đều được nuốt (swallow) an toàn và trả về
 *      một kết quả mô tả trạng thái, để route referral transition gọi hàm này không bao giờ
 *      bị fail theo lỗi của tầng realtime phụ trợ này.
 */

export interface ReferralTransitionEvent {
  referralId: string;
  caseId: string;
  /**
   * Khóa định danh tổ chức đối tác dùng để route vào đúng PartnerInboxRoom:{organisationId}.
   *
   * LƯU Ý VỀ SCHEMA HIỆN TẠI: bảng `referral_channel_configs` (packages/database/src/schema/index.ts)
   * hiện CHƯA có cột `organization_id` liên kết chính thức tới bảng `organizations` — chỉ có
   * `organizationName` (text tự do) và `id` (mã cấu hình kênh). Do đó subagent này dùng
   * `referral.destinationConfigId` (mã cấu hình kênh tiếp nhận) làm khóa organisationId thực tế
   * cho việc route Durable Object. Đây là quyết định kỹ thuật tạm thời — khuyến nghị theo dõi ở
   * mục "Khuyến nghị nâng cấp" trong báo cáo SA-RE2-04 để bổ sung cột `organization_id` chính thức.
   */
  organisationId: string;
  fromStatus: string | null;
  toStatus: string;
  actorId: string;
  actorType?: 'volunteer' | 'social_worker' | 'admin' | 'system';
  reason?: string;
  correlationId?: string;
  occurredAt?: string;
}

export interface NotifyResult {
  delivered: boolean;
  reason?: string;
}

export async function notifyReferralTransition(env: Env, event: ReferralTransitionEvent): Promise<NotifyResult> {
  try {
    const doBinding = env.PARTNER_INBOX_DO;
    if (!doBinding) {
      // Chưa `wrangler deploy` để kích hoạt namespace DO — đây là trạng thái CHẤP NHẬN ĐƯỢC
      // theo Section 39: request nghiệp vụ chính (transition referral) đã commit D1 thành công
      // TRƯỚC KHI hàm này được gọi, nên business flow không bị ảnh hưởng.
      return { delivered: false, reason: 'PARTNER_INBOX_DO binding chưa được provision (cần wrangler deploy trước khi dùng thật).' };
    }

    const roomId = doBinding.idFromName(`PartnerInboxRoom:${event.organisationId}`);
    const stub = doBinding.get(roomId);

    const response = await stub.fetch('https://partner-inbox-room.internal/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'referral.transitioned',
        referralId: event.referralId,
        caseId: event.caseId,
        organisationId: event.organisationId,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        actorId: event.actorId,
        actorType: event.actorType || 'system',
        reason: event.reason,
        correlationId: event.correlationId || event.referralId,
        occurredAt: event.occurredAt || new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      return { delivered: false, reason: `PartnerInboxRoom broadcast trả về HTTP ${response.status}` };
    }

    return { delivered: true };
  } catch (err: any) {
    // KHÔNG BAO GIỜ để lỗi tầng realtime làm fail request nghiệp vụ chính gọi hàm này.
    console.error('[notificationService] Không thể broadcast realtime tới PartnerInboxRoom:', err?.message || err);
    return { delivered: false, reason: err?.message || 'Lỗi không xác định khi gọi notificationService.' };
  }
}
