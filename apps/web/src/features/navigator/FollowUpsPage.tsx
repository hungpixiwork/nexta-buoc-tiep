/**
 * Hỏi thăm đúng hẹn (mockup 4).
 * Why this screen exists: the pilot promises 30–60 days of follow-up per person. A check-in that
 * slips silently is how people fall back to the street, so overdue items are loud, rescheduling
 * needs a reason, and "harder" answers go straight to a coordinator.
 */
import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Lightbulb, List, MapPin, MoreVertical, Phone, PhoneCall, PhoneOff, ClipboardList, CalendarClock, Siren } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { Button, EmptyState, ErrorBanner, SkeletonCard } from '../../design/ui';
import { Avatar, CheckFilter, DataTable, KpiCard, KpiRow, PageHero, Panel, PathwayPill, Pill, PriorityDot, PriorityPill, Segmented, type Column, type Priority } from '../../design/dashboard';
import { NeedIcon } from '../../design/widgets';
import { errorMessage, useCases, useDoneFollowUps, useFollowUpsUntil } from '../../lib/hooks';
import { byCaseId, checkInQuestions, daysOverdue, dueStatus, isToday, lastDoneFor, priorityOf, startOfWeekIso, type DueStatus } from '../../lib/caseSignals';
import { displayName, pathwayOf } from '../../lib/pathway';
import { fmtDate } from '../../lib/format';
import type { CaseListItem, FollowUp } from '../../lib/types';
import { CheckInDialog, ReportConcernDialog, RescheduleDialog } from '../shared/CaseDialogs';

interface Row {
  fu: FollowUp;
  c: CaseListItem | undefined;
  name: string;
  priority: Priority;
  status: DueStatus;
  district: string;
}

const STATUS_TONE: Record<DueStatus, 'danger' | 'warn' | 'step'> = { overdue: 'danger', soon: 'warn', on_time: 'step' };

export function FollowUpsPage() {
  const { tx, lang, s, role } = useApp();
  const works = role === 'navigator' || role === 'coordinator' || role === 'host';
  // Look 7 days ahead so "Lịch theo ngày" can show the coming week.
  const until = useMemo(() => new Date(Date.now() + 7 * 86_400_000).toISOString(), []);
  const monthAgo = useMemo(() => new Date(Date.now() - 30 * 86_400_000).toISOString(), []);
  const pending = useFollowUpsUntil(until, works);
  const done = useDoneFollowUps(monthAgo, works);
  const cases = useCases('OPEN', works);

  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [prio, setPrio] = useState<Set<Priority>>(new Set());
  const [districts, setDistricts] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Set<DueStatus>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'checkin' | 'reschedule' | 'report' | null>(null);

  const rows: Row[] = useMemo(() => {
    const idx = byCaseId(cases.data);
    return (pending.data ?? []).map((fu) => {
      const c = idx.get(fu.caseId);
      return {
        fu,
        c,
        name: c ? displayName(c) : fu.alias ?? '—',
        priority: priorityOf(c, fu.dueAt),
        status: dueStatus(fu.dueAt),
        district: c?.district ?? tx({ vi: 'Chưa rõ', en: 'Unknown' }),
      };
    });
  }, [pending.data, cases.data, tx]);

  const allDistricts = useMemo(() => [...new Set(rows.map((r) => r.district))].sort(), [rows]);
  const filtered = rows.filter((r) => (prio.size === 0 || prio.has(r.priority)) && (districts.size === 0 || districts.has(r.district)) && (statuses.size === 0 || statuses.has(r.status)));
  const current = filtered.find((r) => r.fu.id === selected) ?? filtered[0];

  const kpi = {
    today: rows.filter((r) => isToday(r.fu.dueAt)).length,
    overdue: rows.filter((r) => r.status === 'overdue').length,
    doneWeek: (done.data ?? []).filter((f) => f.completedAt && f.completedAt >= startOfWeekIso()).length,
    attention: rows.filter((r) => r.priority === 'high').length,
  };

  const toggle = <T,>(set: Set<T>, v: T, on: boolean) => {
    const n = new Set(set);
    if (on) n.add(v);
    else n.delete(v);
    return n;
  };

  const statusLabel = (st: DueStatus) => ({ overdue: tx({ vi: 'Quá hạn', en: 'Overdue' }), soon: tx({ vi: 'Sắp đến hạn', en: 'Due soon' }), on_time: tx({ vi: 'Đúng hẹn', en: 'On time' }) })[st];
  const time = (iso: string) => new Date(iso).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-GB', { hour: '2-digit', minute: '2-digit' });

  const columns: Column<Row>[] = [
    {
      key: 'time',
      header: tx({ vi: 'Thời gian', en: 'Time' }),
      className: 'w-[120px]',
      cell: (r) => (
        <div className="grid gap-1">
          <span className="tabular text-[17px] font-bold text-ink">{time(r.fu.dueAt)}</span>
          {!isToday(r.fu.dueAt) && <span className="text-xs text-muted">{fmtDate(r.fu.dueAt, lang)}</span>}
          <Pill tone={STATUS_TONE[r.status]} className="w-fit">
            {statusLabel(r.status)}
          </Pill>
        </div>
      ),
    },
    {
      key: 'who',
      header: tx({ vi: 'Người được hỗ trợ', en: 'Person' }),
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={r.name} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{r.name}</p>
            <p className="truncate text-[13px] text-muted">
              {r.c?.age != null ? `${r.c.age} ${tx({ vi: 'tuổi', en: 'y/o' })} · ` : ''}
              {r.district}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'need',
      header: tx({ vi: 'Nhu cầu chính', en: 'Main need' }),
      cell: (r) =>
        r.fu.need ? (
          <Pill tone="brand" icon={<NeedIcon need={r.fu.need} className="size-4" />}>
            {s.need[r.fu.need]}
          </Pill>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: 'q',
      header: tx({ vi: 'Câu hỏi tiếp theo', en: 'Next question' }),
      hideOnMobile: true,
      cell: (r) => <span className="line-clamp-2 text-ink-2">{tx(checkInQuestions(r.fu.need, r.c ? pathwayOf(r.c) : 'adult', 1)[0])}</span>,
    },
  ];

  if (!works) {
    return <EmptyState title={tx({ vi: 'Trang này dành cho Youth Navigator và điều phối viên', en: 'This page is for navigators and coordinators' })} />;
  }

  const byDay = groupByDay(filtered);

  return (
    <div>
      <PageHero
        eyebrow="Youth Navigator"
        title={tx({ vi: 'Hỏi thăm đúng hẹn', en: 'Check-ins on time' })}
        description={tx({
          vi: 'Mỗi cuộc hỏi thăm là một cơ hội để lắng nghe, đồng hành và phát hiện sớm khi tình hình xấu đi — trong suốt 30–60 ngày sau khi kết nối.',
          en: 'Each check-in is a chance to listen, stay alongside and catch problems early — throughout the 30–60 days after connecting.',
        })}
      />

      <KpiRow>
        <KpiCard icon={<Phone className="size-5" />} label={tx({ vi: 'Hỏi thăm hôm nay', en: 'Check-ins today' })} value={kpi.today} unit={tx({ vi: 'cuộc hẹn', en: 'appointments' })} tone="brand" filled />
        <KpiCard icon={<Clock className="size-5" />} label={tx({ vi: 'Đang quá hạn', en: 'Overdue' })} value={kpi.overdue} unit={tx({ vi: 'trường hợp', en: 'cases' })} tone="danger" filled />
        <KpiCard icon={<CheckCircle2 className="size-5" />} label={tx({ vi: 'Hoàn thành tuần này', en: 'Done this week' })} value={kpi.doneWeek} unit={tx({ vi: 'lượt hỏi thăm', en: 'check-ins' })} tone="step" filled />
        <KpiCard icon={<AlertTriangle className="size-5" />} label={tx({ vi: 'Cần chú ý', en: 'Need attention' })} value={kpi.attention} unit={tx({ vi: 'ưu tiên cao', en: 'high priority' })} tone="warn" filled />
      </KpiRow>

      {(pending.isError || cases.isError) && (
        <div className="mb-4">
          <ErrorBanner title={s.common.errorTitle} message={errorMessage(pending.error ?? cases.error, s.common.offline)} onRetry={() => (pending.refetch(), cases.refetch())} retryLabel={s.common.retry} />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[230px_minmax(0,1fr)_360px]">
        {/* Filters */}
        <Panel title={tx({ vi: 'Bộ lọc', en: 'Filters' })} className="h-fit">
          <fieldset className="border-b border-line pb-3">
            <legend className="mb-1 text-[14px] font-bold text-ink">{tx({ vi: 'Mức ưu tiên', en: 'Priority' })}</legend>
            {(['high', 'medium', 'low'] as Priority[]).map((p) => (
              <CheckFilter
                key={p}
                label={{ high: tx({ vi: 'Cao', en: 'High' }), medium: tx({ vi: 'Trung bình', en: 'Medium' }), low: tx({ vi: 'Thấp', en: 'Low' }) }[p]}
                dot={<PriorityDot priority={p} />}
                checked={prio.has(p)}
                onChange={(on) => setPrio(toggle(prio, p, on))}
                count={rows.filter((r) => r.priority === p).length}
              />
            ))}
          </fieldset>
          <fieldset className="border-b border-line py-3">
            <legend className="mb-1 text-[14px] font-bold text-ink">{tx({ vi: 'Quận / Huyện', en: 'District' })}</legend>
            <CheckFilter label={tx({ vi: 'Tất cả', en: 'All' })} checked={districts.size === 0} onChange={() => setDistricts(new Set())} />
            {allDistricts.map((d) => (
              <CheckFilter key={d} label={d} checked={districts.has(d)} onChange={(on) => setDistricts(toggle(districts, d, on))} count={rows.filter((r) => r.district === d).length} />
            ))}
          </fieldset>
          <fieldset className="pt-3">
            <legend className="mb-1 text-[14px] font-bold text-ink">{tx({ vi: 'Trạng thái', en: 'Status' })}</legend>
            <CheckFilter label={tx({ vi: 'Tất cả', en: 'All' })} checked={statuses.size === 0} onChange={() => setStatuses(new Set())} />
            {(['on_time', 'soon', 'overdue'] as DueStatus[]).map((st) => (
              <CheckFilter
                key={st}
                label={statusLabel(st)}
                dot={<PriorityDot priority={st === 'overdue' ? 'high' : st === 'soon' ? 'medium' : 'low'} />}
                checked={statuses.has(st)}
                onChange={(on) => setStatuses(toggle(statuses, st, on))}
                count={rows.filter((r) => r.status === st).length}
              />
            ))}
          </fieldset>
        </Panel>

        {/* List / calendar */}
        <Panel
          title={
            <>
              {tx({ vi: 'Danh sách hỏi thăm', en: 'Check-in list' })} <span className="tabular text-muted">({filtered.length})</span>
            </>
          }
          action={
            <Segmented
              label={tx({ vi: 'Kiểu xem', en: 'View' })}
              value={view}
              onChange={setView}
              options={[
                { value: 'list', label: <><List className="size-4" aria-hidden />{tx({ vi: 'Danh sách', en: 'List' })}</> },
                { value: 'calendar', label: <><CalendarDays className="size-4" aria-hidden />{tx({ vi: 'Lịch theo ngày', en: 'By day' })}</> },
              ]}
            />
          }
        >
          {pending.isLoading || cases.isLoading ? (
            <SkeletonCard rows={4} />
          ) : view === 'list' ? (
            <DataTable
              label={tx({ vi: 'Danh sách hỏi thăm', en: 'Check-in list' })}
              rows={filtered}
              columns={columns}
              rowKey={(r) => r.fu.id}
              selectedKey={current?.fu.id}
              onRowClick={(r) => setSelected(r.fu.id)}
              showChevron
              empty={<EmptyState icon={<CheckCircle2 className="size-6" />} title={tx({ vi: 'Không có cuộc hỏi thăm nào trong 7 ngày tới', en: 'No check-ins in the next 7 days' })} />}
            />
          ) : (
            <div className="grid gap-4">
              {byDay.length === 0 && <EmptyState title={tx({ vi: 'Không có lịch hỏi thăm', en: 'Nothing scheduled' })} />}
              {byDay.map(([day, items]) => (
                <section key={day}>
                  <h3 className="mb-2 text-sm font-bold text-ink-2">{day === new Date().toDateString() ? tx({ vi: 'Hôm nay', en: 'Today' }) : new Date(day).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { weekday: 'long', day: '2-digit', month: '2-digit' })}</h3>
                  <ul className="grid gap-1.5">
                    {items.map((r) => (
                      <li key={r.fu.id}>
                        <button type="button" onClick={() => setSelected(r.fu.id)} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left ${current?.fu.id === r.fu.id ? 'border-brand-line bg-brand-soft' : 'border-line hover:bg-sunken'}`}>
                          <span className="tabular w-12 font-bold">{time(r.fu.dueAt)}</span>
                          <PriorityDot priority={r.priority} />
                          <span className="min-w-0 flex-1 truncate font-semibold">{r.name}</span>
                          <Pill tone={STATUS_TONE[r.status]}>{statusLabel(r.status)}</Pill>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </Panel>

        {/* Detail */}
        <div className="grid h-fit gap-4">
          {current ? <Detail row={current} done={done.data} onDialog={setDialog} /> : <Panel><p className="text-sm text-muted">{tx({ vi: 'Chọn một người trong danh sách để xem chi tiết.', en: 'Pick someone from the list.' })}</p></Panel>}
        </div>
      </div>

      {current && (
        <>
          <CheckInDialog open={dialog === 'checkin'} onClose={() => setDialog(null)} followUpId={current.fu.id} who={current.name} />
          <RescheduleDialog open={dialog === 'reschedule'} onClose={() => setDialog(null)} followUpId={current.fu.id} currentDueAt={current.fu.dueAt} />
          <ReportConcernDialog open={dialog === 'report'} onClose={() => setDialog(null)} caseId={current.fu.caseId} who={current.name} suggested={riskSignals(current, done.data, tx).join('; ')} />
        </>
      )}
    </div>
  );
}

function groupByDay(rows: Row[]): Array<[string, Row[]]> {
  const m = new Map<string, Row[]>();
  for (const r of [...rows].sort((a, b) => a.fu.dueAt.localeCompare(b.fu.dueAt))) {
    const k = new Date(r.fu.dueAt).toDateString();
    m.set(k, [...(m.get(k) ?? []), r]);
  }
  return [...m.entries()];
}

type Tx = (c: { vi: string; en: string }) => string;

/** Plain-language reasons this person may need more than a routine call. */
function riskSignals(r: Row, done: FollowUp[] | undefined, tx: Tx): string[] {
  const out: string[] = [];
  if (r.status === 'overdue') out.push(tx({ vi: `Đã quá hạn ${Math.max(1, daysOverdue(r.fu.dueAt))} ngày so với lịch hẹn`, en: `${Math.max(1, daysOverdue(r.fu.dueAt))} day(s) past the agreed check-in` }));
  const last = lastDoneFor(r.fu.caseId, done);
  if (last?.result === 'HARDER') out.push(tx({ vi: 'Lần hỏi thăm trước: tình hình khó hơn', en: 'Last check-in: situation got harder' }));
  if (last?.result === 'UNREACHABLE') out.push(tx({ vi: 'Lần trước không liên lạc được', en: 'Could not be reached last time' }));
  if (r.c?.riskDecision === 'HUMAN_REVIEW' || r.c?.riskDecision === 'EMERGENCY_111') out.push(tx({ vi: 'Đang có cảnh báo an toàn chờ điều phối viên xem', en: 'A safety hold is waiting for a coordinator' }));
  if (r.c && pathwayOf(r.c) === 'child') out.push(tx({ vi: 'Trẻ em — ưu tiên bảo vệ, không kết nối việc làm', en: 'Child — protection first, no employment referrals' }));
  if (r.c && !r.c.referral) out.push(tx({ vi: 'Chưa kết nối được với dịch vụ nào', en: 'Not yet connected to any service' }));
  return out;
}

function Detail({ row, done, onDialog }: { row: Row; done: FollowUp[] | undefined; onDialog: (d: 'checkin' | 'reschedule' | 'report') => void }) {
  const { tx, lang, s } = useApp();
  const c = row.c;
  const pathway = c ? pathwayOf(c) : 'adult';
  const last = lastDoneFor(row.fu.caseId, done);
  const signals = riskSignals(row, done, tx);
  const allowPhone = c?.consent?.allowPhone === true;
  const outcomeTone = { BETTER: 'step', SAME: 'neutral', HARDER: 'danger', UNREACHABLE: 'warn' } as const;

  return (
    <>
      <Panel>
        <div className="flex items-start gap-3">
          <Avatar name={row.name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[19px] font-bold text-ink">{row.name}</p>
            <p className="text-sm text-muted">
              {c?.age != null ? `${c.age} ${tx({ vi: 'tuổi', en: 'y/o' })} · ` : ''}
              {row.district}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <PathwayPill pathway={pathway} />
              <PriorityPill priority={row.priority} />
              {row.status === 'overdue' && <Pill tone="danger">{tx({ vi: `Quá hạn ${Math.max(1, daysOverdue(row.fu.dueAt))} ngày`, en: `${Math.max(1, daysOverdue(row.fu.dueAt))}d overdue` })}</Pill>}
            </div>
          </div>
          <Link to={`/journeys/${row.fu.caseId}`} aria-label={tx({ vi: 'Mở hành trình', en: 'Open journey' })} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-sunken">
            <MoreVertical className="size-5" aria-hidden />
          </Link>
        </div>

        <div className="mt-4 grid gap-3 border-t border-line pt-4 text-[14px]">
          <div>
            <p className="mb-1 font-bold text-ink">{tx({ vi: 'Cách liên hệ đã được đồng ý', en: 'Agreed way to reach them' })}</p>
            <p className="flex items-center gap-2 text-ink-2">
              {allowPhone ? <Phone className="size-4 text-step" aria-hidden /> : <PhoneOff className="size-4 text-warn" aria-hidden />}
              {allowPhone ? tx({ vi: 'Đồng ý gọi điện (số lưu ở hồ sơ gốc)', en: 'Phone calls OK (number kept in the source record)' }) : tx({ vi: 'Chỉ gặp trực tiếp tại điểm hẹn', en: 'In person only, at the agreed spot' })}
            </p>
            <p className="mt-1 flex items-center gap-2 text-ink-2">
              <MapPin className="size-4 text-muted" aria-hidden />
              {row.district}
              {pathway === 'child' && <span className="text-xs text-muted">· {tx({ vi: 'vị trí trẻ chỉ hiển thị cấp quận', en: 'child location shown at district level only' })}</span>}
            </p>
          </div>

          <div className="rounded-xl bg-sunken p-3">
            <p className="mb-1 flex items-center gap-2 font-bold text-ink">
              <CalendarClock className="size-4 text-brand" aria-hidden />
              {tx({ vi: 'Lần hỏi thăm gần nhất', en: 'Last check-in' })}
            </p>
            {last ? (
              <>
                <p className="flex flex-wrap items-center gap-2 text-ink-2">
                  {fmtDate(last.completedAt, lang)}
                  {last.result && <Pill tone={outcomeTone[last.result]}>{s.outcome[last.result]}</Pill>}
                  {last.completedByName && <span className="text-xs text-muted">· {last.completedByName}</span>}
                </p>
                {last.note && <p className="mt-1 text-ink-2">{last.note}</p>}
              </>
            ) : (
              <p className="text-muted">{tx({ vi: 'Đây là lần hỏi thăm đầu tiên.', en: 'This is the first check-in.' })}</p>
            )}
          </div>

          <div>
            <p className="mb-1 flex items-center gap-2 font-bold text-ink">
              <Lightbulb className="size-4 text-warn" aria-hidden />
              {tx({ vi: 'Gợi ý câu hỏi hôm nay', en: 'Suggested questions' })}
            </p>
            <ul className="list-disc space-y-1 pl-5 text-ink-2">
              {checkInQuestions(row.fu.need, pathway).map((q) => (
                <li key={q.vi}>{tx(q)}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <Button block icon={<PhoneCall className="size-4" />} onClick={() => onDialog('checkin')}>
            {tx({ vi: 'Đánh dấu đã hỏi thăm', en: 'Record check-in' })}
          </Button>
          <Button block variant="secondary" icon={<CalendarDays className="size-4" />} onClick={() => onDialog('reschedule')}>
            {tx({ vi: 'Lên lịch lại', en: 'Reschedule' })}
          </Button>
          <Link to={`/journeys/${row.fu.caseId}`} className="press inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-brand-strong hover:bg-brand-soft">
            <ClipboardList className="size-4" aria-hidden />
            {s.common.viewJourney}
          </Link>
        </div>
      </Panel>

      {signals.length > 0 && (
        <Panel tone="danger">
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-2 font-bold text-danger">
              <Siren className="size-5" aria-hidden />
              {tx({ vi: 'Tín hiệu rủi ro', en: 'Risk signals' })}
              <span className="tabular rounded-full bg-surface px-2 text-sm">{signals.length}</span>
            </p>
            <Button size="sm" variant="secondary" onClick={() => onDialog('report')}>
              {tx({ vi: 'Báo điều phối viên', en: 'Report' })}
            </Button>
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] text-ink-2">
            {signals.map((sig) => (
              <li key={sig}>{sig}</li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
