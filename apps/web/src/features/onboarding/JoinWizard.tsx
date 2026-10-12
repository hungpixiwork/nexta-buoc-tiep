import { useMemo, useState, type ReactNode } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { CheckCircle2, FileText, Plus, Trash2 } from 'lucide-react';
import { NEED_CATEGORIES } from '@buoc-tiep/shared';
import { useApp } from '../../app/AppContext';
import { errorText } from '../../app/errors';
import { Badge, Button, Card, Chip, Dialog, ErrorBanner, Field, PageHeader, Select, Spinner, TextArea, TextInput, Toggle, cx } from '../../design/ui';
import { Markdown } from '../../design/Markdown';
import { ApiError } from '../../lib/api';
import { fmtDate } from '../../lib/format';
import { useApiMutation } from '../../lib/hooks';
import { EmailOtp } from './EmailOtp';
import { REQUIRED, useAgreement, useAgreements, useHosts, type AppKind } from './data';

const KIND_OF: Record<string, AppKind> = { partner: 'PARTNER', volunteer: 'VOLUNTEER', host: 'HOST', observer: 'OBSERVER' };
const AREAS = ['Hóc Môn', 'Quận 12', 'Toàn TP.HCM'];
const LEGAL_FORMS = ['PUBLIC_UNIT', 'MASS_ORG', 'NGO', 'UNIVERSITY', 'SOCIAL_ENTERPRISE', 'RELIGIOUS', 'ENTERPRISE_CSR', 'INFORMAL_GROUP'] as const;
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

type Service = {
  serviceName: string;
  category: string;
  description: string;
  serviceArea: string[];
  address: string;
  hours: string;
  days: string[];
  minAge: string;
  acceptsReferral: boolean;
  feeFree: boolean;
  capacityPerWeek: string;
};
const emptyService = (): Service => ({ serviceName: '', category: 'employment', description: '', serviceArea: ['Hóc Môn'], address: '', hours: '07:30-17:00', days: ['mon', 'tue', 'wed', 'thu', 'fri'], minAge: '18', acceptsReferral: true, feeFree: true, capacityPerWeek: '' });

const opt = (v: string) => (v.trim() ? v.trim() : null);
const num = (v: string) => (v.trim() ? Number(v) : null);

export function JoinWizard() {
  const { kind: kindParam = '' } = useParams();
  const kind = KIND_OF[kindParam];
  const { tx, s, lang, session, signIn } = useApp();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Record<string, any>>({ legalForm: 'NGO', district: 'Hóc Môn', pilotAreas: ['Hóc Môn'], weekdays: true, weekends: false, hours: '4', expected: '10', startMonth: new Date().toISOString().slice(0, 7) });
  const [services, setServices] = useState<Service[]>([emptyService()]);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [reading, setReading] = useState<string | null>(null);
  const agreements = useAgreements();
  const hosts = useHosts();
  const submit = useApiMutation<Record<string, unknown>, { application: { id: string; code: string; slaDueAt: string } }>('/api/v1/onboarding/applications');

  const set = (k: string) => (v: any) => setF((x) => ({ ...x, [k]: v }));
  const text = (k: string) => ({ value: f[k] ?? '', onChange: (e: { target: { value: string } }) => set(k)(e.target.value) });

  const titles: Record<AppKind, { vi: string; en: string }> = {
    PARTNER: { vi: 'Đăng ký Đối tác cung cấp dịch vụ', en: 'Register as a service partner' },
    VOLUNTEER: { vi: 'Đăng ký Tình nguyện viên (Youth Navigator)', en: 'Apply as a Youth Navigator' },
    HOST: { vi: 'Đăng ký Đơn vị chủ trì Living Lab', en: 'Register as a Living Lab host' },
    OBSERVER: { vi: 'Đăng ký Nhà tài trợ / Quan sát viên', en: 'Register as a funder / observer' },
  };

  const steps = useMemo(() => {
    const base: Record<AppKind, string[]> = {
      PARTNER: [tx({ vi: 'Tổ chức', en: 'Organisation' }), tx({ vi: 'Dịch vụ', en: 'Services' })],
      VOLUNTEER: [tx({ vi: 'Về bạn', en: 'About you' }), tx({ vi: 'Thời gian & tham chiếu', en: 'Time & reference' })],
      HOST: [tx({ vi: 'Tổ chức', en: 'Organisation' }), tx({ vi: 'Đầu mối & pilot', en: 'Leads & pilot' })],
      OBSERVER: [tx({ vi: 'Tổ chức & mục đích', en: 'Organisation & purpose' })],
    };
    return [tx({ vi: 'Xác thực email', en: 'Verify email' }), ...(kind ? base[kind] : []), tx({ vi: 'Cam kết & ký', en: 'Agreements & sign' })];
  }, [kind, tx]);

  if (!kind) return <Navigate to="/join" replace />;
  const current = session ? Math.max(step, 1) : 0;
  const last = steps.length - 1;
  const email = session?.account.email ?? '';

  const payload = (): Record<string, unknown> => {
    const org = { legalName: f.legalName, shortName: opt(f.shortName ?? ''), legalForm: f.legalForm, registrationRef: opt(f.registrationRef ?? ''), district: f.district, address: f.address, website: opt(f.website ?? ''), publicSourceUrl: opt(f.publicSourceUrl ?? '') };
    switch (kind) {
      case 'PARTNER':
        return {
          org,
          contact: { fullName: f.contactName, title: f.contactTitle, email, phone: f.contactPhone },
          services: services.map((sv) => ({
            serviceName: sv.serviceName,
            category: sv.category,
            description: sv.description,
            serviceArea: sv.serviceArea,
            address: opt(sv.address),
            hours: opt(sv.hours),
            days: sv.days,
            minAge: num(sv.minAge),
            targetGroups: [],
            acceptsReferral: sv.acceptsReferral,
            feeFree: sv.feeFree,
            capacityPerWeek: num(sv.capacityPerWeek),
          })),
        };
      case 'VOLUNTEER':
        return {
          fullName: f.fullName,
          birthYear: Number(f.birthYear),
          phone: opt(f.phone ?? ''),
          district: f.district,
          ward: opt(f.ward ?? ''),
          hostOrgId: opt(f.hostOrgId ?? ''),
          availability: { weekdays: Boolean(f.weekdays), weekends: Boolean(f.weekends), hoursPerWeek: Number(f.hours || 0) },
          languages: ['vi'],
          motivation: f.motivation,
          experience: opt(f.experience ?? ''),
          reference: { name: f.refName, relation: f.refRelation, contact: f.refContact },
          safeguardingDeclaration: { priorConcern: Boolean(f.priorConcern), details: opt(f.priorDetails ?? '') },
        };
      case 'HOST':
        return {
          org,
          representative: { fullName: f.repName, title: f.repTitle, email },
          dpoContact: { fullName: f.dpoName, email: f.dpoEmail },
          safeguardingContact: { fullName: f.sgName, email: f.sgEmail, phone: f.sgPhone },
          pilot: { areas: f.pilotAreas, expectedNavigators: Number(f.expected || 0), startMonth: f.startMonth },
        };
      case 'OBSERVER':
        return { org: { legalName: f.legalName, website: opt(f.website ?? '') }, contact: { fullName: f.contactName, title: f.contactTitle, email }, purpose: f.purpose };
    }
  };

  const required = REQUIRED[kind];
  const metas = (agreements.data ?? []).filter((a) => required.includes(a.code));
  const issues = submit.error instanceof ApiError ? ((submit.error.details as any)?.issues as Array<{ path: (string | number)[]; message: string }> | undefined) : undefined;

  if (submit.data) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="p-6 text-center">
          <CheckCircle2 className="mx-auto size-12 text-step" aria-hidden />
          <h1 className="mt-3 text-2xl font-bold text-ink">{tx({ vi: 'Đã nhận hồ sơ', en: 'Application received' })}</h1>
          <p className="mt-2 text-[15px] text-muted">
            {tx({ vi: 'Mã hồ sơ', en: 'Reference' })} <strong className="tabular text-ink">{submit.data.application.code}</strong>.{' '}
            {tx({ vi: 'Hệ thống đã tự kiểm tra; một điều phối viên sẽ phản hồi trước', en: 'It has been screened automatically; a coordinator will respond by' })}{' '}
            <strong className="text-ink">{fmtDate(submit.data.application.slaDueAt, lang)}</strong>.
          </p>
          <Link to="/join/status" className="mt-5 inline-block">
            <Button size="lg">{s.nav.myApplication}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const Stepper = (
    <ol className="mb-6 flex flex-wrap gap-2">
      {steps.map((label, i) => (
        <li key={label} className={cx('flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold', i < current ? 'border-step-line bg-step-soft text-step' : i === current ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-muted')}>
          <span className="tabular">{i + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  );

  const Nav = ({ canNext, next }: { canNext: boolean; next?: ReactNode }) => (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
      <Button variant="secondary" onClick={() => setStep(Math.max(1, current - 1))} disabled={current <= 1}>
        {s.common.back}
      </Button>
      {next ?? (
        <Button size="lg" disabled={!canNext} onClick={() => setStep(current + 1)}>
          {s.common.continue}
        </Button>
      )}
    </div>
  );

  const orgFields = (withRegistration = true) => (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label={tx({ vi: 'Tên tổ chức (theo quyết định thành lập/đăng ký)', en: 'Legal name' })} htmlFor="legalName">
          <TextInput id="legalName" maxLength={200} {...text('legalName')} />
        </Field>
      </div>
      <Field label={tx({ vi: 'Loại hình', en: 'Legal form' })} htmlFor="legalForm">
        <Select id="legalForm" {...text('legalForm')}>
          {LEGAL_FORMS.map((l) => (
            <option key={l} value={l}>
              {{ PUBLIC_UNIT: tx({ vi: 'Cơ quan / đơn vị sự nghiệp công', en: 'Public body / unit' }), MASS_ORG: tx({ vi: 'Tổ chức chính trị – xã hội (Đoàn, Hội…)', en: 'Mass organisation' }), NGO: tx({ vi: 'NGO / Hội / Quỹ đã đăng ký', en: 'Registered NGO / association / fund' }), UNIVERSITY: tx({ vi: 'Trường học / viện', en: 'University / institute' }), SOCIAL_ENTERPRISE: tx({ vi: 'Doanh nghiệp xã hội', en: 'Social enterprise' }), RELIGIOUS: tx({ vi: 'Tổ chức tôn giáo', en: 'Religious organisation' }), ENTERPRISE_CSR: tx({ vi: 'Doanh nghiệp (CSR)', en: 'Company (CSR)' }), INFORMAL_GROUP: tx({ vi: 'Nhóm chưa có pháp nhân', en: 'Informal group' }) }[l]}
            </option>
          ))}
        </Select>
      </Field>
      {withRegistration && (
        <Field label={tx({ vi: 'Số quyết định / đăng ký', en: 'Registration / decision no.' })} htmlFor="registrationRef" optionalLabel={s.common.optional}>
          <TextInput id="registrationRef" maxLength={120} {...text('registrationRef')} />
        </Field>
      )}
      <Field label={tx({ vi: 'Khu vực', en: 'Area' })} htmlFor="district">
        <Select id="district" {...text('district')}>
          {AREAS.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </Select>
      </Field>
      <Field label={tx({ vi: 'Địa chỉ', en: 'Address' })} htmlFor="address">
        <TextInput id="address" maxLength={300} {...text('address')} />
      </Field>
      <Field label="Website" htmlFor="website" optionalLabel={s.common.optional}>
        <TextInput id="website" type="url" placeholder="https://" {...text('website')} />
      </Field>
      <Field label={tx({ vi: 'Trang công khai để đối chiếu', en: 'Public page to cross-check' })} htmlFor="publicSourceUrl" optionalLabel={s.common.optional} hint={tx({ vi: 'VD trang trên cổng thông tin .gov.vn nêu tên đơn vị.', en: 'e.g. a .gov.vn page listing your organisation.' })}>
        <TextInput id="publicSourceUrl" type="url" placeholder="https://" {...text('publicSourceUrl')} />
      </Field>
    </div>
  );

  let body: ReactNode = null;

  if (current === 0) {
    body = (
      <Card className="mx-auto max-w-md p-5 sm:p-6">
        <p className="mb-4 text-[15px] text-muted">{tx({ vi: 'Xác thực email để lưu hồ sơ và nhận kết quả duyệt. Email này là tài khoản đăng nhập của bạn.', en: 'Verify your email to save the application and receive the decision. It becomes your sign-in.' })}</p>
        <EmailOtp onSignedIn={(ses) => (signIn(ses), setStep(1))} />
      </Card>
    );
  } else if (current === last) {
    const allAccepted = required.every((c) => accepted.includes(c));
    body = (
      <Card className="p-5 sm:p-6">
        <h2 className="text-xl font-bold text-ink">{tx({ vi: 'Đọc và chấp thuận các cam kết', en: 'Read and accept the commitments' })}</h2>
        <p className="mt-1 text-[15px] text-muted">{tx({ vi: 'Chấp thuận điện tử có giá trị như văn bản giấy (Luật Giao dịch điện tử 2023). NEXTA lưu phiên bản, mã băm văn bản và thời điểm bạn ký.', en: 'Electronic acceptance is as valid as paper (E-Transactions Law 2023). NEXTA records the version, text hash and time you signed.' })}</p>
        {agreements.isLoading && <Spinner label={s.common.loading} />}
        <ul className="mt-4 space-y-2">
          {metas.map((a) => (
            <li key={a.code} className="flex flex-col gap-2 rounded-xl border border-line p-3 sm:flex-row sm:items-center">
              <label className="flex flex-1 items-start gap-3">
                <input type="checkbox" className="mt-1 size-5" checked={accepted.includes(a.code)} onChange={(e) => setAccepted((x) => (e.target.checked ? [...x, a.code] : x.filter((y) => y !== a.code)))} />
                <span>
                  <span className="block font-semibold text-ink">{a.title[lang]}</span>
                  <span className="block text-sm text-muted">{a.summary[lang]}</span>
                </span>
              </label>
              <Button size="sm" variant="ghost" icon={<FileText className="size-4" />} onClick={() => setReading(a.code)}>
                {tx({ vi: 'Đọc toàn văn', en: 'Read in full' })}
              </Button>
            </li>
          ))}
        </ul>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label={tx({ vi: 'Họ tên người ký', en: 'Signer name' })} htmlFor="signerName">
            <TextInput id="signerName" value={signerName} onChange={(e) => setSignerName(e.target.value)} maxLength={80} />
          </Field>
          <Field label={tx({ vi: 'Chức danh', en: 'Title' })} htmlFor="signerTitle" optionalLabel={s.common.optional}>
            <TextInput id="signerTitle" value={signerTitle} onChange={(e) => setSignerTitle(e.target.value)} maxLength={80} />
          </Field>
        </div>
        {submit.error && (
          <div className="mt-4">
            <ErrorBanner title={s.common.errorTitle} message={errorText(submit.error, lang)} />
            {issues && (
              <ul className="mt-2 list-disc pl-5 text-sm text-danger">
                {issues.slice(0, 8).map((i, n) => (
                  <li key={n}>
                    <code>{i.path.join('.')}</code> — {i.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <Nav
          canNext={false}
          next={
            <Button
              variant="step"
              size="lg"
              disabled={!allAccepted || signerName.trim().length < 2}
              loading={submit.isPending}
              onClick={() =>
                submit.mutate({
                  kind,
                  payload: payload(),
                  signer: { fullName: signerName.trim(), title: signerTitle.trim() || null },
                  acceptedAgreements: metas.filter((m) => accepted.includes(m.code)).map((m) => ({ code: m.code, version: m.version, sha256: m.sha256 })),
                })
              }
            >
              {tx({ vi: 'Ký & gửi hồ sơ', en: 'Sign & submit' })}
            </Button>
          }
        />
        {reading && <AgreementDialog code={reading} onClose={() => setReading(null)} />}
      </Card>
    );
  } else if (kind === 'PARTNER' && current === 1) {
    body = (
      <Card className="p-5 sm:p-6">
        {orgFields()}
        <h3 className="mt-6 text-lg font-bold text-ink">{tx({ vi: 'Người liên hệ nhận chuyển gửi', en: 'Referral contact person' })}</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label={tx({ vi: 'Họ tên', en: 'Full name' })} htmlFor="contactName"><TextInput id="contactName" maxLength={80} {...text('contactName')} /></Field>
          <Field label={tx({ vi: 'Chức danh', en: 'Title' })} htmlFor="contactTitle"><TextInput id="contactTitle" maxLength={80} {...text('contactTitle')} /></Field>
          <Field label={tx({ vi: 'Điện thoại công việc', en: 'Work phone' })} htmlFor="contactPhone"><TextInput id="contactPhone" inputMode="tel" {...text('contactPhone')} /></Field>
        </div>
        <p className="mt-2 text-sm text-muted">Email: <strong>{email}</strong></p>
        <Nav canNext={Boolean(f.legalName && f.address && f.contactName && f.contactTitle && f.contactPhone)} />
      </Card>
    );
  } else if (kind === 'PARTNER' && current === 2) {
    const upd = (i: number, patch: Partial<Service>) => setServices((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
    body = (
      <div className="space-y-4">
        {services.map((sv, i) => (
          <Card key={i} className="p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">{tx({ vi: 'Dịch vụ', en: 'Service' })} {i + 1}</h3>
              {services.length > 1 && (
                <Button size="sm" variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => setServices((xs) => xs.filter((_, j) => j !== i))}>
                  {tx({ vi: 'Xóa', en: 'Remove' })}
                </Button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tx({ vi: 'Tên dịch vụ', en: 'Service name' })} htmlFor={`sn${i}`}><TextInput id={`sn${i}`} value={sv.serviceName} onChange={(e) => upd(i, { serviceName: e.target.value })} maxLength={200} /></Field>
              <Field label={tx({ vi: 'Loại hỗ trợ', en: 'Kind of support' })} htmlFor={`sc${i}`}>
                <Select id={`sc${i}`} value={sv.category} onChange={(e) => upd(i, { category: e.target.value })}>
                  {NEED_CATEGORIES.map((n) => <option key={n} value={n}>{s.need[n]}</option>)}
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field label={tx({ vi: 'Mô tả: ai được nhận, cần chuẩn bị gì, chi phí', en: 'Who is eligible, what to bring, any cost' })} htmlFor={`sd${i}`}>
                  <TextArea id={`sd${i}`} rows={3} value={sv.description} onChange={(e) => upd(i, { description: e.target.value })} maxLength={1500} className="min-h-[88px]" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <p className="mb-2 text-[15px] font-semibold text-ink">{tx({ vi: 'Phục vụ khu vực', en: 'Serves' })}</p>
                <div className="flex flex-wrap gap-2">{AREAS.map((a) => <Chip key={a} selected={sv.serviceArea.includes(a)} onClick={() => upd(i, { serviceArea: sv.serviceArea.includes(a) ? sv.serviceArea.filter((x) => x !== a) : [...sv.serviceArea, a] })}>{a}</Chip>)}</div>
              </div>
              <Field label={tx({ vi: 'Địa chỉ phục vụ', en: 'Service address' })} htmlFor={`sa${i}`} optionalLabel={s.common.optional}><TextInput id={`sa${i}`} value={sv.address} onChange={(e) => upd(i, { address: e.target.value })} /></Field>
              <Field label={tx({ vi: 'Giờ nhận', en: 'Hours' })} htmlFor={`sh${i}`}><TextInput id={`sh${i}`} value={sv.hours} onChange={(e) => upd(i, { hours: e.target.value })} placeholder="07:30-17:00" /></Field>
              <div className="sm:col-span-2">
                <p className="mb-2 text-[15px] font-semibold text-ink">{tx({ vi: 'Ngày trong tuần', en: 'Days' })}</p>
                <div className="flex flex-wrap gap-2">{DAYS.map((d) => <Chip key={d} selected={sv.days.includes(d)} onClick={() => upd(i, { days: sv.days.includes(d) ? sv.days.filter((x) => x !== d) : [...sv.days, d] })}>{d.toUpperCase()}</Chip>)}</div>
              </div>
              <Field label={tx({ vi: 'Tuổi tối thiểu', en: 'Minimum age' })} htmlFor={`sm${i}`}><TextInput id={`sm${i}`} inputMode="numeric" value={sv.minAge} onChange={(e) => upd(i, { minAge: e.target.value.replace(/\D/g, '').slice(0, 3) })} /></Field>
              <Field label={tx({ vi: 'Nhận tối đa mỗi tuần', en: 'Places per week' })} htmlFor={`sw${i}`} optionalLabel={s.common.optional}><TextInput id={`sw${i}`} inputMode="numeric" value={sv.capacityPerWeek} onChange={(e) => upd(i, { capacityPerWeek: e.target.value.replace(/\D/g, '').slice(0, 5) })} /></Field>
              <Toggle checked={sv.acceptsReferral} onChange={(v) => upd(i, { acceptsReferral: v })} label={tx({ vi: 'Nhận chuyển gửi có theo dõi', en: 'Accepts tracked referrals' })} />
              <Toggle checked={sv.feeFree} onChange={(v) => upd(i, { feeFree: v })} label={tx({ vi: 'Miễn phí cho người được giới thiệu', en: 'Free for referred people' })} />
            </div>
          </Card>
        ))}
        <Button variant="secondary" icon={<Plus className="size-4" />} onClick={() => setServices((xs) => [...xs, emptyService()])} disabled={services.length >= 10}>
          {tx({ vi: 'Thêm dịch vụ', en: 'Add service' })}
        </Button>
        <Nav canNext={services.every((sv) => sv.serviceName.trim().length >= 3 && sv.description.trim().length >= 10 && sv.serviceArea.length > 0)} />
      </div>
    );
  } else if (kind === 'VOLUNTEER' && current === 1) {
    body = (
      <Card className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tx({ vi: 'Họ tên', en: 'Full name' })} htmlFor="fullName"><TextInput id="fullName" maxLength={80} {...text('fullName')} /></Field>
          <Field label={tx({ vi: 'Năm sinh', en: 'Year of birth' })} htmlFor="birthYear" hint={tx({ vi: 'Navigator phải từ 18 tuổi.', en: 'Navigators must be 18+.' })}><TextInput id="birthYear" inputMode="numeric" value={f.birthYear ?? ''} onChange={(e) => set('birthYear')(e.target.value.replace(/\D/g, '').slice(0, 4))} /></Field>
          <Field label={tx({ vi: 'Điện thoại', en: 'Phone' })} htmlFor="phone" optionalLabel={s.common.optional}><TextInput id="phone" inputMode="tel" {...text('phone')} /></Field>
          <Field label={tx({ vi: 'Khu vực hoạt động', en: 'Area' })} htmlFor="district"><Select id="district" {...text('district')}>{AREAS.slice(0, 2).map((a) => <option key={a}>{a}</option>)}</Select></Field>
          <Field label={tx({ vi: 'Xã / phường', en: 'Ward' })} htmlFor="ward" optionalLabel={s.common.optional}><TextInput id="ward" {...text('ward')} /></Field>
          <Field label={tx({ vi: 'Đơn vị chủ trì', en: 'Host organisation' })} htmlFor="hostOrgId" hint={tx({ vi: 'Đơn vị sẽ phỏng vấn và quản lý bạn.', en: 'They will interview and supervise you.' })}>
            <Select id="hostOrgId" {...text('hostOrgId')}>
              <option value="">{tx({ vi: 'Để NEXTA phân công', en: 'Let NEXTA assign' })}</option>
              {(hosts.data ?? []).map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label={tx({ vi: 'Vì sao bạn muốn làm Navigator?', en: 'Why do you want to be a Navigator?' })} htmlFor="motivation" hint={tx({ vi: 'Tối thiểu 30 ký tự.', en: 'At least 30 characters.' })}><TextArea id="motivation" rows={4} maxLength={1500} {...text('motivation')} /></Field>
          </div>
          <div className="sm:col-span-2">
            <Field label={tx({ vi: 'Kinh nghiệm liên quan', en: 'Relevant experience' })} htmlFor="experience" optionalLabel={s.common.optional}><TextArea id="experience" rows={3} maxLength={1500} {...text('experience')} className="min-h-[88px]" /></Field>
          </div>
        </div>
        <Nav canNext={Boolean(f.fullName && /^\d{4}$/.test(f.birthYear ?? '') && (f.motivation ?? '').trim().length >= 30)} />
      </Card>
    );
  } else if (kind === 'VOLUNTEER' && current === 2) {
    body = (
      <Card className="p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Toggle checked={Boolean(f.weekdays)} onChange={set('weekdays')} label={tx({ vi: 'Ngày thường', en: 'Weekdays' })} />
          <Toggle checked={Boolean(f.weekends)} onChange={set('weekends')} label={tx({ vi: 'Cuối tuần', en: 'Weekends' })} />
          <Field label={tx({ vi: 'Giờ mỗi tuần', en: 'Hours per week' })} htmlFor="hours"><TextInput id="hours" inputMode="numeric" value={f.hours ?? ''} onChange={(e) => set('hours')(e.target.value.replace(/\D/g, '').slice(0, 2))} /></Field>
        </div>
        <h3 className="mt-6 text-lg font-bold text-ink">{tx({ vi: 'Người tham chiếu', en: 'Reference' })}</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label={tx({ vi: 'Họ tên', en: 'Name' })} htmlFor="refName"><TextInput id="refName" {...text('refName')} /></Field>
          <Field label={tx({ vi: 'Quan hệ', en: 'Relation' })} htmlFor="refRelation"><TextInput id="refRelation" placeholder={tx({ vi: 'Giảng viên, Bí thư Đoàn…', en: 'Lecturer, supervisor…' })} {...text('refRelation')} /></Field>
          <Field label={tx({ vi: 'Email/SĐT', en: 'Email/phone' })} htmlFor="refContact"><TextInput id="refContact" {...text('refContact')} /></Field>
        </div>
        <div className="mt-6 rounded-xl border border-line bg-sunken p-4">
          <label className="flex items-start gap-3 text-[15px] text-ink">
            <input type="checkbox" className="mt-1 size-5" checked={Boolean(f.priorConcern)} onChange={(e) => set('priorConcern')(e.target.checked)} />
            <span>{tx({ vi: 'Tôi từng bị điều tra, xử lý hoặc có khiếu nại liên quan đến an toàn của trẻ em hay người yếu thế.', en: 'I have been investigated, sanctioned or complained about regarding the safety of children or vulnerable people.' })}</span>
          </label>
          {f.priorConcern && <TextArea className="mt-3 min-h-[72px]" rows={2} placeholder={tx({ vi: 'Mô tả ngắn', en: 'Brief description' })} {...text('priorDetails')} />}
          <p className="mt-2 text-sm text-muted">{tx({ vi: 'Khai báo trung thực giúp bảo vệ mọi người; hồ sơ sẽ được một người xem xét riêng.', en: 'Honest disclosure protects everyone; a person will review it privately.' })}</p>
        </div>
        <Nav canNext={Boolean(f.refName && f.refRelation && (f.refContact ?? '').length >= 5 && Number(f.hours) >= 1)} />
      </Card>
    );
  } else if (kind === 'HOST' && current === 1) {
    body = (
      <Card className="p-5 sm:p-6">
        {orgFields()}
        <h3 className="mt-6 text-lg font-bold text-ink">{tx({ vi: 'Người đại diện', en: 'Representative' })}</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label={tx({ vi: 'Họ tên', en: 'Full name' })} htmlFor="repName"><TextInput id="repName" {...text('repName')} /></Field>
          <Field label={tx({ vi: 'Chức danh', en: 'Title' })} htmlFor="repTitle"><TextInput id="repTitle" {...text('repTitle')} /></Field>
        </div>
        <Nav canNext={Boolean(f.legalName && f.address && f.repName && f.repTitle && f.legalForm !== 'INFORMAL_GROUP')} />
        {f.legalForm === 'INFORMAL_GROUP' && <p className="mt-2 text-sm font-semibold text-danger">{tx({ vi: 'Đơn vị chủ trì cần có tư cách pháp nhân.', en: 'A host must be a legal entity.' })}</p>}
      </Card>
    );
  } else if (kind === 'HOST' && current === 2) {
    body = (
      <Card className="p-5 sm:p-6">
        <h3 className="text-lg font-bold text-ink">{tx({ vi: 'Đầu mối bảo vệ dữ liệu cá nhân', en: 'Data-protection lead' })}</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label={tx({ vi: 'Họ tên', en: 'Full name' })} htmlFor="dpoName"><TextInput id="dpoName" {...text('dpoName')} /></Field>
          <Field label="Email" htmlFor="dpoEmail"><TextInput id="dpoEmail" type="email" {...text('dpoEmail')} /></Field>
        </div>
        <h3 className="mt-6 text-lg font-bold text-ink">{tx({ vi: 'Cán bộ bảo vệ an toàn', en: 'Safeguarding lead' })}</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label={tx({ vi: 'Họ tên', en: 'Full name' })} htmlFor="sgName"><TextInput id="sgName" {...text('sgName')} /></Field>
          <Field label="Email" htmlFor="sgEmail"><TextInput id="sgEmail" type="email" {...text('sgEmail')} /></Field>
          <Field label={tx({ vi: 'Điện thoại', en: 'Phone' })} htmlFor="sgPhone"><TextInput id="sgPhone" inputMode="tel" {...text('sgPhone')} /></Field>
        </div>
        <h3 className="mt-6 text-lg font-bold text-ink">Pilot</h3>
        <div className="mt-3 flex flex-wrap gap-2">{AREAS.slice(0, 2).map((a) => <Chip key={a} selected={(f.pilotAreas ?? []).includes(a)} onClick={() => set('pilotAreas')((f.pilotAreas ?? []).includes(a) ? f.pilotAreas.filter((x: string) => x !== a) : [...(f.pilotAreas ?? []), a])}>{a}</Chip>)}</div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={tx({ vi: 'Số Navigator dự kiến', en: 'Expected Navigators' })} htmlFor="expected"><TextInput id="expected" inputMode="numeric" value={f.expected ?? ''} onChange={(e) => set('expected')(e.target.value.replace(/\D/g, '').slice(0, 3))} /></Field>
          <Field label={tx({ vi: 'Tháng bắt đầu', en: 'Start month' })} htmlFor="startMonth"><TextInput id="startMonth" type="month" {...text('startMonth')} /></Field>
        </div>
        <Nav canNext={Boolean(f.dpoName && f.dpoEmail && f.sgName && f.sgEmail && f.sgPhone && (f.pilotAreas ?? []).length && Number(f.expected) >= 1)} />
      </Card>
    );
  } else if (kind === 'OBSERVER' && current === 1) {
    body = (
      <Card className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tx({ vi: 'Tổ chức', en: 'Organisation' })} htmlFor="legalName"><TextInput id="legalName" {...text('legalName')} /></Field>
          <Field label="Website" htmlFor="website" optionalLabel={s.common.optional}><TextInput id="website" type="url" placeholder="https://" {...text('website')} /></Field>
          <Field label={tx({ vi: 'Họ tên', en: 'Full name' })} htmlFor="contactName"><TextInput id="contactName" {...text('contactName')} /></Field>
          <Field label={tx({ vi: 'Chức danh', en: 'Title' })} htmlFor="contactTitle"><TextInput id="contactTitle" {...text('contactTitle')} /></Field>
          <div className="sm:col-span-2">
            <Field label={tx({ vi: 'Mục đích theo dõi', en: 'Purpose' })} htmlFor="purpose"><TextArea id="purpose" rows={3} maxLength={1000} {...text('purpose')} className="min-h-[88px]" /></Field>
          </div>
        </div>
        <Nav canNext={Boolean(f.legalName && f.contactName && f.contactTitle && (f.purpose ?? '').trim().length >= 20)} />
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={s.nav.join} title={titles[kind][lang]} />
      {Stepper}
      {session && current > 0 && (
        <p className="mb-4 text-sm text-muted">
          {tx({ vi: 'Đang đăng ký bằng', en: 'Applying as' })} <Badge tone="brand">{email}</Badge>
        </p>
      )}
      {body}
    </div>
  );
}

function AgreementDialog({ code, onClose }: { code: string; onClose: () => void }) {
  const { s, lang } = useApp();
  const a = useAgreement(code);
  return (
    <Dialog open onClose={onClose} title={a.data?.title[lang] ?? code} closeLabel={s.common.cancel} footer={<Button onClick={onClose}>{s.common.confirm}</Button>}>
      {a.isLoading ? <Spinner label={s.common.loading} /> : a.data ? <Markdown source={a.data.body} /> : null}
    </Dialog>
  );
}
