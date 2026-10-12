/**
 * Việc cần làm hôm nay (mockup 3) — the Youth Navigator's home.
 * Why: volunteers juggle field work and a phone. The screen answers one question — "who do I
 * help next, and what exactly do I do?" — so every row carries its next action and deadline,
 * and nothing is shown that the data can't back up (no invented trends).
 */
import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { BookOpen, CheckCircle2, ClipboardList, Lightbulb, MessageCircle, Plus, Search, ShieldCheck, ShieldAlert, Users } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { roleHome } from '../../app/AppShell';
import { EmptyState, ErrorBanner, SkeletonCard } from '../../design/ui';
import { ActionRow, ActivityFeed, Avatar, DataTable, KpiCard, KpiRow, PageHero, Panel, PathwayPill, Pill, PriorityPill, SeeAll, TipCard, type ActivityItem, type Column, type Priority } from '../../design/dashboard';
import { NeedIcon } from '../../design/widgets';
import { errorMessage, useCases, useDoneFollowUps, useFollowUps } from '../../lib/hooks';
import { daysOverdue, dueStatus, isToday, priorityOf, startOfWeekIso, stepOfStage } from '../../lib/caseSignals';
import { displayName, pathwayOf } from '../../lib/pathway';
import type { CaseListItem, FollowUp } from '../../lib/types';
import { CheckInDialog } from '../shared/CaseDialogs';

type Task = 'checkin' | 'verify' | 'connect' | 'understand' | 'waiting_partner' | 'following';

interface Row {
  c: CaseListItem;
  name: string;
  task: Task;
  dueAt: string | null;
  priority: Priority;
  followUp: FollowUp | undefined;
}

const TASK_TONE: Record<Task, 'danger' | 'ai' | 'brand' | 'warn' | 'step' | 'neutral'> = {
  checkin: 'danger',
  verify: 'ai',
  connect: 'brand',
  understand: 'warn',
  waiting_partner: 'neutral',
  following: 'step',
};

/** What the navigator must do next for this case — one task per row, most urgent wins. */
function taskOf(c: CaseListItem, fu: FollowUp | undefined): Task {
  if (fu && dueStatus(fu.dueAt) !== 'on_time') return 'checkin';
  if (c.stage === 'RISK' || c.stage === 'ESCALATED' || c.riskDecision === 'HUMAN_REVIEW' || c.riskDecision === 'ASK_MORE' || c.riskDecision === 'EMERGENCY_111') return 'verify';
  if (c.stage === 'CONSENT' || c.stage === 'UNDERSTAND') return 'understand';
  if ((c.stage === 'MATCH' || c.stage === 'NEXT_STEP') && !c.referral) return 'connect';
  if (c.referral && (c.referral.stage === 'CREATED' || c.referral.stage === 'RECEIVED')) return 'waiting_partner';
  return 'following';
}

const TASK_ORDER: Task[] = ['checkin', 'verify', 'connect', 'understand', 'waiting_partner', 'following'];
const PRIO_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

const TIPS = [
  { vi: 'Đặt câu hỏi mở để lắng nghe nhiều hơn', en: 'Ask open questions to hear more', body: { vi: 'Thay vì hỏi “Có ổn không?”, hãy thử “Tuần này điều gì làm mình lo nhất?” để người đối diện chia sẻ thật.', en: 'Instead of “Are you OK?”, try “What worried you most this week?” so people can really share.' } },
  { vi: 'Không chụp ảnh, không đăng hoàn cảnh', en: 'No photos, no posting their story', body: { vi: 'Kể cả với mục đích tốt, hình ảnh và vị trí có thể khiến người yếu thế — nhất là trẻ em — gặp nguy hiểm.', en: 'Even with good intentions, photos and locations can put vulnerable people — especially children — at risk.' } },
  { vi: 'Nhận diện tin tuyển dụng giả', en: 'Spot fake job ads', body: { vi: 'Việc thật không bắt đóng phí giữ chỗ, không giữ CCCD gốc, không hứa lương cao bất thường cho việc nhẹ.', en: 'Real jobs never charge a holding fee, keep your original ID, or promise unusually high pay for easy work.' } },
  { vi: 'Người quyết định là chính họ', en: 'They make the decision', body: { vi: 'Bạn gợi ý lựa chọn và giải thích rủi ro; người được hỗ trợ đồng ý thì mới chuyển thông tin cho đối tác.', en: 'You suggest options and explain risks; information goes to a partner only once the person agrees.' } },
  { vi: 'Trẻ em: bảo vệ trước, không kết nối việc làm', en: 'Children: protection first, never jobs', body: { vi: 'Với trẻ dưới 18 tuổi, hướng tới gia đình, trường học và công tác xã hội. Hệ thống tự chặn gợi ý việc làm.', en: 'For under-18s, aim for family, school and social work. The system blocks job suggestions automatically.' } },
];

export function TodayPage() {
  const { tx, lang, s, role } = useApp();
  const works = role === 'navigator' || role === 'coordinator' || role === 'host';
  const cases = useCases('OPEN', works);
  const followUps = useFollowUps(works);
  const weekStart = useMemo(() => startOfWeekIso(), []);
  const done = useDoneFollowUps(weekStart, works);
  const [selected, setSelected] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState(false);

  const rows: Row[] = useMemo(() => {
    const fuByCase = new Map<string, FollowUp>();
    for (const f of followUps.data ?? []) if (!fuByCase.has(f.caseId)) fuByCase.set(f.caseId, f);
    return (cases.data ?? [])
      .map((c) => {
        const fu = fuByCase.get(c.id);
        const task = taskOf(c, fu);
        const dueAt = task === 'checkin' ? fu!.dueAt : c.nextStep?.dueAt ?? fu?.dueAt ?? null;
        return { c, name: displayName(c), task, dueAt, priority: priorityOf(c, dueAt), followUp: fu };
      })
      .sort((a, b) => PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority] || TASK_ORDER.indexOf(a.task) - TASK_ORDER.indexOf(b.task) || (a.dueAt ?? '9').localeCompare(b.dueAt ?? '9'));
  }, [cases.data, followUps.data]);

  if (!works) return <Navigate to={roleHome(role)} replace />;

  const actionable = rows.filter((r) => r.task !== 'following' && r.task !== 'waiting_partner');
  const list = actionable.slice(0, 6);
  const current = rows.find((r) => r.c.id === selected) ?? list[0];

  const kpi = {
    checkin: rows.filter((r) => r.task === 'checkin').length,
    checkinOverdue: rows.filter((r) => r.task === 'checkin' && dueStatus(r.dueAt) === 'overdue').length,
    verify: rows.filter((r) => r.task === 'verify').length,
    childHeld: rows.filter((r) => r.task === 'verify' && pathwayOf(r.c) === 'child').length,
    connect: rows.filter((r) => r.task === 'connect').length,
    doneWeek: (done.data ?? []).length,
  };

  const taskLabel = (t: Task) =>
    ({
      checkin: tx({ vi: 'Cần hỏi thăm', en: 'Check in' }),
      verify: tx({ vi: 'Cần xác minh', en: 'Verify' }),
      connect: tx({ vi: 'Cần kết nối', en: 'Connect' }),
      understand: tx({ vi: 'Cần thấu hiểu', en: 'Understand' }),
      waiting_partner: tx({ vi: 'Chờ đối tác', en: 'Waiting partner' }),
      following: tx({ vi: 'Đang theo dõi', en: 'Following' }),
    })[t];

  const nextAction = (r: Row) =>
    ({
      checkin: tx({ vi: 'Hỏi thăm tình hình sau lần kết nối', en: 'Check in after the referral' }),
      verify: pathwayOf(r.c) === 'child' ? tx({ vi: 'Chờ điều phối viên xem xét an toàn cho trẻ', en: 'Coordinator safety review for the child' }) : tx({ vi: 'Xác minh thông tin, đánh giá rủi ro', en: 'Verify details, assess risk' }),
      connect: tx({ vi: 'Chọn dịch vụ phù hợp và hẹn bước tiếp', en: 'Pick a service and agree the next step' }),
      understand: tx({ vi: 'Lắng nghe và ghi nhận nhu cầu chính', en: 'Listen and record the main need' }),
      waiting_partner: tx({ vi: `Chờ ${r.c.referral?.code ?? ''} được đối tác nhận`, en: `Waiting for partner to accept ${r.c.referral?.code ?? ''}` }),
      following: r.c.nextStep?.action ?? tx({ vi: 'Theo dõi tiến độ', en: 'Follow progress' }),
    })[r.task];

  const dueLabel = (iso: string | null) => {
    if (!iso) return <span className="text-muted">—</span>;
    const d = new Date(iso);
    const t = d.toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
    const tomorrow = new Date(Date.now() + 86_400_000).toDateString() === d.toDateString();
    const day = isToday(iso) ? tx({ vi: 'Hôm nay', en: 'Today' }) : tomorrow ? tx({ vi: 'Ngày mai', en: 'Tomorrow' }) : d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit' });
    const late = daysOverdue(iso);
    const overdue = dueStatus(iso) === 'overdue';
    return (
      <span className="grid whitespace-nowrap leading-snug">
        <span className={overdue ? 'font-semibold text-danger' : 'font-semibold text-ink'}>{day}</span>
        <span className={overdue ? 'text-danger' : 'text-muted'}>{t}</span>
        {overdue && <span className="text-xs font-semibold text-danger">{late >= 1 ? tx({ vi: `Quá ${late} ngày`, en: `${late}d late` }) : tx({ vi: 'Quá hạn', en: 'Overdue' })}</span>}
      </span>
    );
  };

  const columns: Column<Row>[] = [
    {
      key: 'who',
      header: tx({ vi: 'Người được hỗ trợ', en: 'Person' }),
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={r.name} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{r.name}</p>
            <p className="truncate text-[13px] text-muted">
              {r.c.age != null ? `${r.c.age} ${tx({ vi: 'tuổi', en: 'y/o' })} · ` : ''}
              {r.c.district ?? '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'need',
      header: tx({ vi: 'Nhu cầu chính', en: 'Main need' }),
      cell: (r) =>
        r.c.need ? (
          <span className="inline-flex items-center gap-2 text-ink-2">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand">
              <NeedIcon need={r.c.need} className="size-4" />
            </span>
            {s.need[r.c.need]}
          </span>
        ) : (
          <span className="text-muted">{tx({ vi: 'Chưa rõ', en: 'Not yet known' })}</span>
        ),
    },
    { key: 'next', header: tx({ vi: 'Bước tiếp theo', en: 'Next step' }), hideOnMobile: true, cell: (r) => <span className="line-clamp-2 text-ink-2">{nextAction(r)}</span> },
    { key: 'due', header: tx({ vi: 'Hạn xử lý', en: 'Due' }), className: 'w-[110px] text-[13.5px]', cell: (r) => dueLabel(r.dueAt) },
    { key: 'task', header: tx({ vi: 'Trạng thái', en: 'Status' }), cell: (r) => <Pill tone={TASK_TONE[r.task]}>{taskLabel(r.task)}</Pill> },
  ];

  const activity = buildActivity(cases.data ?? [], done.data ?? [], tx);
  const tip = TIPS[Math.floor(Date.now() / 86_400_000) % TIPS.length];
  const today = new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      <PageHero
        eyebrow={today}
        title={tx({ vi: 'Việc cần làm hôm nay', en: 'Today’s work' })}
        description={tx({ vi: 'Giúp đúng người, vào đúng thời điểm, với sự hỗ trợ phù hợp.', en: 'The right help, for the right person, at the right time.' })}
      />

      <KpiRow>
        <KpiCard icon={<MessageCircle className="size-5" />} tone="danger" label={tx({ vi: 'Cần hỏi thăm', en: 'Check-ins due' })} value={kpi.checkin} unit={kpi.checkinOverdue ? tx({ vi: `${kpi.checkinOverdue} đã quá hạn`, en: `${kpi.checkinOverdue} overdue` }) : tx({ vi: 'trong 24 giờ', en: 'within 24h' })} to="/navigator/follow-ups" />
        <KpiCard icon={<ShieldCheck className="size-5" />} tone="ai" label={tx({ vi: 'Cần xác minh', en: 'To verify' })} value={kpi.verify} unit={kpi.childHeld ? tx({ vi: `${kpi.childHeld} ca trẻ em`, en: `${kpi.childHeld} child cases` }) : tx({ vi: 'hồ sơ', en: 'cases' })} />
        <KpiCard icon={<Users className="size-5" />} tone="brand" label={tx({ vi: 'Cần kết nối dịch vụ', en: 'To connect' })} value={kpi.connect} unit={tx({ vi: 'người', en: 'people' })} to="/directory" />
        <KpiCard icon={<CheckCircle2 className="size-5" />} tone="step" label={tx({ vi: 'Hỏi thăm xong tuần này', en: 'Check-ins done this week' })} value={kpi.doneWeek} unit={tx({ vi: 'lượt', en: 'done' })} />
      </KpiRow>

      {(cases.isError || followUps.isError) && (
        <div className="mb-4">
          <ErrorBanner title={s.common.errorTitle} message={errorMessage(cases.error ?? followUps.error, s.common.offline)} onRetry={() => (cases.refetch(), followUps.refetch())} retryLabel={s.common.retry} />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 gap-4">
          <Panel>
            <div className="grid gap-3 sm:grid-cols-3 min-[1800px]:grid-cols-[auto_repeat(3,minmax(0,1fr))] min-[1800px]:items-center">
              <div className="sm:col-span-3 min-[1800px]:col-span-1">
                <p className="text-[17px] font-bold text-ink">{tx({ vi: 'Hành động nhanh', en: 'Quick actions' })}</p>
                <p className="text-sm text-muted">{tx({ vi: 'Chọn việc bạn muốn làm ngay.', en: 'Pick what to do now.' })}</p>
              </div>
              <QuickAction to="/journeys/new" primary icon={<Plus className="size-5" />} title={tx({ vi: 'Bắt đầu hành trình', en: 'Start a journey' })} hint={tx({ vi: 'Ghi nhận người mới gặp', en: 'Someone you just met' })} />
              <QuickAction to="/navigator/follow-ups" icon={<MessageCircle className="size-5" />} title={tx({ vi: 'Ghi hỏi thăm', en: 'Record a check-in' })} hint={tx({ vi: 'Cập nhật tình hình', en: 'Update how they are' })} />
              <QuickAction to="/directory" icon={<BookOpen className="size-5" />} title={tx({ vi: 'Tìm nguồn lực', en: 'Find resources' })} hint={tx({ vi: 'Dịch vụ đã xác minh', en: 'Verified services' })} />
            </div>
          </Panel>

          <Panel
            title={
              <>
                {tx({ vi: 'Danh sách ưu tiên hôm nay', en: 'Today’s priorities' })} <span className="tabular text-muted">({actionable.length})</span>
              </>
            }
            action={<SeeAll to="/journeys">{tx({ vi: 'Xem tất cả', en: 'See all' })}</SeeAll>}
          >
            {cases.isLoading ? (
              <SkeletonCard rows={4} />
            ) : (
              <DataTable
                label={tx({ vi: 'Danh sách ưu tiên', en: 'Priority list' })}
                rows={list}
                columns={columns}
                rowKey={(r) => r.c.id}
                selectedKey={current?.c.id}
                onRowClick={(r) => setSelected(r.c.id)}
                showChevron
                empty={
                  <EmptyState icon={<CheckCircle2 className="size-6" />} title={tx({ vi: 'Hôm nay không còn việc gấp', en: 'Nothing urgent today' })}>
                    {tx({ vi: 'Bạn có thể xem lại các hành trình đang theo dõi hoặc bắt đầu một hành trình mới.', en: 'Review journeys you follow or start a new one.' })}
                  </EmptyState>
                }
              />
            )}
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title={tx({ vi: 'Hoạt động gần đây', en: 'Recent activity' })} action={<SeeAll to="/journeys">{tx({ vi: 'Xem tất cả', en: 'See all' })}</SeeAll>}>
              <ActivityFeed items={activity} empty={tx({ vi: 'Chưa có hoạt động nào.', en: 'No activity yet.' })} />
            </Panel>
            <TipCard icon={<Lightbulb className="size-6" />} title={tx(tip)}>
              {tx(tip.body)}
            </TipCard>
          </div>
        </div>

        <div className="h-fit">
          {current ? (
            <QuickDetail row={current} onCheckIn={() => setCheckIn(true)} />
          ) : (
            <Panel title={tx({ vi: 'Chi tiết nhanh', en: 'Quick details' })}>
              <p className="text-sm text-muted">{tx({ vi: 'Chọn một người trong danh sách.', en: 'Pick someone from the list.' })}</p>
            </Panel>
          )}
        </div>
      </div>

      {current?.followUp && <CheckInDialog open={checkIn} onClose={() => setCheckIn(false)} followUpId={current.followUp.id} who={current.name} />}
    </div>
  );
}

function QuickAction({ to, icon, title, hint, primary }: { to: string; icon: React.ReactNode; title: string; hint: string; primary?: boolean }) {
  return (
    <Link to={to} className={`press flex min-h-[64px] items-center gap-3 rounded-2xl border px-4 py-2.5 ${primary ? 'border-brand bg-brand text-white hover:bg-brand-strong' : 'border-line-strong bg-surface text-brand-strong hover:bg-brand-soft'}`}>
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block font-bold">{title}</span>
        <span className={`block text-[13px] ${primary ? 'text-white' : 'text-muted'}`}>{hint}</span>
      </span>
    </Link>
  );
}

function QuickDetail({ row, onCheckIn }: { row: Row; onCheckIn: () => void }) {
  const { tx, s } = useApp();
  const pathway = pathwayOf(row.c);
  return (
    <Panel title={tx({ vi: 'Chi tiết nhanh', en: 'Quick details' })}>
      <div className="flex items-center gap-3">
        <Avatar name={row.name} size="lg" />
        <div className="min-w-0">
          <p className="text-[19px] font-bold text-ink">{row.name}</p>
          <p className="text-sm text-muted">
            {row.c.age != null ? `${row.c.age} ${tx({ vi: 'tuổi', en: 'y/o' })} · ` : ''}
            {row.c.district ?? '—'}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <PathwayPill pathway={pathway} />
        <PriorityPill priority={row.priority} />
        {row.c.need && <Pill tone="brand" icon={<NeedIcon need={row.c.need} className="size-3.5" />}>{s.need[row.c.need]}</Pill>}
      </div>

      {pathway === 'child' && (
        <p className="mt-3 flex gap-2 rounded-xl border border-danger-line bg-danger-soft p-3 text-[13.5px] text-ink-2">
          <ShieldAlert className="size-4 shrink-0 text-danger" aria-hidden />
          {tx({ vi: 'Trẻ em: chỉ dùng bí danh, không chụp ảnh, không kết nối việc làm. Ưu tiên gia đình, trường học, công tác xã hội.', en: 'Child: alias only, no photos, no jobs. Family, school and social work first.' })}
        </p>
      )}

      <div className="mt-4 rounded-xl bg-sunken p-3">
        <p className="mb-1 text-sm font-bold text-ink">{tx({ vi: 'Điều họ mong muốn', en: 'What they want' })}</p>
        <p className="text-[14px] leading-relaxed text-ink-2">{row.c.priorityStatement ?? row.c.observation ?? tx({ vi: 'Chưa ghi nhận — hãy hỏi ở lần gặp tới.', en: 'Not recorded yet — ask next time.' })}</p>
        <p className="mt-2 text-xs text-muted">
          {tx({ vi: 'Bước hiện tại', en: 'Current step' })}: {stepOfStage(row.c.stage)}/6 · {row.c.navigatorName ?? ''}
        </p>
      </div>

      <div className="mt-4 grid gap-2">
        <ActionRow primary to={`/journeys/${row.c.id}`} icon={<ClipboardList className="size-5" />} label={tx({ vi: 'Mở hành trình', en: 'Open journey' })} />
        {row.followUp && <ActionRow onClick={onCheckIn} icon={<MessageCircle className="size-5" />} label={tx({ vi: 'Ghi hỏi thăm', en: 'Record check-in' })} />}
        <ActionRow to={`/journeys/${row.c.id}`} icon={<Search className="size-5" />} label={tx({ vi: 'Tìm dịch vụ phù hợp', en: 'Find a matching service' })} />
      </div>
    </Panel>
  );
}

type Tx = (c: { vi: string; en: string }) => string;

/** Recent activity from real timestamps only: journeys opened, check-ins recorded, step changes. */
function buildActivity(cases: CaseListItem[], done: FollowUp[], tx: Tx): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const c of cases) {
    const name = displayName(c);
    items.push({ id: `open-${c.id}`, at: c.createdAt, tone: 'brand', text: tx({ vi: `Đã mở hành trình cho ${name}`, en: `Opened a journey for ${name}` }) });
    if (c.updatedAt !== c.createdAt) {
      const step = stepOfStage(c.stage);
      items.push({ id: `upd-${c.id}`, at: c.updatedAt, tone: 'ai', text: tx({ vi: `${name} đang ở bước ${step}/6`, en: `${name} is at step ${step}/6` }) });
    }
  }
  for (const f of done) {
    if (!f.completedAt) continue;
    const name = f.alias ?? '—';
    items.push({ id: `fu-${f.id}`, at: f.completedAt, tone: 'step', text: tx({ vi: `Đã ghi hỏi thăm cho ${name}`, en: `Recorded a check-in for ${name}` }) });
  }
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);
}
