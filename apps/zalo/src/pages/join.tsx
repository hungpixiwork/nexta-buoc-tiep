/**
 * Đăng ký làm người đồng hành — gọn trong Mini App.
 * Đơn → điều phối viên duyệt trên web (W11) → học 4 bài ngắn ngay trong app → nhận vai thật.
 * Trong lúc chờ, người dùng vẫn dùng thử được mọi tính năng (sandbox).
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, FileText, GraduationCap } from 'lucide-react';
import { PAYLOAD_SCHEMAS } from '@buoc-tiep/shared';
import { fmtDate } from '@web/lib/format';
import { ApiError, onboarding, refreshSession, type Application, type TrainingModule } from '../lib/api';
import { useLang } from '../lib/i18n';
import { errorText } from '../lib/labels';
import { useSession } from '../lib/session';
import { Alert, Badge, Button, Card, CheckRow, Chip, Field, Loading, MiniSteps, PageBody, PageHeader, Select, Sheet, TextArea, TextInput, cx } from '../components/ui';

const DISTRICTS = ['Hóc Môn', 'Quận 12'];
const OPEN = ['SUBMITTED', 'SCREENED', 'NEEDS_INFO'];

/** Trang /join: trạng thái đơn nếu đã nộp, nếu chưa thì form. */
export function JoinPage() {
  const { tx } = useLang();
  const apps = useQuery({ queryKey: ['onboarding', 'apps'], queryFn: onboarding.myApplications });
  const latest = apps.data?.find((a) => a.kind === 'VOLUNTEER');
  return (
    <>
      <PageHeader back title={tx({ vi: 'Làm người đồng hành', en: 'Become a navigator' })} />
      <PageBody>
        {apps.isLoading ? <Loading /> : latest && (OPEN.includes(latest.status) || latest.status === 'APPROVED') ? <JoinStatus app={latest} /> : <JoinForm rejected={latest?.status === 'REJECTED' ? latest : undefined} />}
      </PageBody>
    </>
  );
}

/** Thẻ trạng thái đơn — dùng ở /join và màn Chào mừng. */
export function JoinStatus({ app }: { app: Application }) {
  const { tx, lang } = useLang();
  if (app.status === 'APPROVED') return <Training />;
  const needsInfo = app.status === 'NEEDS_INFO';
  return (
    <Card className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={cx('grid size-10 place-items-center rounded-xl', needsInfo ? 'bg-accent-soft text-accent-ink' : 'bg-primary-soft text-primary-ink')}>
          <Clock className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          <p className="text-card font-semibold text-fg">{needsInfo ? tx({ vi: 'Cần bổ sung thông tin', en: 'More information needed' }) : tx({ vi: 'Đơn đang chờ duyệt', en: 'Application under review' })}</p>
          <p className="text-caption text-fg-2">{tx({ vi: 'Mã đơn', en: 'Code' })} {app.code}{app.slaDueAt && ` · ${tx({ vi: 'phản hồi trước', en: 'reply by' })} ${fmtDate(app.slaDueAt, lang)}`}</p>
        </div>
      </div>
      {app.decisionNote && <p className="rounded-[var(--radius-control)] bg-surface-soft p-3 text-body text-fg">{app.decisionNote}</p>}
      <p className="text-small text-fg-2">
        {tx({ vi: 'Điều phối viên sẽ xem trong vài ngày làm việc. Trong lúc chờ, bạn cứ dùng thử mọi tính năng.', en: 'A coordinator reviews within a few working days. Meanwhile, keep trying every feature.' })}
      </p>
    </Card>
  );
}

function JoinForm({ rejected }: { rejected?: Application }) {
  const { tx, lang } = useLang();
  const { session } = useSession();
  const qc = useQueryClient();
  const hosts = useQuery({ queryKey: ['onboarding', 'hosts'], queryFn: onboarding.hosts });
  const agreements = useQuery({ queryKey: ['onboarding', 'agreements'], queryFn: onboarding.agreements });
  const [step, setStep] = useState(1);
  const [f, setF] = useState({
    fullName: session?.account.fullName ?? '',
    birthYear: '',
    district: '',
    hostOrgId: '',
    weekdays: true,
    weekends: false,
    hoursPerWeek: '4',
    motivation: '',
    refName: '',
    refRelation: '',
    refContact: '',
    priorConcern: false,
    concernDetails: '',
    agreed: false,
  });
  const [reading, setReading] = useState<{ title: string; body: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const required = useMemo(() => ['TERMS', 'PRIVACY_NOTICE', 'VOLUNTEER_AGREEMENT', 'CODE_OF_CONDUCT', 'SAFEGUARDING_POLICY'], []);
  const docs = (agreements.data ?? []).filter((a) => required.includes(a.code));
  const payload = {
    fullName: f.fullName.trim(),
    birthYear: Number(f.birthYear),
    district: f.district,
    hostOrgId: f.hostOrgId || null,
    availability: { weekdays: f.weekdays, weekends: f.weekends, hoursPerWeek: Number(f.hoursPerWeek) || 0 },
    languages: ['vi'],
    motivation: f.motivation.trim(),
    reference: { name: f.refName.trim(), relation: f.refRelation.trim(), contact: f.refContact.trim() },
    safeguardingDeclaration: { priorConcern: f.priorConcern, details: f.concernDetails.trim() || null },
    agreements: required,
  };
  const step1 = f.fullName.trim().length >= 2 && /^\d{4}$/.test(f.birthYear) && Number(f.birthYear) <= new Date().getFullYear() - 16 && Boolean(f.district);
  const step2 = f.motivation.trim().length >= 30 && f.refName.trim().length >= 2 && f.refRelation.trim().length >= 2 && f.refContact.trim().length >= 5 && (f.weekdays || f.weekends);
  const valid = step1 && step2 && f.agreed && docs.length === required.length && PAYLOAD_SCHEMAS.VOLUNTEER.safeParse(payload).success;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onboarding.submit({
        kind: 'VOLUNTEER',
        payload,
        signer: { fullName: payload.fullName },
        acceptedAgreements: docs.map((d) => ({ code: d.code, version: d.version, sha256: d.sha256 })),
      });
      await qc.invalidateQueries({ queryKey: ['onboarding'] });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ALREADY_PENDING') await qc.invalidateQueries({ queryKey: ['onboarding'] });
      else if (e instanceof ApiError && e.code === 'AGREEMENT_OUTDATED') (await agreements.refetch(), set('agreed', false), setError(tx({ vi: 'Văn bản vừa được cập nhật. Hãy đọc lại và đồng ý.', en: 'The documents changed. Please re-read and agree.' })));
      else setError(errorText(e, lang));
    } finally {
      setBusy(false);
    }
  };

  const labels = [tx({ vi: 'Về bạn', en: 'About you' }), tx({ vi: 'Thời gian và lý do', en: 'Time and reason' }), tx({ vi: 'Cam kết', en: 'Commitments' })];

  return (
    <div className="space-y-4">
      {rejected && <Alert tone="attention" title={tx({ vi: 'Đơn trước chưa được duyệt', en: 'Your last application was not approved' })}>{rejected.decisionNote ?? tx({ vi: 'Bạn có thể gửi lại.', en: 'You can apply again.' })}</Alert>}
      <MiniSteps total={3} current={step} label={labels[step - 1]} />

      {step === 1 && (
        <Card className="animate-enter space-y-3">
          <Field label={tx({ vi: 'Họ và tên', en: 'Full name' })}>
            <TextInput value={f.fullName} onChange={(e) => set('fullName', e.target.value)} maxLength={80} autoComplete="name" />
          </Field>
          <Field label={tx({ vi: 'Năm sinh', en: 'Birth year' })} hint={tx({ vi: 'Người đồng hành cần từ 16 tuổi.', en: 'Navigators must be 16 or older.' })}>
            <TextInput inputMode="numeric" maxLength={4} value={f.birthYear} onChange={(e) => set('birthYear', e.target.value.replace(/\D/g, ''))} placeholder="2004" />
          </Field>
          <div>
            <p className="mb-1.5 text-small font-medium text-fg">{tx({ vi: 'Khu vực bạn hoạt động', en: 'Where you volunteer' })}</p>
            <div className="flex flex-wrap gap-2">
              {DISTRICTS.map((d) => <Chip key={d} selected={f.district === d} onClick={() => set('district', d)}>{d}</Chip>)}
            </div>
          </div>
          <Field label={tx({ vi: 'Tổ chức muốn tham gia (không bắt buộc)', en: 'Organisation to join (optional)' })}>
            <Select value={f.hostOrgId} onChange={(e) => set('hostOrgId', e.target.value)}>
              <option value="">{tx({ vi: 'Để điều phối viên xếp giúp', en: 'Let a coordinator assign' })}</option>
              {(hosts.data ?? []).map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </Select>
          </Field>
          <Button full disabled={!step1} onClick={() => setStep(2)}>{tx({ vi: 'Tiếp tục', en: 'Continue' })}</Button>
        </Card>
      )}

      {step === 2 && (
        <Card className="animate-enter space-y-3">
          <div>
            <p className="mb-1.5 text-small font-medium text-fg">{tx({ vi: 'Bạn rảnh khi nào?', en: 'When are you free?' })}</p>
            <div className="flex flex-wrap gap-2">
              <Chip selected={f.weekdays} onClick={() => set('weekdays', !f.weekdays)}>{tx({ vi: 'Ngày thường', en: 'Weekdays' })}</Chip>
              <Chip selected={f.weekends} onClick={() => set('weekends', !f.weekends)}>{tx({ vi: 'Cuối tuần', en: 'Weekends' })}</Chip>
            </div>
          </div>
          <Field label={tx({ vi: 'Số giờ mỗi tuần', en: 'Hours per week' })}>
            <TextInput inputMode="numeric" maxLength={2} value={f.hoursPerWeek} onChange={(e) => set('hoursPerWeek', e.target.value.replace(/\D/g, ''))} />
          </Field>
          <Field label={tx({ vi: 'Vì sao bạn muốn đồng hành?', en: 'Why do you want to help?' })} hint={tx({ vi: `${f.motivation.trim().length}/30 ký tự tối thiểu`, en: `${f.motivation.trim().length}/30 characters minimum` })}>
            <TextArea rows={3} maxLength={1500} value={f.motivation} onChange={(e) => set('motivation', e.target.value)} />
          </Field>
          <p className="pt-1 text-small font-medium text-fg">{tx({ vi: 'Một người có thể giới thiệu bạn', en: 'Someone who can vouch for you' })}</p>
          <TextInput placeholder={tx({ vi: 'Tên', en: 'Name' })} value={f.refName} onChange={(e) => set('refName', e.target.value)} maxLength={80} />
          <TextInput placeholder={tx({ vi: 'Quan hệ (VD: giảng viên, trưởng nhóm)', en: 'Relation (e.g. lecturer, team lead)' })} value={f.refRelation} onChange={(e) => set('refRelation', e.target.value)} maxLength={80} />
          <TextInput placeholder={tx({ vi: 'Số điện thoại hoặc email', en: 'Phone or email' })} value={f.refContact} onChange={(e) => set('refContact', e.target.value)} maxLength={120} />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>{tx({ vi: 'Quay lại', en: 'Back' })}</Button>
            <Button disabled={!step2} onClick={() => setStep(3)}>{tx({ vi: 'Tiếp tục', en: 'Continue' })}</Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="animate-enter space-y-3">
          <CheckRow
            checked={f.priorConcern}
            onChange={(v) => set('priorConcern', v)}
            label={tx({ vi: 'Tôi từng có vấn đề liên quan tới an toàn trẻ em', en: 'I have had a child-safety concern before' })}
            description={tx({ vi: 'Trung thực giúp điều phối viên quyết định đúng. Không tự động loại đơn.', en: 'Honesty helps the coordinator decide fairly. Not an automatic rejection.' })}
          />
          {f.priorConcern && (
            <Field label={tx({ vi: 'Mô tả ngắn', en: 'Short description' })}>
              <TextArea rows={2} maxLength={1000} value={f.concernDetails} onChange={(e) => set('concernDetails', e.target.value)} />
            </Field>
          )}
          <div className="rounded-[var(--radius-control)] bg-surface-soft p-3">
            <p className="text-small font-medium text-fg">{tx({ vi: 'Văn bản cần đồng ý', en: 'Documents to accept' })}</p>
            {agreements.isLoading ? (
              <Loading />
            ) : (
              <ul className="mt-2 space-y-1">
                {docs.map((d) => (
                  <li key={d.code}>
                    <button
                      type="button"
                      className="flex min-h-[40px] w-full items-center gap-2 text-left text-body text-primary-ink"
                      onClick={async () => setReading({ title: d.title[lang], body: await onboarding.agreementBody(d.code) })}
                    >
                      <FileText className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                      <span className="underline underline-offset-2">{d.title[lang]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <CheckRow checked={f.agreed} onChange={(v) => set('agreed', v)} label={tx({ vi: 'Tôi đã đọc và đồng ý các văn bản trên', en: 'I have read and agree to the documents above' })} />
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setStep(2)}>{tx({ vi: 'Quay lại', en: 'Back' })}</Button>
            <Button disabled={!valid} loading={busy} onClick={submit}>{tx({ vi: 'Gửi đơn', en: 'Submit' })}</Button>
          </div>
        </Card>
      )}

      <Sheet open={Boolean(reading)} onClose={() => setReading(null)} title={reading?.title ?? ''}>
        <p className="whitespace-pre-line text-body text-fg">{reading?.body}</p>
      </Sheet>
    </div>
  );
}

/** Đã duyệt → 4 bài ngắn; xong hết thì nhận vai thật (phiên mới theo vai đã duyệt). */
function Training() {
  const { tx, lang } = useLang();
  const { signIn } = useSession();
  const navigate = useNavigate();
  const modules = useQuery({ queryKey: ['onboarding', 'training'], queryFn: onboarding.training });
  const me = useQuery({ queryKey: ['onboarding', 'me'], queryFn: onboarding.me });
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passed = new Set(me.data?.trainingPassed ?? []);
  const list = modules.data ?? [];
  const done = list.length > 0 && list.every((m) => passed.has(m.code));

  const goLive = async () => {
    setBusy(true);
    setError(null);
    try {
      signIn(await refreshSession());
      navigate('/', { replace: true });
    } catch (e) {
      setError(errorText(e, lang));
    } finally {
      setBusy(false);
    }
  };

  if (modules.isLoading || me.isLoading) return <Loading />;
  return (
    <div className="space-y-3">
      <Alert tone="success" title={tx({ vi: 'Đơn đã được duyệt', en: 'Application approved' })}>
        {done ? tx({ vi: 'Bạn đã học xong. Bắt đầu đồng hành thật nhé.', en: "You've finished training. Let's start for real." }) : tx({ vi: `Còn ${list.length - passed.size} bài ngắn (khoảng 5–8 phút mỗi bài) là sẵn sàng.`, en: `${list.length - passed.size} short lessons (5–8 min each) left.` })}
      </Alert>
      {list.map((m) => (
        <Card key={m.code} className="space-y-2">
          <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => setOpen(open === m.code ? null : m.code)}>
            <span className={cx('grid size-10 shrink-0 place-items-center rounded-xl', passed.has(m.code) ? 'bg-success text-fg' : 'bg-primary-soft text-primary-ink')}>
              {passed.has(m.code) ? <CheckCircle2 className="size-5" strokeWidth={1.75} aria-hidden /> : <GraduationCap className="size-5" strokeWidth={1.75} aria-hidden />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-card font-semibold text-fg">{m.title[lang]}</span>
              <span className="text-caption text-fg-2">{m.minutes} {tx({ vi: 'phút', en: 'min' })}</span>
            </span>
            {passed.has(m.code) && <Badge tone="success">{tx({ vi: 'Đã xong', en: 'Done' })}</Badge>}
          </button>
          {open === m.code && <Lesson m={m} onPassed={() => (me.refetch(), setOpen(null))} />}
        </Card>
      ))}
      {error && <Alert tone="danger">{error}</Alert>}
      <Button full size="lg" disabled={!done} loading={busy} onClick={goLive}>
        {tx({ vi: 'Bắt đầu đồng hành thật', en: 'Start for real' })}
      </Button>
    </div>
  );
}

function Lesson({ m, onPassed }: { m: TrainingModule; onPassed: () => void }) {
  const { tx, lang } = useLang();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ passed: boolean; score: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const all = m.quiz.every((q) => answers[q.id] !== undefined);
  return (
    <div className="animate-enter space-y-3 border-t border-line pt-3">
      <ul className="list-disc space-y-1 pl-5 text-body text-fg">{m.points.map((p) => <li key={p.vi}>{p[lang]}</li>)}</ul>
      {m.quiz.map((q, qi) => (
        <div key={q.id}>
          <p className="text-body font-medium text-fg">{qi + 1}. {q.prompt[lang]}</p>
          <div className="mt-1.5 space-y-1.5">
            {q.options.map((o, oi) => (
              <button
                key={oi}
                type="button"
                onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                className={cx('min-h-[44px] w-full rounded-[var(--radius-control)] border px-3 text-left text-body transition-colors duration-200', answers[q.id] === oi ? 'border-primary bg-surface-soft text-primary-ink' : 'border-line bg-surface text-fg')}
              >
                {o[lang]}
              </button>
            ))}
          </div>
        </div>
      ))}
      {result && !result.passed && <Alert tone="attention">{tx({ vi: 'Chưa đạt — đọc lại các ý chính rồi thử lại nhé.', en: 'Not yet — re-read the key points and try again.' })}</Alert>}
      <Button
        full
        disabled={!all}
        loading={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await onboarding.answer(m.code, m.quiz.map((q) => answers[q.id]));
            setResult(r);
            if (r.passed) onPassed();
          } finally {
            setBusy(false);
          }
        }}
      >
        {tx({ vi: 'Nộp bài', en: 'Submit answers' })}
      </Button>
    </div>
  );
}
