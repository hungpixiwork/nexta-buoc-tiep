import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Building2, Eye, HandHeart, Landmark, ShieldCheck } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { errorText } from '../../app/errors';
import { Badge, Button, Card, ErrorBanner, Field, PageHeader, Select, Spinner, TextArea, TextInput } from '../../design/ui';
import { Markdown } from '../../design/Markdown';
import { uiRole, type Session } from '../../lib/api';
import { useApiMutation } from '../../lib/hooks';
import { EmailOtp } from './EmailOtp';
import { useAgreement } from './data';

export function homeFor(role: string): string {
  switch (uiRole(role)) {
    case 'partner':
      return '/partner';
    case 'coordinator':
      return '/admin/approvals';
    case 'host':
      return '/coordinator';
    case 'observer':
      return '/coordinator';
    case 'navigator':
      return '/training';
    default:
      return '/join/status';
  }
}

export function LoginPage() {
  const { tx, signIn } = useApp();
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-md">
      <PageHeader
        title={tx({ vi: 'Đăng nhập NEXTA', en: 'Sign in to NEXTA' })}
        description={tx({ vi: 'Không cần mật khẩu. Nhập email, chúng tôi gửi mã 6 số.', en: 'No password. Enter your email and we send a 6-digit code.' })}
      />
      <Card className="p-5 sm:p-6">
        <EmailOtp
          onSignedIn={(s: Session) => {
            signIn(s);
            navigate(homeFor(s.account.role), { replace: true });
          }}
        />
      </Card>
      <p className="mt-4 text-center text-sm text-muted">
        {tx({ vi: 'Chưa có tài khoản?', en: 'No account yet?' })}{' '}
        <Link to="/join" className="font-semibold text-brand-strong underline">
          {tx({ vi: 'Đăng ký tham gia', en: 'Apply to join' })}
        </Link>
      </p>
    </div>
  );
}

export function JoinPage() {
  const { tx } = useApp();
  const cards: Array<{ to: string; icon: ReactNode; title: string; who: string; gets: string; time: string }> = [
    {
      to: '/join/partner',
      icon: <Building2 className="size-6" />,
      title: tx({ vi: 'Đối tác cung cấp dịch vụ', en: 'Service partner' }),
      who: tx({ vi: 'NGO, trung tâm y tế, việc làm, học nghề, pháp lý, hành chính công…', en: 'NGOs, health, jobs, training, legal and public service centres…' }),
      gets: tx({ vi: 'Nhận đúng người đã được lắng nghe và đồng ý; hộp chuyển gửi riêng; số liệu kết quả.', en: 'Receive people already heard and consenting; your own referral inbox; outcome data.' }),
      time: tx({ vi: '~10 phút · duyệt trong 3 ngày làm việc', en: '~10 min · reviewed within 3 working days' }),
    },
    {
      to: '/join/volunteer',
      icon: <HandHeart className="size-6" />,
      title: tx({ vi: 'Tình nguyện viên (Youth Navigator)', en: 'Volunteer (Youth Navigator)' }),
      who: tx({ vi: 'Từ 18 tuổi, sống/học/làm ở Hóc Môn – Quận 12, 3+ giờ mỗi tuần.', en: '18+, living/studying/working in Hóc Môn – District 12, 3+ hours a week.' }),
      gets: tx({ vi: 'Đào tạo 4 học phần, chứng nhận tham gia, đồng hành cùng điều phối viên.', en: 'Four training modules, a certificate, and a coordinator by your side.' }),
      time: tx({ vi: '~8 phút · đơn vị chủ trì duyệt', en: '~8 min · approved by your host organisation' }),
    },
    {
      to: '/join/host',
      icon: <Landmark className="size-6" />,
      title: tx({ vi: 'Đơn vị chủ trì Living Lab', en: 'Living Lab host organisation' }),
      who: tx({ vi: 'UBND xã/phường, Đoàn, Hội LHPN, trường ĐH, NGO có tư cách pháp nhân.', en: 'Ward/commune committees, Youth Union, Women’s Union, universities, registered NGOs.' }),
      gets: tx({ vi: 'Điều phối đội Navigator của đơn vị, duyệt tình nguyện viên, số liệu địa bàn.', en: 'Run your own Navigator team, approve volunteers, see your area’s results.' }),
      time: tx({ vi: '~12 phút · duyệt trong 5 ngày làm việc', en: '~12 min · reviewed within 5 working days' }),
    },
    {
      to: '/join/observer',
      icon: <Eye className="size-6" />,
      title: tx({ vi: 'Nhà tài trợ / Quan sát viên', en: 'Funder / Observer' }),
      who: tx({ vi: 'Nhà tài trợ, ban tổ chức chương trình, cơ quan nghiên cứu.', en: 'Funders, programme organisers, researchers.' }),
      gets: tx({ vi: 'Xem số liệu tổng hợp theo thời gian thực — không có dữ liệu cá nhân.', en: 'Live aggregate results — never personal data.' }),
      time: tx({ vi: '~5 phút', en: '~5 min' }),
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="NEXTA · Living Lab"
        title={tx({ vi: 'Cùng xây một vòng hỗ trợ không bỏ ai lại phía sau', en: 'Build a support loop that leaves no one behind' })}
        description={tx({
          vi: 'Mọi hồ sơ được hệ thống tự kiểm tra, sau đó một người có trách nhiệm phê duyệt. Không thu phí, không quyên góp qua ứng dụng.',
          en: 'Every application is checked automatically, then approved by an accountable person. No fees, no fundraising through the app.',
        })}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="card group flex flex-col p-5 transition-colors hover:border-brand">
            <span className="grid size-12 place-items-center rounded-xl bg-brand-soft text-brand-strong">{c.icon}</span>
            <p className="mt-3 text-lg font-bold text-ink">{c.title}</p>
            <p className="mt-1 text-[15px] text-muted">{c.who}</p>
            <p className="mt-2 text-[15px] text-ink-2">{c.gets}</p>
            <div className="mt-auto flex items-center justify-between pt-4">
              <Badge>{c.time}</Badge>
              <ArrowRight className="size-5 text-brand transition-transform group-hover:translate-x-1" aria-hidden />
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-6 flex items-start gap-2 rounded-xl border border-line bg-surface p-4 text-sm text-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-step" aria-hidden />
        {tx({
          vi: 'Người cần hỗ trợ không cần đăng ký — Youth Navigator sẽ đồng hành cùng họ. Trong tình huống khẩn cấp, gọi 111 (trẻ em), 113, 115.',
          en: 'People seeking help do not need to register — a Youth Navigator walks with them. In an emergency call 111 (children), 113, 115.',
        })}
      </p>
    </>
  );
}

export function LegalPage() {
  const { code = 'TERMS' } = useParams();
  const { lang, s } = useApp();
  const a = useAgreement(code);
  if (a.isLoading) return <Spinner label={s.common.loading} />;
  if (a.error || !a.data) return <ErrorBanner title={s.common.errorTitle} message={errorText(a.error, lang)} />;
  return (
    <article className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand">
        {a.data.code} · v{a.data.version}
      </p>
      <p className="mt-1 text-[15px] text-muted">{a.data.summary[lang]}</p>
      <Card className="mt-4 p-5 sm:p-7">
        <Markdown source={a.data.body} />
      </Card>
      <p className="mt-3 break-all text-xs text-muted">SHA-256: {a.data.sha256}</p>
    </article>
  );
}

export function PrivacyPage() {
  const { tx, s, lang } = useApp();
  const [kind, setKind] = useState('ACCESS');
  const [email, setEmail] = useState('');
  const [alias, setAlias] = useState('');
  const [details, setDetails] = useState('');
  const submit = useApiMutation<Record<string, unknown>, { request: { id: string; dueAt: string } }>('/api/v1/onboarding/privacy/requests', 'POST', false);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={tx({ vi: 'Quyền đối với dữ liệu cá nhân', en: 'Your personal data rights' })}
        description={tx({
          vi: 'Theo Luật Bảo vệ dữ liệu cá nhân 2025, bạn có quyền biết, xem, sửa, xóa, rút đồng ý và khiếu nại. Navigator có thể gửi yêu cầu thay người dân. Phản hồi trong tối đa 10 ngày làm việc.',
          en: 'Under the 2025 Personal Data Protection Law you may know, access, correct, delete, withdraw consent and complain. A Navigator can file on someone’s behalf. We respond within 10 working days.',
        })}
      />
      <Card className="p-5 sm:p-6">
        {submit.data ? (
          <p className="rounded-xl bg-step-soft p-4 text-step">
            {tx({ vi: 'Đã nhận yêu cầu. Mã:', en: 'Request received. Reference:' })} <strong>{submit.data.request.id}</strong>
          </p>
        ) : (
          <div className="grid gap-4">
            <Field label={tx({ vi: 'Loại yêu cầu', en: 'Request type' })} htmlFor="dsr-kind">
              <Select id="dsr-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="ACCESS">{tx({ vi: 'Xem dữ liệu của tôi', en: 'See my data' })}</option>
                <option value="CORRECT">{tx({ vi: 'Sửa dữ liệu', en: 'Correct my data' })}</option>
                <option value="DELETE">{tx({ vi: 'Xóa dữ liệu', en: 'Delete my data' })}</option>
                <option value="WITHDRAW_CONSENT">{tx({ vi: 'Rút lại đồng ý', en: 'Withdraw consent' })}</option>
                <option value="OBJECT">{tx({ vi: 'Phản đối xử lý', en: 'Object to processing' })}</option>
                <option value="COMPLAINT">{tx({ vi: 'Khiếu nại', en: 'Complaint' })}</option>
              </Select>
            </Field>
            <Field label={tx({ vi: 'Email liên hệ', en: 'Contact email' })} htmlFor="dsr-email" optionalLabel={s.common.optional}>
              <TextInput id="dsr-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label={tx({ vi: 'Bí danh hành trình (nếu Navigator gửi thay)', en: 'Journey alias (if filed by a Navigator)' })} htmlFor="dsr-alias" optionalLabel={s.common.optional}>
              <TextInput id="dsr-alias" value={alias} onChange={(e) => setAlias(e.target.value)} maxLength={60} />
            </Field>
            <Field label={tx({ vi: 'Nội dung', en: 'Details' })} htmlFor="dsr-details">
              <TextArea id="dsr-details" rows={4} value={details} onChange={(e) => setDetails(e.target.value)} maxLength={2000} />
            </Field>
            {submit.error && <ErrorBanner title={s.common.errorTitle} message={errorText(submit.error, lang)} />}
            <div className="flex justify-end">
              <Button disabled={details.trim().length < 5} loading={submit.isPending} onClick={() => submit.mutate({ kind, email: email.trim() || null, caseAlias: alias.trim() || null, details: details.trim() })}>
                {tx({ vi: 'Gửi yêu cầu', en: 'Submit request' })}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
