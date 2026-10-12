/**
 * Bảng tiếp nhận & Điều phối hỗ trợ (mockup 5) — the partner organisation's inbox.
 * Why: partners are busy social-service staff. They need to decide fast whether they can take a
 * case, with only the minimum data (alias, age band, district, need, the agreed step) — and a
 * visible response deadline, because a referral nobody answers leaves a person waiting on the street.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Clock, HandHeart, Info, Lock, MapPin, MessageCircleQuestion, Search, Settings2, Sparkles, Star, Users, XCircle, Inbox, AlertCircle } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Button, Chip, Dialog, EmptyState, ErrorBanner, Field, SkeletonCard, TextArea, TextInput, cx } from '../../design/ui';
import { Avatar, KpiCard, KpiRow, PageHero, Panel, Pill, Segmented } from '../../design/dashboard';
import { NeedIcon } from '../../design/widgets';
import { errorMessage, useDirectory, useLoopMutation, useReferrals } from '../../lib/hooks';
import { fmtDateTime } from '../../lib/format';
import type { InboxReferral } from '../../lib/types';

type AgeBand = 'under_18' | '18_59' | '60_plus';
type Ref = InboxReferral & { ageBand?: AgeBand | null; district?: string | null; goal?: string | null; lastQuestion?: { note: string; at: string; by: string } | null };
type Tab = 'new' | 'upcoming' | 'active';

const NEW = new Set(['CREATED', 'RECEIVED']);
const ACTIVE = new Set(['ACCEPTED', 'ACTION_TAKEN']);
const DONE = new Set(['OUTCOME_RECORDED', 'FOLLOW_UP_DONE', 'CLOSED']);

/** Response SLA: 24h for urgent cases, 48h otherwise — counted from when the referral was sent. */
export function responseDeadline(r: Pick<InboxReferral, 'createdAt' | 'urgency'>) {
  return new Date(new Date(r.createdAt).getTime() + (r.urgency === 'urgent' ? 24 : 48) * 3_600_000);
}

export function PartnerInboxPage() {
  const { tx, s, lang } = useApp();
  const refs = useReferrals();
  const directory = useDirectory();
  const [tab, setTab] = useState<Tab>('new');
  const [q, setQ] = useState('');
  const [need, setNeed] = useState<string>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ kind: 'decline' | 'question' | 'done'; ref: Ref } | null>(null);

  const all = (refs.data ?? []) as Ref[];
  // "Your" services = the directory entries your referrals point to (partner scope is enforced server-side).
  const myResourceIds = useMemo(() => new Set(all.map((r) => r.resourceId).filter(Boolean) as string[]), [all]);
  const myResources = (directory.data ?? []).filter((d) => myResourceIds.has(d.id));
  const slots = myResources.reduce((n, d) => n + (d.slotsAvailable ?? 0), 0);
  const open = myResources.some((d) => d.capacityStatus === 'AVAILABLE' || d.capacityStatus === 'LIMITED');

  const monthAgo = Date.now() - 30 * 86_400_000;
  const kpi = {
    incoming: all.filter((r) => NEW.has(r.stage)).length,
    overdue: all.filter((r) => NEW.has(r.stage) && responseDeadline(r).getTime() < Date.now()).length,
    active: all.filter((r) => ACTIVE.has(r.stage)).length,
    done: all.filter((r) => DONE.has(r.stage) && new Date(r.updatedAt).getTime() > monthAgo).length,
  };

  const inTab = (r: Ref) =>
    tab === 'new' ? NEW.has(r.stage) : tab === 'active' ? ACTIVE.has(r.stage) : ACTIVE.has(r.stage) && Boolean(r.dueAt) && new Date(r.dueAt!).getTime() > Date.now() - 86_400_000;
  const needs = [...new Set(all.map((r) => r.need).filter(Boolean) as string[])];
  const rows = all
    .filter(inTab)
    .filter((r) => need === 'all' || r.need === need)
    .filter((r) => !q.trim() || [r.alias, r.district, r.need ? s.need[r.need] : '', r.action, r.code].join(' ').toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (tab === 'new' ? responseDeadline(a).getTime() - responseDeadline(b).getTime() : (a.dueAt ?? '').localeCompare(b.dueAt ?? '')));
  const current = rows.find((r) => r.id === selected) ?? rows[0];

  const bandLabel = (b?: AgeBand | null) => (b ? { under_18: tx({ vi: 'Dưới 18 tuổi', en: 'Under 18' }), '18_59': tx({ vi: '18–59 tuổi', en: '18–59' }), '60_plus': tx({ vi: 'Từ 60 tuổi', en: '60+' }) }[b] : tx({ vi: 'Chưa rõ tuổi', en: 'Age unknown' }));

  return (
    <div>
      <PageHero
        eyebrow={tx({ vi: 'Cổng thông tin đối tác', en: 'Partner portal' })}
        tags={<Pill tone="step">{tx({ vi: 'Nguồn lực đã xác minh', en: 'Verified resource' })}</Pill>}
        title={tx({ vi: 'Bảng tiếp nhận & Điều phối hỗ trợ', en: 'Referral intake board' })}
        description={tx({
          vi: 'Mỗi chuyển gửi là một bước tiếp đã được người dân đồng ý. Bạn chỉ thấy thông tin tối thiểu cần thiết để đánh giá mức độ phù hợp và phản hồi.',
          en: 'Every referral is a next step the person agreed to. You only see the minimum needed to judge fit and respond.',
        })}
        aside={
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
            <span className={cx('grid size-12 place-items-center rounded-full', open ? 'bg-step-soft text-step' : 'bg-warn-soft text-warn')}>
              <Sparkles className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{tx({ vi: 'Trạng thái tiếp nhận', en: 'Intake status' })}</p>
              <p className={cx('text-lg font-bold', open ? 'text-step' : 'text-warn')}>{open ? tx({ vi: 'Đang sẵn sàng', en: 'Accepting' }) : tx({ vi: 'Tạm ngừng / chưa cập nhật', en: 'Paused / not updated' })}</p>
              <p className="text-sm text-muted">{tx({ vi: `Còn ${slots} suất trong tuần`, en: `${slots} places left this week` })}</p>
            </div>
            <Link to="/partner/resources" className="press ml-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-brand-line px-3 text-sm font-semibold text-brand-strong hover:bg-brand-soft">
              <Settings2 className="size-4" aria-hidden />
              {tx({ vi: 'Cập nhật', en: 'Update' })}
            </Link>
          </div>
        }
      />

      <p className="mb-5 flex items-start gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-[14px] text-ink-2">
        <Lock className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
        <span>
          <strong>{tx({ vi: 'Cam kết bảo mật:', en: 'Privacy commitment:' })}</strong>{' '}
          {tx({
            vi: 'bạn chỉ thấy bí danh, nhóm tuổi, quận, nhu cầu và bước tiếp. Tuổi chính xác, số CCCD, địa chỉ và ghi chú thực địa không được chia sẻ.',
            en: 'you see alias, age band, district, need and next step only. Exact age, ID numbers, address and field notes are never shared.',
          })}
        </span>
      </p>

      <KpiRow>
        <KpiCard icon={<AlertCircle className="size-5" />} tone="brand" label={tx({ vi: 'Yêu cầu mới đến', en: 'New requests' })} value={kpi.incoming} unit={kpi.overdue ? tx({ vi: `${kpi.overdue} quá hạn phản hồi`, en: `${kpi.overdue} past response time` }) : tx({ vi: 'chờ phản hồi', en: 'awaiting reply' })} />
        <KpiCard icon={<Clock className="size-5" />} tone="brand" label={tx({ vi: 'Đang hỗ trợ', en: 'In support' })} value={kpi.active} unit={tx({ vi: 'đang trong quá trình', en: 'in progress' })} />
        <KpiCard icon={<CheckCircle2 className="size-5" />} tone="step" label={tx({ vi: 'Đã ghi nhận kết quả', en: 'Outcomes recorded' })} value={kpi.done} unit={tx({ vi: 'trong 30 ngày', en: 'last 30 days' })} />
        <KpiCard icon={<Users className="size-5" />} tone="step" label={tx({ vi: 'Suất tiếp nhận còn lại', en: 'Places left' })} value={slots} unit={tx({ vi: `trên ${myResources.length} dịch vụ`, en: `across ${myResources.length} services` })} to="/partner/resources" />
      </KpiRow>

      <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-line">
        {(
          [
            ['new', <Inbox key="i" className="size-4" />, tx({ vi: 'Luồng xử lý chuyển gửi', en: 'Referral queue' }), kpi.incoming],
            ['upcoming', <CalendarClock key="c" className="size-4" />, tx({ vi: 'Lịch hẹn sắp tới', en: 'Upcoming appointments' }), undefined],
            ['active', <HandHeart key="h" className="size-4" />, tx({ vi: 'Đang hỗ trợ', en: 'In support' }), kpi.active],
          ] as const
        ).map(([k, icon, label, n]) => (
          <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k} className={cx('-mb-px inline-flex min-h-[44px] items-center gap-2 border-b-2 px-3 text-[15px] font-semibold', tab === k ? 'border-brand text-brand-strong' : 'border-transparent text-muted hover:text-ink')}>
            {icon}
            {label}
            {Boolean(n) && <span className="tabular rounded-full bg-danger px-1.5 text-[11px] font-bold leading-5 text-white">{n}</span>}
          </button>
        ))}
        <Link to="/partner/resources" className="-mb-px inline-flex min-h-[44px] items-center gap-2 border-b-2 border-transparent px-3 text-[15px] font-semibold text-muted hover:text-ink">
          <Settings2 className="size-4" aria-hidden />
          {tx({ vi: 'Năng lực & Dịch vụ', en: 'Capacity & services' })}
        </Link>
      </div>

      {refs.isError && (
        <div className="mb-4">
          <ErrorBanner title={s.common.errorTitle} message={errorMessage(refs.error, s.common.offline)} onRetry={() => refs.refetch()} retryLabel={s.common.retry} />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel
          title={
            <>
              {tab === 'new' ? tx({ vi: 'Ca đang chờ phản hồi', en: 'Awaiting your reply' }) : tab === 'upcoming' ? tx({ vi: 'Lịch hẹn sắp tới', en: 'Upcoming' }) : tx({ vi: 'Ca đang hỗ trợ', en: 'In support' })}{' '}
              <span className="tabular text-muted">({rows.length})</span>
            </>
          }
        >
          <div className="mb-3 flex flex-wrap gap-2">
            <label className="relative min-w-[220px] flex-1">
              <span className="sr-only">{tx({ vi: 'Tìm kiếm', en: 'Search' })}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx({ vi: 'Tìm theo nhu cầu, địa bàn, mã hồ sơ…', en: 'Search need, district, code…' })} className="pl-9" />
            </label>
            <select value={need} onChange={(e) => setNeed(e.target.value)} aria-label={tx({ vi: 'Lọc nhu cầu', en: 'Filter need' })} className="min-h-[44px] rounded-xl border border-line-strong bg-surface px-3 text-[15px]">
              <option value="all">{tx({ vi: 'Tất cả nhu cầu', en: 'All needs' })}</option>
              {needs.map((n) => (
                <option key={n} value={n}>
                  {s.need[n as keyof typeof s.need]}
                </option>
              ))}
            </select>
          </div>

          {refs.isLoading ? (
            <SkeletonCard rows={4} />
          ) : rows.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="size-6" />} title={tab === 'new' ? tx({ vi: 'Không còn yêu cầu nào chờ bạn', en: 'Nothing waiting for you' }) : tx({ vi: 'Chưa có ca nào', en: 'No cases here' })} />
          ) : (
            <ul className="grid gap-2">
              {rows.map((r) => {
                const deadline = responseDeadline(r);
                return (
                  <li key={r.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelected(r.id)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelected(r.id)}
                      className={cx('grid gap-3 rounded-2xl border p-3.5 md:grid-cols-[minmax(160px,1.1fr)_minmax(150px,1.2fr)_minmax(110px,0.8fr)_minmax(120px,0.9fr)_auto] md:items-center', current?.id === r.id ? 'border-brand-line bg-brand-soft' : 'border-line hover:bg-sunken')}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={r.alias} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">{r.alias}</p>
                          <p className="truncate text-[13px] text-muted">{bandLabel(r.ageBand)}</p>
                        </div>
                      </div>
                      <div className="min-w-0">
                        {r.need && (
                          <Pill tone="brand" icon={<NeedIcon need={r.need} className="size-3.5" />}>
                            {s.need[r.need]}
                          </Pill>
                        )}
                        <p className="mt-1 line-clamp-2 text-[13.5px] text-ink-2">{r.action ?? r.serviceName}</p>
                      </div>
                      <p className="flex items-center gap-1.5 text-[14px] text-ink-2">
                        <MapPin className="size-4 shrink-0 text-muted" aria-hidden />
                        {r.district ?? '—'}
                      </p>
                      <div className="text-[13.5px]">
                        {NEW.has(r.stage) ? <DeadlineLabel deadline={deadline} /> : <span className="text-ink-2">{r.dueAt ? fmtDateTime(r.dueAt, lang) : '—'}</span>}
                        {r.lastQuestion && (
                          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-ai">
                            <MessageCircleQuestion className="size-3.5" aria-hidden />
                            {tx({ vi: 'Đã hỏi thêm', en: 'Asked for info' })}
                          </p>
                        )}
                      </div>
                      <RowActions r={r} onDialog={(kind) => setDialog({ kind, ref: r })} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="h-fit">{current ? <ReferralDetail r={current} bandLabel={bandLabel} onDialog={(kind) => setDialog({ kind, ref: current })} /> : null}</div>
      </div>

      {dialog?.kind === 'decline' && <DeclineDialog r={dialog.ref} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'question' && <QuestionDialog r={dialog.ref} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'done' && <ActionTakenDialog r={dialog.ref} onClose={() => setDialog(null)} />}
    </div>
  );
}

function DeadlineLabel({ deadline }: { deadline: Date }) {
  const { tx, lang } = useApp();
  const hours = Math.round((deadline.getTime() - Date.now()) / 3_600_000);
  const late = hours < 0;
  const tone = late ? 'text-danger' : hours <= 12 ? 'text-warn' : 'text-ink-2';
  return (
    <span className={cx('grid leading-snug', tone)}>
      <span className="flex items-center gap-1 font-semibold">
        <Clock className="size-4" aria-hidden />
        {late ? tx({ vi: `Trễ ${Math.abs(hours)} giờ`, en: `${Math.abs(hours)}h late` }) : hours < 24 ? tx({ vi: `Còn ${hours} giờ`, en: `${hours}h left` }) : tx({ vi: `Còn ${Math.floor(hours / 24)} ngày`, en: `${Math.floor(hours / 24)}d left` })}
      </span>
      <span className="text-xs text-muted">({deadline.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })})</span>
    </span>
  );
}

function RowActions({ r, onDialog }: { r: Ref; onDialog: (k: 'decline' | 'question' | 'done') => void }) {
  const { tx } = useApp();
  const act = useLoopMutation<{ _id: string; action: 'accept' }>((b) => `/referrals/${b._id}/actions`);
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  if (r.availableActions.includes('accept')) {
    return (
      <div className="grid gap-1.5 md:w-[168px]" onClick={stop}>
        <Button size="sm" loading={act.isPending} icon={<HandHeart className="size-4" />} onClick={() => act.mutate({ _id: r.id, action: 'accept' })}>
          {tx({ vi: 'Nhận hỗ trợ', en: 'Accept' })}
        </Button>
        <Button size="sm" variant="secondary" icon={<Info className="size-4" />} onClick={() => onDialog('question')}>
          {tx({ vi: 'Cần thêm thông tin', en: 'Need more info' })}
        </Button>
        <button type="button" onClick={() => onDialog('decline')} className="press inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-full border border-danger-line text-sm font-semibold text-danger hover:bg-danger-soft">
          <XCircle className="size-4" aria-hidden />
          {tx({ vi: 'Từ chối', en: 'Decline' })}
        </button>
        {act.isError && <p className="text-xs text-danger">{act.error.message}</p>}
      </div>
    );
  }
  if (r.availableActions.includes('mark_action_taken')) {
    return (
      <div className="md:w-[168px]" onClick={stop}>
        <Button size="sm" variant="step" block icon={<CheckCircle2 className="size-4" />} onClick={() => onDialog('done')}>
          {tx({ vi: 'Đã hỗ trợ', en: 'Support given' })}
        </Button>
      </div>
    );
  }
  return (
    <div className="md:w-[168px]">
      <Pill tone="step">{tx({ vi: 'Đã xử lý', en: 'Handled' })}</Pill>
    </div>
  );
}

function ReferralDetail({ r, bandLabel, onDialog }: { r: Ref; bandLabel: (b?: AgeBand | null) => string; onDialog: (k: 'decline' | 'question' | 'done') => void }) {
  const { tx, s, lang } = useApp();
  return (
    <div className="grid gap-4">
      <Panel title={tx({ vi: 'Chi tiết chuyển gửi', en: 'Referral details' })}>
        <div className="flex items-start gap-3">
          <Avatar name={r.alias} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[19px] font-bold text-ink">{r.alias}</p>
              <Pill tone="brand">{r.code}</Pill>
            </div>
            <p className="text-sm text-muted">{bandLabel(r.ageBand)}</p>
            {r.need && (
              <Pill tone="step" className="mt-1.5" icon={<NeedIcon need={r.need} className="size-3.5" />}>
                {s.need[r.need]}
              </Pill>
            )}
          </div>
        </div>
        {r.goal && <p className="mt-3 rounded-xl bg-sunken px-3 py-2.5 text-[14px] italic text-ink-2">“{r.goal}”</p>}

        <div className="mt-4 rounded-xl border border-line p-3">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
            <Lock className="size-4 text-brand" aria-hidden />
            {tx({ vi: 'Dữ liệu hiển thị cho bạn', en: 'Data shared with you' })}
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[14px]">
            <dt className="text-muted">{tx({ vi: 'Nhóm tuổi', en: 'Age band' })}</dt>
            <dd className="text-ink-2">{bandLabel(r.ageBand)}</dd>
            <dt className="text-muted">{tx({ vi: 'Nhu cầu', en: 'Need' })}</dt>
            <dd className="text-ink-2">{r.need ? s.need[r.need] : '—'}</dd>
            <dt className="text-muted">{tx({ vi: 'Địa bàn', en: 'District' })}</dt>
            <dd className="text-ink-2">{r.district ?? '—'}</dd>
            <dt className="text-muted">{tx({ vi: 'Người đồng hành', en: 'Navigator' })}</dt>
            <dd className="text-ink-2">{r.navigatorName ?? '—'}</dd>
          </dl>
        </div>

        <div className="mt-3 rounded-xl border border-step-line bg-step-soft p-3">
          <p className="mb-1 flex items-center gap-2 text-sm font-bold text-step">
            <Star className="size-4" aria-hidden />
            {tx({ vi: 'Vì sao ca này được gửi đến bạn', en: 'Why this came to you' })}
          </p>
          <ul className="list-disc space-y-0.5 pl-5 text-[14px] text-ink-2">
            <li>{tx({ vi: `Dịch vụ “${r.serviceName ?? ''}” khớp nhu cầu đã ghi nhận`, en: `Your service “${r.serviceName ?? ''}” matches the recorded need` })}</li>
            <li>{tx({ vi: 'Người được hỗ trợ đã đồng ý chia sẻ thông tin tối thiểu với bạn', en: 'The person agreed to share minimum data with you' })}</li>
            <li>{tx({ vi: 'Dịch vụ của bạn đã được xác minh và còn suất', en: 'Your service is verified and had places' })}</li>
          </ul>
        </div>

        {r.action && (
          <div className="mt-3 rounded-xl border border-ai-line bg-ai-soft p-3">
            <p className="mb-1 text-sm font-bold text-ai">{tx({ vi: 'Bước tiếp theo đã thống nhất', en: 'Agreed next step' })}</p>
            <p className="text-[14px] text-ink-2">{r.action}</p>
            <p className="mt-1 text-xs text-muted">
              {r.place ? `${r.place} · ` : ''}
              {r.dueAt ? fmtDateTime(r.dueAt, lang) : ''}
            </p>
          </div>
        )}

        {r.lastQuestion && (
          <p className="mt-3 rounded-xl bg-sunken px-3 py-2.5 text-[13.5px] text-ink-2">
            <strong>{tx({ vi: 'Bạn đã hỏi:', en: 'You asked:' })}</strong> {r.lastQuestion.note}
            <span className="block text-xs text-muted">{fmtDateTime(r.lastQuestion.at, lang)} · {tx({ vi: 'người đồng hành sẽ bổ sung trong hành trình', en: 'the navigator will add it to the journey' })}</span>
          </p>
        )}

        {(r.availableActions.includes('accept') || r.availableActions.includes('mark_action_taken')) && (
          <div className="mt-4">
            <RowActions r={r} onDialog={onDialog} />
          </div>
        )}
      </Panel>
    </div>
  );
}

const DECLINE_REASONS = [
  { vi: 'Hết suất trong tuần', en: 'No places this week' },
  { vi: 'Không đúng dịch vụ chúng tôi cung cấp', en: 'Not a service we offer' },
  { vi: 'Ngoài khu vực phục vụ', en: 'Outside our area' },
  { vi: 'Không phù hợp độ tuổi / đối tượng', en: 'Age or group not eligible' },
];

function DeclineDialog({ r, onClose }: { r: Ref; onClose: () => void }) {
  const { tx, s } = useApp();
  const [reason, setReason] = useState('');
  const act = useLoopMutation<{ _id: string; action: 'decline'; reason: string }>((b) => `/referrals/${b._id}/actions`);
  return (
    <Dialog
      open
      onClose={onClose}
      title={tx({ vi: `Từ chối ${r.code}`, en: `Decline ${r.code}` })}
      closeLabel={s.common.cancel}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {s.common.cancel}
          </Button>
          <Button variant="danger" disabled={reason.trim().length < 3} loading={act.isPending} onClick={() => act.mutate({ _id: r.id, action: 'decline', reason: reason.trim() }, { onSuccess: onClose })}>
            {tx({ vi: 'Xác nhận từ chối', en: 'Confirm decline' })}
          </Button>
        </>
      }
    >
      <p className="mb-3 rounded-xl bg-warn-soft px-3 py-2.5 text-[14px] text-ink-2">
        {tx({ vi: 'Hành trình sẽ tự quay lại bước chọn dịch vụ để người đồng hành tìm nơi khác — không ai bị bỏ lại. Lý do giúp họ chọn đúng hơn.', en: 'The journey returns to choosing a service so the navigator can find another option — nobody is dropped. Your reason helps them choose better.' })}
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {DECLINE_REASONS.map((d) => (
          <Chip key={d.vi} selected={reason === tx(d)} onClick={() => setReason(tx(d))}>
            {tx(d)}
          </Chip>
        ))}
      </div>
      <Field label={tx({ vi: 'Lý do', en: 'Reason' })} htmlFor="dec-reason">
        <TextArea id="dec-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      {act.isError && <p className="mt-2 text-sm text-danger">{act.error.message}</p>}
    </Dialog>
  );
}

function QuestionDialog({ r, onClose }: { r: Ref; onClose: () => void }) {
  const { tx, s } = useApp();
  const [question, setQuestion] = useState('');
  const m = useLoopMutation<{ _id: string; question: string }>((b) => `/referrals/${b._id}/questions`);
  return (
    <Dialog
      open
      onClose={onClose}
      title={tx({ vi: 'Hỏi thêm người đồng hành', en: 'Ask the navigator' })}
      closeLabel={s.common.cancel}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {s.common.cancel}
          </Button>
          <Button disabled={question.trim().length < 5} loading={m.isPending} onClick={() => m.mutate({ _id: r.id, question: question.trim() }, { onSuccess: onClose })}>
            {tx({ vi: 'Gửi câu hỏi', en: 'Send question' })}
          </Button>
        </>
      }
    >
      <p className="mb-3 text-[14px] text-muted">
        {tx({ vi: 'Chỉ hỏi điều cần để quyết định tiếp nhận. Không yêu cầu số CCCD, ảnh hay địa chỉ cụ thể.', en: 'Only ask what you need to decide. Do not request ID numbers, photos or exact addresses.' })}
      </p>
      <Field label={tx({ vi: 'Câu hỏi', en: 'Question' })} htmlFor="q-text">
        <TextArea id="q-text" rows={3} maxLength={500} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={tx({ vi: 'VD: Bạn có thể đến vào buổi chiều không?', en: 'e.g. Can they come in the afternoon?' })} />
      </Field>
      {m.isError && <p className="mt-2 text-sm text-danger">{m.error.message}</p>}
    </Dialog>
  );
}

export function ActionTakenDialog({ r, onClose }: { r: Pick<Ref, 'id' | 'code'>; onClose: () => void }) {
  const { tx, s } = useApp();
  const [note, setNote] = useState('');
  const act = useLoopMutation<{ _id: string; action: 'mark_action_taken'; note: string }>((b) => `/referrals/${b._id}/actions`);
  return (
    <Dialog
      open
      onClose={onClose}
      title={tx({ vi: `Ghi nhận đã hỗ trợ · ${r.code}`, en: `Record support given · ${r.code}` })}
      closeLabel={s.common.cancel}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {s.common.cancel}
          </Button>
          <Button variant="step" disabled={note.trim().length < 3} loading={act.isPending} onClick={() => act.mutate({ _id: r.id, action: 'mark_action_taken', note: note.trim() }, { onSuccess: onClose })}>
            {tx({ vi: 'Lưu', en: 'Save' })}
          </Button>
        </>
      }
    >
      <Field label={tx({ vi: 'Bạn đã hỗ trợ gì? (ngắn gọn, không ghi thông tin nhạy cảm)', en: 'What support was given? (brief, nothing sensitive)' })} htmlFor="at-note">
        <TextArea id="at-note" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={tx({ vi: 'VD: Đã tư vấn 2 chương trình học bổng, hẹn nộp hồ sơ thứ Năm.', en: 'e.g. Explained 2 scholarships, application on Thursday.' })} />
      </Field>
      <p className="mt-2 text-[13px] text-muted">{tx({ vi: 'Người đồng hành sẽ hỏi thăm để xác nhận kết quả với chính người được hỗ trợ.', en: 'The navigator will check in to confirm the outcome with the person.' })}</p>
      {act.isError && <p className="mt-2 text-sm text-danger">{act.error.message}</p>}
    </Dialog>
  );
}
