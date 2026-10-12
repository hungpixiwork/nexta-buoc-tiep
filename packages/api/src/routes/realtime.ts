import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { Env } from '../bindings';

/**
 * realtime.ts — Section 25 REALTIME ARCHITECTURE (BUOC_TIEP_SYSTEM_ARCHITECTURE_V2.md)
 *
 * GET /api/realtime/partner-inbox/:organisationId
 *   Nâng cấp (upgrade) kết nối HTTP thành WebSocket và forward request tới đúng
 *   PartnerInboxRoom Durable Object instance của tổ chức (`env.PARTNER_INBOX_DO`).
 *
 * Xác thực: trình duyệt KHÔNG thể gắn header `Authorization: Bearer` vào WebSocket handshake
 * (Browser WebSocket API không hỗ trợ custom headers), nên route này chấp nhận JWT qua
 * query string `?token=` — cùng secret/scheme JWT HS256 với `middleware/auth.ts`, nhưng
 * triển khai xác thực cục bộ tại đây để KHÔNG cần sửa cấu trúc middleware toàn cục hiện có
 * trong `src/index.ts` (route này được mount ở nhóm public, tự xác thực token nội bộ).
 *
 * Section 39 FAILURE MODEL: nếu `PARTNER_INBOX_DO` binding chưa được provision (chưa
 * `wrangler deploy`), trả về 503 kèm hướng dẫn dùng fallback polling — KHÔNG throw 500.
 */
export const realtimeRoutes = new Hono<{ Bindings: Env }>();

realtimeRoutes.get('/partner-inbox/:organisationId', async (c) => {
  const organisationId = c.req.param('organisationId');
  const token = c.req.query('token');

  if (!token) {
    return c.json({
      success: false,
      error: 'Thiếu tham số token xác thực (?token=<JWT>) bắt buộc cho kết nối Realtime WebSocket.',
    }, 401);
  }

  const secret = c.env.JWT_SECRET;
  if (!secret) {
    return c.json({ success: false, error: 'Server misconfiguration: JWT_SECRET is missing.' }, 500);
  }

  try {
    const payload = await verify(token, secret, 'HS256') as any;
    if (!payload || !payload.sub) {
      return c.json({ success: false, error: 'Token không hợp lệ hoặc đã bị vô hiệu hóa.' }, 401);
    }
  } catch {
    return c.json({ success: false, error: 'Token đã hết hạn hoặc chữ ký không hợp lệ.' }, 401);
  }

  const upgradeHeader = c.req.header('Upgrade');
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
    return c.json({
      success: false,
      error: 'Endpoint này chỉ phục vụ nâng cấp WebSocket (yêu cầu header Upgrade: websocket).',
    }, 426);
  }

  const doBinding = c.env.PARTNER_INBOX_DO;
  if (!doBinding) {
    // Section 39: Durable Object unavailable -> D1 vẫn là nguồn sự thật, client phải fallback
    // sang polling GET /api/resources/referrals?updated_after=... (xem usePartnerInboxRealtime.ts).
    return c.json({
      success: false,
      error: 'PARTNER_INBOX_DO chưa được provision trên môi trường này. Cần chạy `wrangler deploy` để kích hoạt Durable Object namespace trước khi dùng Realtime WebSocket. Vui lòng dùng fallback polling GET /api/resources/referrals?updated_after=.',
    }, 503);
  }

  const roomId = doBinding.idFromName(`PartnerInboxRoom:${organisationId}`);
  const stub = doBinding.get(roomId);

  // Forward nguyên vẹn request WebSocket upgrade tới Durable Object instance của tổ chức.
  return stub.fetch(c.req.raw);
});
