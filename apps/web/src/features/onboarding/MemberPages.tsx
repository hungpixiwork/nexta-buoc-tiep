import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { CheckCircle2, CircleDashed, GraduationCap, RefreshCw, XCircle } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { errorText } from '../../app/errors';
import { Badge, Button, Card, EmptyState, ErrorBanner, PageHeader, Spinner, cx } from '../../design/ui';
import { apiFetch, type Session } from '../../lib/api';
import { fmtDate } from '../../lib/format';
import { useApiMutation } from '../../lib/hooks';
import { useMe, useMyApplications, useTrainingModules, type AppStatus } from './data';
import { homeFor } from './PublicPages';

export function statusTone(st: AppStatus) {
  return st === 'APPROVED' ? 'step' : st === 'REJECTED' || st === 'SUSPENDED' ? 'danger' : st === 'NEEDS_INFO' ? 'warn' : 'brand';
}

export function useStatusLabel() {
  const { tx } = useApp();
  return (st: AppStatus) =>
    ({
      SUBMITTED: tx({ vi: 'Đã gửi', en: 'Submitted' }),
      SCREENED: tx({ vi: 'Đang chờ duyệt', en: 'Awaiting review' }),
      NEEDS_INFO: tx({ vi: 'Cần bổ sung', en: 'More info needed' }),
      APPROVED: tx({ vi: 'Đã duyệt', en: 'Approved' }),
      REJECTED: tx({ vi: 'Không được duyệt', en: 'Not approved' }),
      SUSPENDED: tx({ vi: 'Tạm ngưng', en: 'Suspended' }),
    })[st];
}

/** Refresh the token after approval so the new role takes effect. */
function useRefreshSession() {
  const { session, signIn } = useApp();
  return async () => {
    if (!session) return null;
    const r = await apiFetch<{ token: string; account: Session['account'] }>('/api/v1/onboarding/session', { method: 'POST', body: {} });
    signIn({ token: r.token, account: r.account });
    return r.account.role;
  };
}

export function StatusPage() {
  const { tx, s, lang, session } = useApp();
  const apps = useMyApplications(Boolean(session));
  const refresh = useRefreshSession();
  const navigate = useNavigate();
  const label = useStatusLabel();
  const [busy, setBusy] = useState(false);
  const kindLabel = { PARTNER: s.roles.partner, VOLUNTEER: 'Youth Navigator', HOST: s.roles.host, OBSERVER: s.roles.observer };

  if (!session) return <Navigate to="/login" replace />;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={s.nav.myApplication} description={session.account.email} />
      {apps.isLoading && <Spinner label={s.common.loading} />}
      {apps.error && <ErrorBanner title={s.common.errorTitle} message={errorText(apps.error, lang)} />}
      {apps.data?.length === 0 && (
        <EmptyState title={tx({ vi: 'Bạn chưa gửi hồ sơ nào', en: 'No applications yet' })} action={<Link to="/join"><Button>{s.nav.join}</Button></Link>} />
      )}
      <ul className="space-y-4">
        {apps.data?.map((a) => (
          <li key={a.id}>
            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-ink">
                  {kindLabel[a.kind]} · <span className="tabular text-muted">{a.code}</span>
                </p>
                <Badge tone={statusTone(a.status)}>{label(a.status)}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted">
                {tx({ vi: 'Gửi', en: 'Submitted' })} {fmtDate(a.createdAt, lang)} · {tx({ vi: 'Hạn phản hồi', en: 'Decision due' })} {fmtDate(a.slaDueAt, lang)}
              </p>
              {a.decisionNote && <p className="mt-3 rounded-xl bg-sunken p-3 text-[15px] text-ink-2">“{a.decisionNote}” — {a.reviewerName}</p>}
              {a.status === 'NEEDS_INFO' && (
                <p className="mt-3 text-sm text-warn">{tx({ vi: 'Điều phối viên sẽ liên hệ qua email để bổ sung thông tin.', en: 'A coordinator will email you about the missing information.' })}</p>
              )}
              {a.status === 'APPROVED' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    icon={<RefreshCw className="size-4" />}
                    loading={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        const role = await refresh();
                        if (role) navigate(homeFor(role));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {tx({ vi: 'Kích hoạt quyền truy cập', en: 'Activate access' })}
                  </Button>
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrainingPage() {
  const { tx, s, lang, session } = useApp();
  const modules = useTrainingModules();
  const me = useMe(true);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [result, setResult] = useState<Record<string, { passed: boolean; wrong: string[] }>>({});
  const grade = useApiMutation<{ _code: string; answers: number[] }, { passed: boolean; wrong: string[]; activated: boolean }>((b) => `/api/v1/onboarding/training/${b._code}`);
  const passed = new Set(me.data?.trainingPassed ?? []);
  const active = me.data?.volunteer?.status === 'ACTIVE';

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Youth Navigator"
        title={tx({ vi: 'Đào tạo bắt buộc', en: 'Required training' })}
        description={tx({ vi: '4 học phần ngắn. Hoàn thành tất cả để được mở hành trình. Có thể làm lại bao nhiêu lần tùy ý.', en: 'Four short modules. Pass them all to open journeys. Retry as often as you like.' })}
      />
      {session && me.data?.volunteer && (
        <p className={cx('mb-5 flex items-center gap-2 rounded-xl border p-3 font-semibold', active ? 'border-step-line bg-step-soft text-step' : 'border-brand-line bg-brand-soft text-brand-strong')}>
          <GraduationCap className="size-5" aria-hidden />
          {active ? tx({ vi: 'Bạn đã là Navigator chính thức — có thể bắt đầu hành trình.', en: 'You are an active Navigator — you can start journeys.' }) : tx({ vi: `Đã hoàn thành ${passed.size}/4 học phần.`, en: `${passed.size}/4 modules passed.` })}
          {active && <Link to="/journeys/new" className="ml-auto underline">{s.nav.newJourney}</Link>}
        </p>
      )}
      {!session && <p className="mb-5 rounded-xl bg-sunken p-3 text-sm text-muted">{tx({ vi: 'Chế độ demo: bạn có thể xem nội dung đào tạo; kết quả không được lưu cho tài khoản demo.', en: 'Demo mode: you can read the training; results are not saved for demo accounts.' })}</p>}
      {modules.isLoading && <Spinner label={s.common.loading} />}
      <ol className="space-y-5">
        {modules.data?.map((m, idx) => {
          const done = passed.has(m.code) || result[m.code]?.passed;
          const ans = answers[m.code] ?? [];
          return (
            <li key={m.code}>
              <Card className={cx('p-5 sm:p-6', done && 'border-step-line')}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-ink">
                    {idx + 1}. {m.title[lang]}
                  </h2>
                  {done ? <Badge tone="step" icon={<CheckCircle2 className="size-3.5" />}>{tx({ vi: 'Đã đạt', en: 'Passed' })}</Badge> : <Badge icon={<CircleDashed className="size-3.5" />}>{m.minutes} {tx({ vi: 'phút', en: 'min' })}</Badge>}
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px] text-ink-2">
                  {m.points.map((p, i) => <li key={i}>{p[lang]}</li>)}
                </ul>
                {!done && (
                  <div className="mt-5 space-y-4 border-t border-line pt-4">
                    {m.quiz.map((q, qi) => {
                      const wrong = result[m.code]?.wrong.includes(q.id);
                      return (
                        <fieldset key={q.id}>
                          <legend className="font-semibold text-ink">{q.prompt[lang]}</legend>
                          <div className="mt-2 grid gap-2">
                            {q.options.map((o, oi) => (
                              <label key={oi} className={cx('flex min-h-[48px] items-center gap-3 rounded-xl border px-3', ans[qi] === oi ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:bg-sunken')}>
                                <input type="radio" name={`${m.code}-${q.id}`} className="size-5" checked={ans[qi] === oi} onChange={() => setAnswers((x) => { const next = [...(x[m.code] ?? [])]; next[qi] = oi; return { ...x, [m.code]: next }; })} />
                                <span className="text-[15px] text-ink">{o[lang]}</span>
                              </label>
                            ))}
                          </div>
                          {wrong && <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-danger"><XCircle className="size-4" aria-hidden />{tx({ vi: 'Chưa đúng — đọc lại ý chính phía trên.', en: 'Not quite — reread the key points above.' })}</p>}
                        </fieldset>
                      );
                    })}
                    <div className="flex justify-end">
                      <Button
                        disabled={!session || ans.filter((x) => x !== undefined).length < m.quiz.length}
                        loading={grade.isPending && grade.variables?._code === m.code}
                        onClick={async () => {
                          const r = await grade.mutateAsync({ _code: m.code, answers: ans });
                          setResult((x) => ({ ...x, [m.code]: r }));
                        }}
                      >
                        {tx({ vi: 'Nộp bài', en: 'Submit answers' })}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ol>
      {grade.error && <ErrorBanner title={s.common.errorTitle} message={errorText(grade.error, lang)} />}
    </div>
  );
}
