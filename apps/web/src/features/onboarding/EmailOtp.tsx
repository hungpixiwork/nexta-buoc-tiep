import { useState } from 'react';
import { KeyRound, Mail } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { errorText } from '../../app/errors';
import { Button, ErrorBanner, Field, TextInput } from '../../design/ui';
import { apiFetch, type Session } from '../../lib/api';

/** Email one-time-code sign-in. Calls onSignedIn with the new session. */
export function EmailOtp({ onSignedIn, initialEmail = '' }: { onSignedIn: (s: Session) => void; initialEmail?: string }) {
  const { tx, s, lang } = useApp();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);

  const request = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await apiFetch<{ sent: boolean; devCode?: string }>('/api/auth/otp/request', { method: 'POST', body: { email, lang }, auth: false });
      setSent(true);
      setDevCode(r.devCode ?? null);
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await apiFetch<{ token: string; account: Session['account'] }>('/api/auth/otp/verify', { method: 'POST', body: { email, code }, auth: false });
      onSignedIn({ token: r.token, account: r.account });
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          request();
        }}
        className="space-y-3"
      >
        <Field label={tx({ vi: 'Email công việc', en: 'Work email' })} htmlFor="otp-email" hint={tx({ vi: 'Nên dùng email theo tên miền của tổ chức — hồ sơ được duyệt nhanh hơn.', en: 'An email on your organisation’s domain speeds up review.' })}>
          <TextInput id="otp-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={sent} />
        </Field>
        {!sent && (
          <Button type="submit" block size="lg" icon={<Mail className="size-5" />} loading={busy} disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)}>
            {tx({ vi: 'Gửi mã xác thực', en: 'Send code' })}
          </Button>
        )}
      </form>

      {sent && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
          className="space-y-3"
        >
          {devCode ? (
            <p className="rounded-xl border border-warn-line bg-warn-soft p-3 text-sm text-warn">
              {tx({ vi: 'Chưa cấu hình gửi email (môi trường thử nghiệm). Mã của bạn:', en: 'Email sending is not configured (test environment). Your code:' })}{' '}
              <strong className="tabular text-base tracking-widest">{devCode}</strong>
            </p>
          ) : (
            <p className="text-sm text-muted">{tx({ vi: `Đã gửi mã 6 số tới ${email}. Mã có hiệu lực 10 phút.`, en: `We sent a 6-digit code to ${email}. It expires in 10 minutes.` })}</p>
          )}
          <Field label={tx({ vi: 'Mã 6 số', en: '6-digit code' })} htmlFor="otp-code">
            <TextInput id="otp-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="tabular text-lg tracking-[0.4em]" />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="lg" icon={<KeyRound className="size-5" />} loading={busy} disabled={code.length !== 6} className="flex-1">
              {s.common.confirm}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => {
                setSent(false);
                setCode('');
                setDevCode(null);
              }}
            >
              {tx({ vi: 'Đổi email', en: 'Change email' })}
            </Button>
          </div>
        </form>
      )}
      {err != null && <ErrorBanner title={s.common.errorTitle} message={errorText(err, lang)} />}
    </div>
  );
}
