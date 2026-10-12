/**
 * A1 Đăng nhập. Người dùng: người đồng hành, điều phối viên. Việc chính: vào app bằng Zalo.
 * Lần đầu: Zalo chưa gắn tài khoản → nhập email, nhận mã → gắn luôn; lần sau chỉ cần 1 chạm.
 */
import { useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import { requestEmailCode, signInWithZalo, verifyEmailCode } from '../lib/api';
import { errorText } from '../lib/labels';
import { useLang } from '../lib/i18n';
import HeaderShieldIcon from '../components/icons/header-shield';
import { inZalo, zaloAccessToken } from '../lib/platform';
import { useSession } from '../lib/session';
import { SupportCall } from '../components/SupportCall';
import { Alert, BrandMark, Button, Card, Field, MiniSteps, TextInput } from '../components/ui';

type Step = 'start' | 'email' | 'code';

export function LoginPage() {
  const { tx, lang } = useLang();
  const { signIn } = useSession();
  const [step, setStep] = useState<Step>('start');
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [zaloName, setZaloName] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errorText(e, lang));
    } finally {
      setBusy(false);
    }
  };

  const zaloLogin = () =>
    run(async () => {
      const token = await zaloAccessToken();
      if (!token) {
        setError(tx({ vi: 'Đăng nhập Zalo chỉ dùng được khi mở trong ứng dụng Zalo. Bạn có thể dùng mã qua email.', en: 'Zalo sign-in only works inside the Zalo app. You can use an email code instead.' }));
        return;
      }
      const r = await signInWithZalo(token);
      if (r.linked) return signIn(r.session);
      setLinkToken(r.linkToken);
      setZaloName(r.zaloName);
      setStep('email');
    });

  const sendCode = () =>
    run(async () => {
      const r = await requestEmailCode(email.trim(), lang);
      setDevCode(r.devCode ?? null);
      setStep('code');
    });

  const checkCode = () =>
    run(async () => {
      const s = await verifyEmailCode(email.trim(), code.trim(), linkToken);
      signIn({ token: s.token, account: s.account });
    });

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 pb-10 pt-[calc(env(safe-area-inset-top,0px)+40px)]">
      <div className="absolute inset-x-0 top-0 h-[300px] bg-gradient-to-br from-highlight from-[1.36%] to-background to-[61.49%]" />
      <HeaderShieldIcon className="absolute right-0 top-0" />
      <div className="animate-enter relative mx-auto max-w-md">
        <BrandMark size="lg" />
        <h1 className="mt-6 text-display font-semibold text-fg">{tx({ vi: 'Bước tiếp an toàn của bạn', en: 'Your next safe step' })}</h1>
        <p className="mt-2 text-body text-fg-2">
          {tx({ vi: 'Cùng người đang gặp khó tìm tới nơi hỗ trợ đã xác minh — rồi hỏi thăm lại xem họ đã ổn hơn chưa.', en: "Walk with people facing hardship to verified support — then check back that they're better." })}
        </p>

        <Card className="mt-6 space-y-4">
          {step === 'start' && (
            <>
              <Button size="lg" full loading={busy} onClick={zaloLogin} icon={<ArrowRight className="size-5" strokeWidth={1.75} />}>
                {tx({ vi: 'Tiếp tục với Zalo', en: 'Continue with Zalo' })}
              </Button>
              <Button variant="secondary" full onClick={() => (setError(null), setStep('email'))} icon={<Mail className="size-5" strokeWidth={1.75} />}>
                {tx({ vi: 'Dùng mã qua email', en: 'Use an email code' })}
              </Button>
              {!inZalo() && <p className="text-small text-fg-2">{tx({ vi: 'Bạn đang mở ngoài Zalo — dùng mã qua email sẽ nhanh hơn.', en: "You're outside Zalo — an email code is quicker." })}</p>}
            </>
          )}

          {step === 'email' && (
            <>
              <MiniSteps total={2} current={1} label={tx({ vi: 'Nhập email', en: 'Enter email' })} />
              {linkToken && (
                <p className="rounded-[var(--radius-control)] bg-surface-soft p-3 text-body text-fg">
                  {tx({ vi: `Chào ${zaloName ?? 'bạn'}! Lần đầu dùng: nhập email tổ chức đã đăng ký cho bạn. Lần sau chỉ cần 1 chạm.`, en: `Hi ${zaloName ?? 'there'}! First time: enter the email your organisation registered. Next time it's one tap.` })}
                </p>
              )}
              <Field label="Email">
                <TextInput type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ten@tochuc.vn" />
              </Field>
              <Button size="lg" full loading={busy} disabled={!/^\S+@\S+\.\S{2,}$/.test(email.trim())} onClick={sendCode}>
                {tx({ vi: 'Gửi mã cho tôi', en: 'Send me a code' })}
              </Button>
              <Button variant="ghost" full onClick={() => (setStep('start'), setLinkToken(null), setError(null))}>
                {tx({ vi: 'Quay lại', en: 'Back' })}
              </Button>
            </>
          )}

          {step === 'code' && (
            <>
              <MiniSteps total={2} current={2} label={tx({ vi: 'Nhập mã', en: 'Enter code' })} />
              <p className="text-body text-fg">
                {tx({ vi: `Mã 6 số đã gửi tới ${email.trim()}. Mã dùng được 10 phút.`, en: `A 6-digit code was sent to ${email.trim()}. Valid for 10 minutes.` })}
              </p>
              {devCode && (
                <p className="rounded-[var(--radius-control)] bg-accent-soft p-3 text-small font-medium text-accent-ink">
                  {tx({ vi: 'Chế độ thử: mã là', en: 'Test mode: the code is' })} {devCode}
                </p>
              )}
              <Field label={tx({ vi: 'Mã 6 số', en: '6-digit code' })}>
                <TextInput inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="text-center text-2xl tracking-[0.4em]" />
              </Field>
              <Button size="lg" full loading={busy} disabled={code.length !== 6} onClick={checkCode}>
                {linkToken ? tx({ vi: 'Xác nhận và gắn Zalo', en: 'Confirm and link Zalo' }) : tx({ vi: 'Đăng nhập', en: 'Sign in' })}
              </Button>
              <Button variant="ghost" full onClick={() => (setStep('email'), setCode(''), setError(null))}>
                {tx({ vi: 'Đổi email / lấy mã mới', en: 'Change email / new code' })}
              </Button>
            </>
          )}

          {error && <Alert tone="danger">{error}</Alert>}
        </Card>

        <div className="mt-8 border-t border-line pt-5">
          <p className="mb-2 text-small text-fg-2">{tx({ vi: 'Gặp người đang nguy hiểm? Không cần đăng nhập:', en: 'Someone in danger? No sign-in needed:' })}</p>
          <SupportCall full />
        </div>
      </div>
    </div>
  );
}
