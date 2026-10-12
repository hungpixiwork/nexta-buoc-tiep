import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * usePartnerInboxRealtime — Section 25 REALTIME ARCHITECTURE (BUOC_TIEP_SYSTEM_ARCHITECTURE_V2.md)
 *
 * Mở kết nối WebSocket tới `GET /api/realtime/partner-inbox/:organisationId` (forward vào
 * PartnerInboxRoom Durable Object của API Gateway) để nhận realtime cập nhật referral
 * transition cho Partner Portal (`apps/web`).
 *
 * FALLBACK BẮT BUỘC (Section 25 & 39 — "Durable Object unavailable/reconnecting"):
 *   Nếu socket không mở được / bị đóng / lỗi liên tục, hook tự động chuyển sang polling
 *   định kỳ endpoint đối chiếu D1 (`GET /api/resources/referrals?updated_after=...`).
 *   Đây CHÍNH XÁC là endpoint hiện có duy nhất trong `packages/api/src/routes/resources.ts`
 *   trả về toàn bộ danh sách referrals từ D1 — kiến trúc V2 (Section 25) mô tả đường dẫn lý
 *   tưởng là `GET /referrals?updated_after=`, nhưng route `/api/referrals` hiện tại
 *   (`packages/api/src/routes/p0Referrals.ts`) chưa có handler liệt kê referral theo thời gian
 *   cập nhật ở root path (root trả về danh sách referral-channels). Hook này vì vậy gọi
 *   `/api/resources/referrals` (endpoint thực tế đang hoạt động) và tự lọc phía client theo
 *   `updatedAt`/`updated_at` để đạt đúng NGỮ NGHĨA "updated_after" mà không cần sửa route đó
 *   (nằm ngoài phạm vi sở hữu của subagent SA-RE2-04). Khuyến nghị nâng cấp: bổ sung tham số
 *   `updated_after` filter phía server cho endpoint đó ở một vòng làm việc kế tiếp.
 *
 * D1 luôn là nguồn sự thật — realtime WebSocket chỉ là tối ưu độ trễ hiển thị.
 */

export type PartnerInboxConnectionStatus = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'polling' | 'closed';

export interface ReferralRealtimeEvent {
  type?: string;
  referralId?: string;
  caseId?: string;
  organisationId?: string;
  fromStatus?: string | null;
  toStatus?: string;
  actorId?: string;
  reason?: string;
  correlationId?: string;
  occurredAt?: string;
  events?: ReferralRealtimeEvent[];
  raw?: unknown;
  [key: string]: unknown;
}

export interface UsePartnerInboxRealtimeOptions {
  /** Base URL của API Gateway, ví dụ `https://buoc-tiep-api.ppnh10092002.workers.dev`. */
  apiBaseUrl: string;
  /** Khóa tổ chức đối tác — dùng để route vào đúng PartnerInboxRoom:{organisationId}. */
  organisationId: string;
  /** Hàm lấy JWT hiện tại (thường đọc từ localStorage) — WebSocket handshake gắn token qua query string. */
  getAuthToken: () => string | null | undefined;
  /** Callback khi có sự kiện referral transition mới (từ WebSocket hoặc từ polling reconciliation). */
  onEvent?: (event: ReferralRealtimeEvent) => void;
  /** Chu kỳ polling fallback (ms). Mặc định 15s. */
  pollIntervalMs?: number;
  /** Bật/tắt toàn bộ hook (ví dụ chỉ bật khi đang ở tab Referrals). Mặc định true. */
  enabled?: boolean;
}

export interface UsePartnerInboxRealtimeResult {
  status: PartnerInboxConnectionStatus;
  lastSyncedAt: string | null;
  /** Buộc đóng kết nối hiện tại và thử kết nối lại ngay lập tức. */
  reconnect: () => void;
}

const DEFAULT_POLL_INTERVAL_MS = 15000;
const MAX_RECONNECT_DELAY_MS = 30000;

export function usePartnerInboxRealtime(options: UsePartnerInboxRealtimeOptions): UsePartnerInboxRealtimeResult {
  const { apiBaseUrl, organisationId, getAuthToken, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS, enabled = true } = options;

  const [status, setStatus] = useState<PartnerInboxConnectionStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const lastSyncedAtRef = useRef<string | null>(null);
  const closedByClientRef = useRef(false);
  const connectRef = useRef<() => void>(() => {});

  const onEventRef = useRef(options.onEvent);
  onEventRef.current = options.onEvent;

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollFallback = useCallback(async () => {
    try {
      const token = getAuthToken();
      const since = lastSyncedAtRef.current || '';
      const url = `${apiBaseUrl}/api/resources/referrals?updated_after=${encodeURIComponent(since)}`;
      const resp = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!resp.ok) return;

      const body = await resp.json().catch(() => null);
      const rows: any[] = Array.isArray(body?.data) ? body.data : [];
      const cutoffMs = lastSyncedAtRef.current ? new Date(lastSyncedAtRef.current).getTime() : 0;
      let newestSeen = lastSyncedAtRef.current;

      for (const row of rows) {
        if (!row || typeof row !== 'object' || !('id' in row)) continue;
        const updatedAt: string | undefined = row.updatedAt || row.updated_at || row.createdAt || row.created_at;
        if (updatedAt && cutoffMs && new Date(updatedAt).getTime() <= cutoffMs) continue;

        onEventRef.current?.({
          type: 'referral.reconciled',
          referralId: row.id,
          caseId: row.caseId || row.case_id,
          toStatus: row.status,
          occurredAt: updatedAt,
          raw: row,
        });

        if (updatedAt && (!newestSeen || new Date(updatedAt).getTime() > new Date(newestSeen).getTime())) {
          newestSeen = updatedAt;
        }
      }

      lastSyncedAtRef.current = newestSeen || new Date().toISOString();
      setLastSyncedAt(lastSyncedAtRef.current);
    } catch (err) {
      // Section 39: D1 reconciliation là best-effort; lỗi mạng tạm thời không được làm crash Partner Portal.
      console.warn('[usePartnerInboxRealtime] Fallback polling lỗi:', err);
    }
  }, [apiBaseUrl, getAuthToken]);

  const startPolling = useCallback(() => {
    stopPolling();
    setStatus((prev) => (prev === 'open' ? prev : 'polling'));
    void pollFallback();
    pollTimerRef.current = setInterval(() => void pollFallback(), pollIntervalMs);
  }, [pollFallback, pollIntervalMs, stopPolling]);

  const scheduleReconnect = useCallback(() => {
    if (closedByClientRef.current || !enabled) return;
    reconnectAttemptRef.current += 1;
    const delay = Math.min(1000 * 2 ** reconnectAttemptRef.current, MAX_RECONNECT_DELAY_MS);
    setStatus('reconnecting');
    startPolling(); // Giữ dữ liệu tiếp tục chảy qua polling trong lúc chờ WebSocket kết nối lại.
    reconnectTimerRef.current = setTimeout(() => {
      connectRef.current();
    }, delay);
  }, [enabled, startPolling]);

  const connect = useCallback(() => {
    if (!enabled || !organisationId) return;
    closedByClientRef.current = false;

    const token = getAuthToken();
    if (!token) {
      // Không có token đăng nhập -> không thể mở WebSocket có xác thực, dùng polling làm nguồn chính.
      startPolling();
      return;
    }

    try {
      const wsBase = apiBaseUrl.replace(/^http/i, 'ws');
      const url = `${wsBase}/api/realtime/partner-inbox/${encodeURIComponent(organisationId)}?token=${encodeURIComponent(token)}`;
      const socket = new WebSocket(url);
      socketRef.current = socket;
      setStatus('connecting');

      socket.onopen = () => {
        reconnectAttemptRef.current = 0;
        stopPolling();
        setStatus('open');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ReferralRealtimeEvent;
          if (data.type === 'sync' && Array.isArray(data.events)) {
            data.events.forEach((e) => onEventRef.current?.(e));
          } else {
            onEventRef.current?.(data);
          }
          const now = new Date().toISOString();
          lastSyncedAtRef.current = now;
          setLastSyncedAt(now);
        } catch (err) {
          console.warn('[usePartnerInboxRealtime] Không parse được message WebSocket:', err);
        }
      };

      socket.onclose = () => {
        socketRef.current = null;
        if (!closedByClientRef.current) {
          scheduleReconnect();
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    } catch (err) {
      console.warn('[usePartnerInboxRealtime] Không thể khởi tạo WebSocket, chuyển sang polling fallback:', err);
      scheduleReconnect();
    }
  }, [apiBaseUrl, enabled, getAuthToken, organisationId, scheduleReconnect, startPolling, stopPolling]);

  connectRef.current = connect;

  const reconnect = useCallback(() => {
    reconnectAttemptRef.current = 0;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    socketRef.current?.close();
    connect();
  }, [connect]);

  useEffect(() => {
    if (!enabled || !organisationId) {
      stopPolling();
      return;
    }
    closedByClientRef.current = false;
    connect();

    return () => {
      closedByClientRef.current = true;
      stopPolling();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      socketRef.current?.close();
      socketRef.current = null;
      setStatus('closed');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, organisationId, apiBaseUrl]);

  return { status, lastSyncedAt, reconnect };
}
