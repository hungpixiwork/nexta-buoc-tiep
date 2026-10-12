/**
 * SIGNED OUTBOUND WEBHOOKS DISPATCHER (HERMES AGENT V0.20.0 SPEC)
 * Ký chữ ký số HMAC-SHA256 phòng chống giả mạo & Replay Attacks.
 * Chạy Native 100% trên Cloudflare Workers Web Crypto API.
 */

export interface WebhookPayload<T = Record<string, unknown>> {
  eventId: string;
  eventType: string;
  timestamp: number;
  source: string;
  data: T;
}

export interface WebhookDispatchResult {
  success: boolean;
  statusCode?: number;
  deliveryId: string;
  timestamp: number;
  error?: string;
}

/**
 * Tạo chữ ký HMAC-SHA256 dạng v1=hex_string cho Webhook Header
 */
export async function generateHermesSignature(
  secretKey: string,
  timestamp: number,
  payloadString: string
): Promise<string> {
  const encoder = new TextEncoder();
  const signedPayload = `${timestamp}.${payloadString}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedPayload)
  );

  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hexSignature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return `t=${timestamp},v1=${hexSignature}`;
}

/**
 * Gửi Signed Webhook Outbound tới Endpoint bên ngoài
 */
export async function dispatchSignedWebhook<T = Record<string, unknown>>(
  targetUrl: string,
  secretKey: string,
  eventType: string,
  data: T
): Promise<WebhookDispatchResult> {
  const timestamp = Math.floor(Date.now() / 1000);
  const deliveryId = `del_${crypto.randomUUID()}`;

  const payload: WebhookPayload<T> = {
    eventId: `evt_${crypto.randomUUID()}`,
    eventType,
    timestamp,
    source: "buoc-tiep-hermes-agent-v020",
    data
  };

  const payloadString = JSON.stringify(payload);
  const signatureHeader = await generateHermesSignature(secretKey, timestamp, payloadString);

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hermes-Signature-256": signatureHeader,
        "X-Hermes-Timestamp": timestamp.toString(),
        "X-Hermes-Event-Type": eventType,
        "X-Hermes-Delivery-ID": deliveryId,
        "User-Agent": "BuocTiepHermesAgent/0.20.0"
      },
      body: payloadString
    });

    return {
      success: response.ok,
      statusCode: response.status,
      deliveryId,
      timestamp
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      deliveryId,
      timestamp,
      error: errorMessage
    };
  }
}
