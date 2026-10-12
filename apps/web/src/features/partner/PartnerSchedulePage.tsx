/**
 * Lịch tiếp nhận & Kết quả hỗ trợ (mockup 7).
 * Why: a referral only counts when the partner records what actually happened. This screen puts
 * today's appointments, the cases in progress and a short outcome form side by side, and flags
 * cases whose update is due so the navigator's follow-up has something to confirm.
 */
import { useMemo, useState } from 'react';
import { CalendarCheck, CalendarDays, CheckCircle2, Clock, FileText, ListChecks, Lock, MapPin, Search, X } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Button, EmptyState, ErrorBanner, Field, Select, SkeletonCard, TextArea, TextInput, cx } from '../../design/ui';
import { Avatar, KpiCard, KpiRow, PageHero, Panel, Pill, Segmented, StepPill } from '../../design/dashboard';
import { NeedIcon } from '../../design/widgets';
import { errorMessage, useLoopMutation } from '../../lib/hooks';
import { fmtDate } from '../../lib/format';
import type { LoopAction } from '../../lib/types';
import { ReportConcernDialog } from '../shared/CaseDialogs';
import { usePartnerScope, type PartnerReferral } from './usePartnerScope';

const IN_SUPPORT = new Set(['ACCEPTED', 'ACTION_TAKEN']);
const DONE = new Set(['OUTCOME_RECORDED', 'FOLLOW_UP_DONE', 'CLOSED']);
/** Partners are asked to post an update within 3 days of their last action on a case. */
const UPDATE_WITHIN_DAYS = 3;

const stepOfReferral = (stage: string) => (stage === 'ACCEPTED' ? 4 : stage === 'ACTION_TAKEN' ? 5 : 6);
/** Appointment time passed but the partner has not recorded any support yet. */
const isMissed = (r: PartnerReferral) => Boolean(r.dueAt) && new Date(r.dueAt!).getTime() < Date.now() && ['CREATED', 'RECEIVED', 'ACCEPTED'].includes(r.stage);
const updateDue = (r: PartnerReferral) => new Date(new Date(r.updatedAt).getTime() + UPDATE_WITHIN_DAYS * 86_400_000);

export function PartnerSchedulePage({ focus = 'schedule' }: { focus?: 'schedule' | 'results' }) {
  const { tx, lang, s } = useApp();
  const { referrals, isLoading, error, refs } = usePartnerScope();
  const [when, setWhen] = useState<'today' | 'upcoming'>('today');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const now = new Date();
  const appts = referrals
    .filter((r) => r.dueAt && !DONE.has(r.stage) && r.stage !== 'DECLINED')
    // Today = today's appointments + missed ones still waiting for support (a missed appointment is today's work).
    .filter((r) => (when === 'today' ? new Date(r.dueAt!).toDateString() === now.toDateString() || isMissed(r) : new Date(r.dueAt!).getTime() > now.getTime() && new Date(r.dueAt!).toDateString() !== now.toDateString()))
    .sort((a, b) => a.dueAt!.localeCompare(b.dueAt!));
  const inSupport = referrals
    .filter((r) => IN_SUPPORT.has(r.stage))
    .filter((r) => !q.trim() || [r.alias, r.code, r.need ? s.need[r.need] : ''].join(' ').toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => updateDue(a).getTime() - updateDue(b).getTime());
  const needsUpdate = referrals.filter((r) => IN_SUPPORT.has(r.stage) && updateDue(r).getTime() < now.getTime() + 86_400_000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const doneMonth = referrals.filter((r) => DONE.has(r.stage) && new Date(r.updatedAt).getTime() >= monthStart);
  const todayCount = referrals.filter((r) => r.dueAt && !DONE.has(r.stage) && new Date(r.dueAt).toDateString() === now.toDateString()).length;

  const defaultPick = focus === 'results' ? inSupport.find((r) => r.stage === 'ACTION_TAKEN') ?? inSupport[0] : inSupport[0];
  const current = referrals.find((r) => r.id === selected) ?? defaultPick;
  const time = (iso: string) => new Date(iso).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <PageHero
        eyebrow={tx({ vi: 'Đối tác', en: 'Partner' })}
        title={tx({ vi: 'Lịch tiếp nhận & Kết quả hỗ trợ', en: 'Appointments & outcomes' })}
        description={tx({
          vi: 'Quản lý lịch hẹn, theo dõi các ca đang hỗ trợ và cập nhật kết quả để người đồng hành xác nhận lại với chính người được hỗ trợ.',
          en: 'Manage appointments, track cases in support and record outcomes so the navigator can confirm them with the person.',
        })}
      />

      <KpiRow>
        <KpiCard icon={<CalendarCheck className="size-5" />} tone="brand" label={tx({ vi: 'Lịch hẹn hôm nay', en: 'Appointments today' })} value={todayCount} unit={tx({ vi: 'ca đã lên lịch', en: 'scheduled' })} />
        <KpiCard icon={<Clock className="size-5" />} tone="brand" label={tx({ vi: 'Ca đang theo dõi', en: 'Cases in support' })} value={referrals.filter((r) => IN_SUPPORT.has(r.stage)).length} unit={tx({ vi: 'ca', en: 'cases' })} />
        <KpiCard icon={<FileText className="size-5" />} tone="warn" label={tx({ vi: 'Kết quả cần cập nhật', en: 'Updates due' })} value={needsUpdate.length} unit={tx({ vi: `trong ${UPDATE_WITHIN_DAYS} ngày`, en: `${UPDATE_WITHIN_DAYS}-day rule` })} />
        <KpiCard icon={<CheckCircle2 className="size-5" />} tone="step" label={tx({ vi: 'Đã hoàn tất tháng này', en: 'Completed this month' })} value={doneMonth.length} unit={tx({ vi: 'ca', en: 'cases' })} />
      </KpiRow>

      {error && (
        <div className="mb-4">
          <ErrorBanner title={s.common.errorTitle} message={errorMessage(error, s.common.offline)} onRetry={() => refs.refetch()} retryLabel={s.common.retry} />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_380px]">
        <Panel title={tx({ vi: 'Lịch tiếp nhận', en: 'Appointments' })} icon={<CalendarDays className="size-5" />}>
          <Segmented
            label={tx({ vi: 'Khoảng thời gian', en: 'Range' })}
            value={when}
            onChange={setWhen}
            options={[
              { value: 'today', label: tx({ vi: 'Hôm nay', en: 'Today' }) },
              { value: 'upcoming', label: tx({ vi: 'Sắp tới', en: 'Upcoming' }) },
            ]}
          />
          <div className="mt-3">
            {isLoading ? (
              <SkeletonCard rows={4} />
            ) : appts.length === 0 ? (
              <EmptyState icon={<CalendarDays className="size-6" />} title={when === 'today' ? tx({ vi: 'Hôm nay không có lịch hẹn', en: 'No appointments today' }) : tx({ vi: 'Chưa có lịch hẹn sắp tới', en: 'Nothing upcoming' })} />
            ) : (
              <ul className="grid gap-2">
                {appts.map((r) => (
                  <li key={r.id}>
                    <button type="button" onClick={() => setSelected(r.id)} className={cx('grid w-full grid-cols-[56px_auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border p-3 text-left', current?.id === r.id ? 'border-brand-line bg-brand-soft' : 'border-line hover:bg-sunken')}>
                      <span className="tabular leading-tight">
                        <span className="block font-bold text-ink">{time(r.dueAt!)}</span>
                        {(when === 'upcoming' || new Date(r.dueAt!).toDateString() !== now.toDateString()) && <span className="block text-xs text-muted">{fmtDate(r.dueAt, lang).slice(0, 5)}</span>}
                      </span>
                      <Avatar name={r.alias} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink">{r.alias}</span>
                        <span className="block truncate text-[13px] text-muted">{r.action ?? r.serviceName}</span>
                        {isMissed(r) && <Pill tone="danger" className="mt-1">{tx({ vi: 'Lỡ hẹn · cần liên hệ lại', en: 'Missed · reach out' })}</Pill>}
                        <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
                          <MapPin className="size-3.5 shrink-0" aria-hidden />
                          {r.place ?? r.district ?? '—'}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>

        <Panel
          title={
            <>
              {tx({ vi: 'Ca đang hỗ trợ', en: 'Cases in support' })} <span className="tabular text-muted">({inSupport.length})</span>
            </>
          }
          icon={<ListChecks className="size-5" />}
        >
          <label className="relative mb-3 block">
            <span className="sr-only">{tx({ vi: 'Tìm kiếm', en: 'Search' })}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx({ vi: 'Tìm theo tên, nhu cầu, mã ca…', en: 'Search name, need, code…' })} className="pl-9" />
          </label>
          {inSupport.length === 0 ? (
            <EmptyState title={tx({ vi: 'Chưa có ca nào đang hỗ trợ', en: 'No cases in support' })} />
          ) : (
            <ul className="grid gap-2">
              {inSupport.map((r) => {
                const due = updateDue(r);
                const late = due.getTime() < Date.now();
                const soon = !late && due.getTime() < Date.now() + 86_400_000;
                return (
                  <li key={r.id}>
                    <button type="button" onClick={() => setSelected(r.id)} className={cx('grid w-full gap-1.5 rounded-2xl border p-3 text-left text-[13.5px]', current?.id === r.id ? 'border-brand-line bg-brand-soft' : 'border-line hover:bg-sunken')}>
                      <span className="flex flex-wrap items-center gap-2">
                        <Avatar name={r.alias} size="sm" />
                        <span className="font-bold text-ink">{r.alias}</span>
                        <span className="text-xs text-muted">{r.code}</span>
                        <Pill tone={late ? 'danger' : soon ? 'warn' : 'brand'} className="ml-auto">
                          {late ? tx({ vi: 'Cần cập nhật', en: 'Update due' }) : r.stage === 'ACTION_TAKEN' ? tx({ vi: 'Đã hỗ trợ', en: 'Supported' }) : tx({ vi: 'Đang hỗ trợ', en: 'In support' })}
                        </Pill>
                      </span>
                      <span className="flex items-center gap-1.5 text-ink-2">
                        {r.need && <NeedIcon need={r.need} className="size-4 text-brand" />}
                        {r.need ? s.need[r.need] : '—'}
                      </span>
                      <span className="flex items-center gap-2 text-ink-2">
                        {tx({ vi: 'Bước hiện tại', en: 'Step' })}: <StepPill step={stepOfReferral(r.stage)} />
                      </span>
                      <span className="text-muted">
                        {tx({ vi: 'Cập nhật gần nhất', en: 'Last update' })}: {fmtDate(r.updatedAt, lang)}
                      </span>
                      <span className={late ? 'font-semibold text-danger' : soon ? 'font-semibold text-warn' : 'text-muted'}>
                        {tx({ vi: 'Hạn cập nhật', en: 'Update by' })}: {fmtDate(due.toISOString(), lang)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="h-fit">{current && IN_SUPPORT.has(current.stage) ? <OutcomeForm key={current.id + current.stage} r={current} onClose={() => setSelected(null)} /> : <Panel title={tx({ vi: 'Cập nhật kết quả', en: 'Record outcome' })}><p className="text-sm text-muted">{tx({ vi: 'Chọn một ca đang hỗ trợ để cập nhật.', en: 'Pick a case in support to update.' })}</p></Panel>}</div>
      </div>
    </div>
  );
}

type Status = 'mark_action_taken' | 'record_outcome' | 'decline' | 'escalate';

function OutcomeForm({ r, onClose }: { r: PartnerReferral; onClose: () => void }) {
  const { tx, s, lang } = useApp();
  const options: Array<{ v: Status; label: string }> = (
    [
      ['mark_action_taken', tx({ vi: 'Đã hỗ trợ (đã gặp / đã cung cấp dịch vụ)', en: 'Support given' })],
      ['record_outcome', tx({ vi: 'Đã có kết quả', en: 'Outcome reached' })],
      ['decline', tx({ vi: 'Không thể tiếp tục hỗ trợ', en: 'Cannot continue' })],
      ['escalate', tx({ vi: 'Cần điều phối viên can thiệp', en: 'Needs a coordinator' })],
    ] as Array<[Status, string]>
  )
    .filter(([v]) => r.availableActions.includes(v as LoopAction))
    .map(([v, label]) => ({ v, label }));
  const [status, setStatus] = useState<Status | ''>(options[0]?.v ?? '');
  const [note, setNote] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [report, setReport] = useState(false);
  const act = useLoopMutation<{ _id: string; action: Status; note?: string; reason?: string }>((b) => `/referrals/${b._id}/actions`);
  const needsReason = status === 'decline' || status === 'escalate';
  const text = useMemo(() => (nextDate ? `${note.trim()}\n${tx({ vi: 'Hẹn lần tiếp', en: 'Next appointment' })}: ${fmtDate(new Date(nextDate).toISOString(), lang)}` : note.trim()), [note, nextDate, lang, tx]);
  const valid = Boolean(status) && note.trim().length >= 5;

  return (
    <Panel title={tx({ vi: 'Cập nhật kết quả', en: 'Record outcome' })} icon={<FileText className="size-5" />} action={<button type="button" onClick={onClose} aria-label={s.common.cancel} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-sunken"><X className="size-4" aria-hidden /></button>}>
      <div className="flex items-start gap-3">
        <Avatar name={r.alias} size="lg" />
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-[18px] font-bold text-ink">{r.alias}</span>
            <span className="text-xs text-muted">{r.code}</span>
          </p>
          <p className="text-sm text-ink-2">
            {tx({ vi: 'Nhu cầu', en: 'Need' })}: {r.need ? s.need[r.need] : '—'}
          </p>
          {r.dueAt && (
            <p className="text-sm text-muted">
              {tx({ vi: 'Ngày hẹn', en: 'Appointment' })}: {new Date(r.dueAt).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <Field label={tx({ vi: 'Trạng thái', en: 'Status' })} htmlFor="oc-status">
          <Select id="oc-status" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            {options.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={needsReason ? tx({ vi: 'Lý do', en: 'Reason' }) : tx({ vi: 'Ghi chú ngắn', en: 'Short note' })} htmlFor="oc-note" hint={`${note.length}/500`}>
          <TextArea id="oc-note" rows={4} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder={tx({ vi: 'VD: Đã tư vấn 2 chương trình học bổng. Người tham gia quan tâm và sẽ chuẩn bị hồ sơ.', en: 'e.g. Explained 2 scholarships; they will prepare the application.' })} />
        </Field>
        {!needsReason && (
          <Field label={tx({ vi: 'Ngày hẹn tiếp', en: 'Next appointment' })} htmlFor="oc-next" optionalLabel={s.common.optional}>
            <TextInput id="oc-next" type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
          </Field>
        )}
        {status === 'decline' && <p className="rounded-xl bg-warn-soft px-3 py-2 text-[13px] text-ink-2">{tx({ vi: 'Hành trình sẽ quay lại bước chọn dịch vụ để người đồng hành tìm nơi phù hợp khác.', en: 'The journey goes back to choosing a service so the navigator can find another option.' })}</p>}
        {act.isError && <ErrorBanner title={s.common.errorTitle} message={errorMessage(act.error, s.common.offline)} />}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setReport(true)}>
            {tx({ vi: 'Báo điều phối viên', en: 'Report' })}
          </Button>
          <Button
            variant={status === 'decline' ? 'danger' : 'primary'}
            disabled={!valid}
            loading={act.isPending}
            icon={<CheckCircle2 className="size-4" />}
            onClick={() => act.mutate({ _id: r.id, action: status as Status, ...(needsReason ? { reason: note.trim() } : { note: text }) })}
          >
            {tx({ vi: 'Lưu kết quả', en: 'Save' })}
          </Button>
        </div>
      </div>

      <p className="mt-4 flex gap-2 rounded-xl border border-brand-line bg-brand-soft p-3 text-[13px] text-ink-2">
        <Lock className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
        {tx({ vi: 'Chỉ ghi điều cần thiết cho bước tiếp theo. Không ghi số CCCD, địa chỉ hay chi tiết hoàn cảnh nhạy cảm.', en: 'Record only what the next step needs. No ID numbers, addresses or sensitive details.' })}
      </p>
      <ReportConcernDialog open={report} onClose={() => setReport(false)} caseId={r.caseId} who={r.alias} />
    </Panel>
  );
}
