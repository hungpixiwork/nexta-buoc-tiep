export interface Env {
  DB: D1Database;
  CACHE_KV: KVNamespace;
  STORAGE_R2: R2Bucket;
  VECTOR_INDEX: VectorizeIndex;
  AI: Ai;
  ENVIRONMENT: string;
  JWT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GEMINI_API_KEY?: string;
  PII_ENCRYPTION_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  CRON_SECRET?: string;
  /** Cloudflare Email Service sender address on an onboarded domain */
  EMAIL_FROM?: string;
  /** 'true' to return OTP codes in API responses during a supervised demo */
  OTP_ECHO?: string;
  /** Shared code that unlocks demo role sign-in on production */
  DEMO_ACCESS_CODE?: string;
  /** Pepper for one-time-code hashes (falls back to JWT_SECRET) */
  OTP_PEPPER?: string;
  /** Zalo App Secret — xác minh access token của Zalo Mini App (appsecret_proof) */
  ZALO_APP_SECRET?: string;
  /** Section 24 DURABLE OBJECTS — PartnerInboxRoom. Optional: chưa provision qua `wrangler deploy`. */
  PARTNER_INBOX_DO?: DurableObjectNamespace;
}
