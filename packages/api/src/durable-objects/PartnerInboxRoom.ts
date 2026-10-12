import { Env } from '../bindings';

/**
 * PartnerInboxRoom — Durable Object (Section 24, BUOC_TIEP_SYSTEM_ARCHITECTURE_V2.md)
 *
 * Một instance Durable Object cho MỖI tổ chức đối tác (NGO / Partner):
 *   PartnerInboxRoom:{organisationId}
 *
 * Trách nhiệm (theo đúng Section 24 — DO phải "narrow coordination responsibilities"):
 *   - live referral updates: broadcast realtime khi có referral transition liên quan tổ chức.
 *   - presence: đếm số WebSocket client Partner Portal đang kết nối tới phòng của tổ chức.
 *   - WebSocket coordination: quản lý vòng đời kết nối (accept / cleanup khi đóng / lỗi).
 *   - short-lived notification state: lưu một ring-buffer nhỏ các sự kiện gần nhất trong
 *     `state.storage` để client vừa kết nối lại có thể "bắt kịp" (best-effort catch-up).
 *
 * QUAN TRỌNG (Section 19 & 39): Durable Object KHÔNG PHẢI là nguồn sự thật (source of truth).
 * D1 (bảng `referrals`, `referral_events`) vẫn là SSOT giao dịch. Nếu DO này không khả dụng,
 * client bắt buộc phải fallback về `GET /api/resources/referrals?updated_after=...` để
 * đồng bộ lại từ D1 (xem `apps/web/src/hooks/usePartnerInboxRealtime.ts`).
 *
 * Do KHÔNG migrate các bản ghi Case/Referral chính (canonical records) vào Durable Object
 * storage — object này chỉ giữ presence + một hàng đợi ngắn hạn các sự kiện gần nhất.
 */

interface PartnerInboxBroadcastPayload {
  type?: string;
  referralId?: string;
  caseId?: string;
  organisationId?: string;
  fromStatus?: string | null;
  toStatus?: string;
  actorId?: string;
  actorType?: string;
  reason?: string;
  correlationId?: string;
  occurredAt?: string;
  [key: string]: unknown;
}

const RECENT_EVENTS_STORAGE_KEY = 'recentReferralEvents';
const MAX_RECENT_EVENTS_RETAINED = 20;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export class PartnerInboxRoom {
  private readonly state: DurableObjectState;
  private readonly env: Env;
  /**
   * Presence ngắn hạn trong RAM của instance DO hiện tại. Đây KHÔNG phải state bền vững —
   * nếu DO bị evict/tái khởi động, mỗi client WebSocket sẽ tự động reconnect (xem hook phía web)
   * và phiên (session) presence được tái tạo lại từ đầu. Đây là hành vi chấp nhận được cho
   * "short-lived notification state" theo đúng Section 24.
   */
  private readonly sessions: Set<WebSocket> = new Set();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // 1) WebSocket upgrade path — Partner Portal client kết nối realtime vào phòng của tổ chức.
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
      return this.handleWebSocketUpgrade();
    }

    // 2) Internal broadcast trigger — gọi bởi notificationService khi referral transition xảy ra.
    if (url.pathname.endsWith('/broadcast') && request.method === 'POST') {
      return this.handleBroadcast(request);
    }

    // 3) Presence debug endpoint (không phải public API — chỉ dùng nội bộ / kiểm thử thủ công).
    if (url.pathname.endsWith('/presence') && request.method === 'GET') {
      return jsonResponse({ success: true, organisationRoom: url.pathname, connectedClients: this.sessions.size });
    }

    return jsonResponse({ success: false, error: 'Route không tồn tại trong PartnerInboxRoom Durable Object.' }, 404);
  }

  private handleWebSocketUpgrade(): Response {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];

    server.accept();
    this.sessions.add(server);

    server.addEventListener('message', (event: MessageEvent) => {
      // Heartbeat nhẹ để giữ kết nối qua các proxy trung gian; không lưu trạng thái nghiệp vụ.
      if (typeof event.data === 'string' && event.data === 'ping') {
        try {
          server.send('pong');
        } catch {
          this.sessions.delete(server);
        }
      }
    });

    const cleanup = () => {
      this.sessions.delete(server);
    };
    server.addEventListener('close', cleanup);
    server.addEventListener('error', cleanup);

    // Best-effort catch-up: gửi lại các sự kiện gần nhất đã lưu để client mới không bị "mù"
    // trong khoảng thời gian ngắn trước khi vòng polling reconciliation (D1) chạy tiếp theo.
    void this.state.storage
      .get<PartnerInboxBroadcastPayload[]>(RECENT_EVENTS_STORAGE_KEY)
      .then((recent) => {
        if (recent && recent.length > 0) {
          try {
            server.send(JSON.stringify({ type: 'sync', events: recent }));
          } catch {
            this.sessions.delete(server);
          }
        }
      })
      .catch(() => {
        // Best-effort only — D1 reconciliation (GET /api/resources/referrals?updated_after=)
        // vẫn là đường đảm bảo chính xác tuyệt đối, không phải catch-up qua DO storage này.
      });

    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleBroadcast(request: Request): Promise<Response> {
    let payload: PartnerInboxBroadcastPayload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ success: false, error: 'Payload broadcast không hợp lệ (JSON parse lỗi).' }, 400);
    }

    const enrichedEvent: PartnerInboxBroadcastPayload = {
      type: 'referral.transitioned',
      ...payload,
      occurredAt: payload.occurredAt || new Date().toISOString(),
    };

    // Lưu ring-buffer ngắn hạn (short-lived notification state) trong DO storage.
    try {
      const recent = (await this.state.storage.get<PartnerInboxBroadcastPayload[]>(RECENT_EVENTS_STORAGE_KEY)) || [];
      recent.push(enrichedEvent);
      while (recent.length > MAX_RECENT_EVENTS_RETAINED) {
        recent.shift();
      }
      await this.state.storage.put(RECENT_EVENTS_STORAGE_KEY, recent);
    } catch (err) {
      // Lưu trữ catch-up chỉ là tối ưu — không được chặn việc broadcast tới các client đang mở.
      console.error('[PartnerInboxRoom] Không thể lưu recent events vào storage:', err);
    }

    const message = JSON.stringify(enrichedEvent);
    let delivered = 0;
    for (const socket of this.sessions) {
      try {
        socket.send(message);
        delivered += 1;
      } catch {
        this.sessions.delete(socket);
      }
    }

    return jsonResponse({ success: true, delivered, totalSessions: this.sessions.size });
  }
}
