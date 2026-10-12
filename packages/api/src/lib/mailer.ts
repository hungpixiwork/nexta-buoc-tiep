/**
 * Transactional email via Cloudflare Email Service (Workers `send_email` binding).
 *
 * Needs a domain onboarded to Email Sending (`wrangler email sending enable <domain>`),
 * a `send_email` binding named EMAIL and the EMAIL_FROM var. Until then the API runs in
 * "echo" mode: outside production — or when OTP_ECHO is set for a supervised demo —
 * the code is returned to the caller instead of being emailed.
 */
import type { Env } from '../bindings';

export interface MailResult {
  delivered: boolean;
  /** Only present in echo mode */
  echoCode?: string;
  error?: string;
}

export function canEcho(env: Env): boolean {
  return env.ENVIRONMENT !== 'production' || env.OTP_ECHO === 'true';
}

export async function sendOtpEmail(env: Env, to: string, code: string, lang: 'vi' | 'en' = 'vi'): Promise<MailResult> {
  const subject = lang === 'vi' ? `Mã đăng nhập NEXTA: ${code}` : `Your NEXTA sign-in code: ${code}`;
  const text =
    lang === 'vi'
      ? `Mã đăng nhập NEXTA của bạn là ${code}. Mã có hiệu lực 10 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.`
      : `Your NEXTA sign-in code is ${code}. It expires in 10 minutes. If you did not request it, ignore this email.`;
  const html = `<div style="font-family:system-ui,sans-serif;color:#0f172a"><p>${text.replace(code, `<strong style="font-size:22px;letter-spacing:4px">${code}</strong>`)}</p></div>`;

  const binding = (env as any).EMAIL as { send?: (m: unknown) => Promise<{ messageId: string }> } | undefined;
  if (binding?.send && env.EMAIL_FROM) {
    try {
      await binding.send({ to, from: { email: env.EMAIL_FROM, name: 'NEXTA' }, subject, text, html });
      return { delivered: true };
    } catch (err: any) {
      if (canEcho(env)) return { delivered: false, echoCode: code, error: err?.code ?? 'SEND_FAILED' };
      return { delivered: false, error: err?.code ?? 'SEND_FAILED' };
    }
  }
  if (canEcho(env)) {
    console.log(`[NEXTA OTP echo] ${to}: ${code}`);
    return { delivered: false, echoCode: code };
  }
  return { delivered: false, error: 'EMAIL_NOT_CONFIGURED' };
}
