/**
 * Credential helpers for Workers (WebCrypto only).
 *
 * - Passwords: PBKDF2-SHA256, per-user salt. Legacy unsalted SHA-256 hashes are
 *   still accepted once and must be upgraded by the caller (`needsRehash`).
 * - One-time codes: 6 digits, stored only as a keyed hash, short TTL, attempt cap.
 */

const enc = new TextEncoder();
const PBKDF2_ITERATIONS = 100_000;

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const fromHex = (hex: string): Uint8Array<ArrayBuffer> => new Uint8Array((hex.match(/.{2}/g) ?? []).map((h) => parseInt(h, 16)));

/** Constant-time comparison of two hex/ascii strings. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return toHex(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${await pbkdf2(password, salt, PBKDF2_ITERATIONS)}`;
}

export async function sha256Hex(input: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(input)));
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<{ ok: boolean; needsRehash: boolean }> {
  if (!stored) return { ok: false, needsRehash: false };
  if (stored.startsWith('pbkdf2$')) {
    const [, iter, salt, hash] = stored.split('$');
    const candidate = await pbkdf2(password, fromHex(salt), Number(iter));
    return { ok: safeEqual(candidate, hash), needsRehash: Number(iter) < PBKDF2_ITERATIONS };
  }
  // Legacy: unsalted SHA-256 hex
  const legacy = await sha256Hex(password);
  const ok = safeEqual(legacy, stored);
  return { ok, needsRehash: ok };
}

// ---------------------------------------------------------------------------
// One-time codes
// ---------------------------------------------------------------------------

export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(n).padStart(6, '0');
}

export async function hashOtp(email: string, code: string, pepper: string): Promise<string> {
  return sha256Hex(`${pepper}:${email.trim().toLowerCase()}:${code}`);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
