/**
 * Chào mừng — sau khi đăng nhập mà chưa có vai người đồng hành.
 * 1 nút chính "Trải nghiệm ngay" (sandbox riêng, đủ tính năng) · 1 nút phụ "Đăng ký làm người đồng hành".
 * Vai tổ chức / đơn vị hỗ trợ / điều phối viên → làm việc trên web.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarHeart, ExternalLink, HeartHandshake, LogOut, UserPlus } from 'lucide-react';
import { onboarding, startTrial, uiRole } from '../lib/api';
import { useLang } from '../lib/i18n';
import HeaderShieldIcon from '../components/icons/header-shield';
import { errorText } from '../lib/labels';
import { openExternal } from '../lib/platform';
import { useSession } from '../lib/session';
import { Alert, BrandMark, Button, Card } from '../components/ui';
import { JoinStatus } from './join';

const WEB_URL = (import.meta.env.VITE_WEB_URL as string | undefined) ?? 'https://buoc-tiep-web.pages.dev';

export function WelcomePage() {
  const { tx, lang } = useLang();
  const navigate = useNavigate();
  const { session, signIn, signOut } = useSession();
  const role = uiRole(session?.account.role);
  const applicant = role === 'applicant';
  const apps = useQuery({ queryKey: ['onboarding', 'apps'], queryFn: onboarding.myApplications, enabled: applicant });
  const latest = apps.data?.find((a) => a.kind === 'VOLUNTEER');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tryNow = async () => {
    setBusy(true);
    setError(null);
    try {
      signIn(await startTrial());
    } catch (e) {
      setError(errorText(e, lang));
    } finally {
      setBusy(false);
    }
  };

  const steps = [
    { icon: <UserPlus className="size-5" strokeWidth={1.75} aria-hidden />, text: tx({ vi: 'Gặp người cần giúp, hỏi sự đồng ý', en: 'Meet someone, ask consent' }) },
    { icon: <HeartHandshake className="size-5" strokeWidth={1.75} aria-hidden />, text: tx({ vi: 'Đưa họ tới nơi hỗ trợ đã xác minh', en: 'Connect them to verified support' }) },
    { icon: <CalendarHeart className="size-5" strokeWidth={1.75} aria-hidden />, text: tx({ vi: 'Hỏi thăm lại xem họ đã ổn hơn chưa', en: "Check back that they're better" }) },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 pb-10 pt-[calc(env(safe-area-inset-top,0px)+40px)]">
      <div className="absolute inset-x-0 top-0 h-[300px] bg-gradient-to-br from-highlight from-[1.36%] to-background to-[61.49%]" />
      <HeaderShieldIcon className="absolute right-0 top-0" />
      <div className="animate-enter relative mx-auto max-w-md space-y-5">
        <BrandMark size="lg" />
        <div>
          <h1 className="text-display font-semibold text-fg">
            {session?.account.fullName ? tx({ vi: `Chào ${session.account.fullName}`, en: `Hi ${session.account.fullName}` }) : tx({ vi: 'Chào mừng tới NEXTA', en: 'Welcome to NEXTA' })}
          </h1>
          <p className="mt-1 text-body text-fg-2">{tx({ vi: 'Không cần giải quyết mọi thứ ngay. Mỗi lần một bước an toàn.', en: "You don't have to solve everything now. One safe step at a time." })}</p>
        </div>

        {applicant ? (
          <>
            <Card>
              <ol className="space-y-3">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-ink">{s.icon}</span>
                    <span className="text-body text-fg">{s.text}</span>
                  </li>
                ))}
              </ol>
            </Card>

            <div className="space-y-2">
              <Button size="lg" full loading={busy} icon={<ArrowRight className="size-5" strokeWidth={1.75} />} onClick={tryNow}>
                {tx({ vi: 'Trải nghiệm ngay', en: 'Try it now' })}
              </Button>
              <p className="text-center text-caption text-fg-2">{tx({ vi: 'Có sẵn 2 người mẫu. Dữ liệu chỉ mình bạn thấy, không gửi đi đâu.', en: 'Two sample people included. Only you can see this data; nothing is sent.' })}</p>
            </div>
            {error && <Alert tone="danger">{error}</Alert>}

            {latest && latest.status !== 'REJECTED' ? (
              <JoinStatus app={latest} />
            ) : (
              <Button full variant="secondary" icon={<UserPlus className="size-5" strokeWidth={1.75} />} onClick={() => navigate('/join')}>
                {tx({ vi: 'Đăng ký làm người đồng hành', en: 'Apply to be a navigator' })}
              </Button>
            )}
          </>
        ) : (
          <Card className="space-y-3">
            <p className="text-card font-semibold text-fg">{tx({ vi: 'Vai trò của bạn làm việc trên web', en: 'Your role works on the web app' })}</p>
            <p className="text-body text-fg-2">
              {tx({ vi: 'Mini App dành cho người đồng hành ngoài đường. Tổ chức, đơn vị hỗ trợ và điều phối viên duyệt, nhận chuyển gửi và theo dõi trên bản web.', en: 'The Mini App is for navigators in the field. Organisations, services and coordinators review, receive referrals and follow up on the web.' })}
            </p>
            <Button full icon={<ExternalLink className="size-5" strokeWidth={1.75} />} onClick={() => openExternal(WEB_URL)}>
              {tx({ vi: 'Mở bản web', en: 'Open the web app' })}
            </Button>
          </Card>
        )}

        <Button full variant="ghost" icon={<LogOut className="size-5" strokeWidth={1.75} />} onClick={signOut}>
          {tx({ vi: 'Đăng xuất', en: 'Sign out' })} · {session?.account.email}
        </Button>
      </div>
    </div>
  );
}
