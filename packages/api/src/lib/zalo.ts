// Xác minh access token do zmp-sdk `getAccessToken()` cấp trong Zalo Mini App.
// Server gọi Graph API kèm appsecret_proof = HMAC-SHA256(key = App Secret, msg = access token), dạng hex
// (bắt buộc từ 01/01/2024) — nhờ vậy token của Mini App khác không dùng được ở đây.

export const ZALO_GRAPH_ME = 'https://graph.zalo.me/v2.0/me?fields=id,name,picture';

export interface ZaloProfile {
  id: string;
  name: string;
  avatar?: string;
}

export async function appSecretProof(accessToken: string, appSecret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(appSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(accessToken));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Trả hồ sơ Zalo, hoặc null nếu token sai/hết hạn. */
export async function fetchZaloProfile(accessToken: string, appSecret: string): Promise<ZaloProfile | null> {
  const resp = await fetch(ZALO_GRAPH_ME, {
    headers: { access_token: accessToken, appsecret_proof: await appSecretProof(accessToken, appSecret) },
  });
  if (!resp.ok) return null;
  const data = (await resp.json().catch(() => null)) as
    | { id?: string; name?: string; picture?: { data?: { url?: string } }; error?: number }
    | null;
  // Graph API trả HTTP 200 kèm `error` khác 0 khi token không hợp lệ.
  if (!data || (data.error && data.error !== 0) || !data.id) return null;
  return { id: String(data.id), name: data.name || 'Người dùng Zalo', avatar: data.picture?.data?.url };
}
