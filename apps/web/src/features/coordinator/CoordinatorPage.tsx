/**
 * Toàn cảnh điều phối hôm nay (mockup 8) — the coordinator's overview.
 * Why: the coordinator is the human-in-the-loop for everything the system should not decide alone —
 * who gets which partner, safety holds, partners that stop answering. The screen lists exactly those
 * decisions, most urgent first, and shows partner readiness and response SLA next to them.
 */
import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AlertTriangle, Building2, ClipboardList, Clock, Gauge, HandHeart, Info, MapPin, ShieldAlert, Users } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { roleHome } from '../../app/AppShell';
import { EmptyState, ErrorBanner, SkeletonCard } from '../../design/ui';
import { ActivityFeed, AlertRow, Avatar, DataTable, DonutGauge, KpiCard, KpiRow, PageHero, Panel, PriorityPill, SeeAll, StepPill, type ActivityItem, type Column, type Priority } from '../../design/dashboard';
import { NeedIcon, humanizeReason } from '../../design/widgets';
import { errorMessage, useCases, useDirectory, useEscalations, useReferrals, useReport } from '../../lib/hooks';
import { likelyPartner, priorityOf, stepOfStage } from '../../lib/caseSignals';
import { displayName, pathwayOf } from '../../lib/pathway';
import type { CaseListItem, DirectoryResource, Escalation, InboxReferral } from '../../lib/types';

type Why = 'allocate' | 'held' | 'declined';
interface Row {
  c: CaseListItem;
  name: string;
  why: Why;
  priority: Priority;
  partner: DirectoryResource | undefined;
}

const PRIO: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function CoordinatorPage() {
  const { tx, s, role, lang } = useApp();
  const allowed = role === 'coordinator' || role === 'host' || role === 'observer';
  const cases = useCases('OPEN', allowed);
  const escalations = useEscalations('OPEN', allowed);
  const directory = useDirectory();
  const referrals = useReferrals(allowed);
  const report = useReport('week', allowed);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (const c of cases.data ?? []) {
      const held = c.riskDecision === 'HUMAN_REVIEW' || c.riskDecision === 'EMERGENCY_111' || c.stage === 'ESCALATED';
      const declined = c.stage === 'NEXT_STEP' && !c.referral && (referrals.data ?? []).some((r) => r.caseId === c.id && r.stage === 'DECLINED');
      const allocate = (c.stage === 'MATCH' || c.stage === 'NEXT_STEP') && !c.referral;
      const why: Why | null = held ? 'held' : declined ? 'declined' : allocate ? 'allocate' : null;
      if (!why) continue;
      out.push({ c, name: displayName(c), why, priority: held ? 'high' : priorityOf(c, c.nextStep?.dueAt), partner: likelyPartner(c, directory.data) });
    }
    return out.sort((a, b) => PRIO[a.priority] - PRIO[b.priority] || a.c.createdAt.localeCompare(b.c.createdAt));
  }, [cases.data, referrals.data, directory.data]);

  if (!allowed) return <Navigate to={roleHome(role)} replace />;

  const ready = (directory.data ?? []).filter((d) => d.freshness === 'VERIFIED' && d.capacityStatus !== 'FULL' && !d.availability?.paused && d.acceptsReferral);
  const highRisk = (cases.data ?? []).filter((c) => priorityOf(c, c.followUp?.dueAt) === 'high' && (c.riskDecision === 'HUMAN_REVIEW' || c.riskDecision === 'EMERGENCY_111' || c.urgency === 'urgent' || pathwayOf(c) === 'child')).length;
  const r = report.data?.report;
  const p = report.data?.previous;
  const slaTotal = r ? r.sla.onTime + r.sla.soon + r.sla.late : 0;
  const slaPct = slaTotal ? ((r!.sla.onTime + r!.sla.soon) / slaTotal) * 100 : 100;

  const whyLabel = (w: Why) => ({ allocate: tx({ vi: 'Chờ phân bổ', en: 'To allocate' }), held: tx({ vi: 'Giữ an toàn', en: 'Safety hold' }), declined: tx({ vi: 'Đối tác từ chối', en: 'Partner declined' }) })[w];

  const columns: Column<Row>[] = [
    {
      key: 'who',
      header: tx({ vi: 'Tên (bí danh)', en: 'Alias' }),
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{row.name}</p>
            <p className="truncate text-xs text-muted">{row.c.age != null ? `${row.c.age} ${tx({ vi: 'tuổi', en: 'y/o' })}` : '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'need',
      header: tx({ vi: 'Nhu cầu · Địa bàn', en: 'Need · Area' }),
      cell: (row) => (
        <span className="grid text-[13.5px]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-ink-2">
            {row.c.need && <NeedIcon need={row.c.need} className="size-4 text-brand" />}
            {row.c.need ? s.need[row.c.need] : '—'}
          </span>
          <span className="inline-flex items-center gap-1 text-muted">
            <MapPin className="size-3.5" aria-hidden />
            {row.c.district ?? '—'}
          </span>
        </span>
      ),
    },
    { key: 'step', header: tx({ vi: 'Bước hiện tại', en: 'Step' }), cell: (row) => <StepPill step={stepOfStage(row.c.stage)} /> },
    { key: 'prio', header: tx({ vi: 'Ưu tiên', en: 'Priority' }), cell: (row) => <PriorityPill priority={row.priority} /> },
    {
      key: 'partner',
      header: tx({ vi: 'Đối tác gợi ý', en: 'Likely partner' }),
      hideOnMobile: true,
      cell: (row) =>
        row.why === 'held' ? (
          <span className="text-[13px] text-danger">{tx({ vi: 'Cần xem xét an toàn trước', en: 'Safety review first' })}</span>
        ) : row.partner ? (
          <span className="grid text-[13px]">
            <span className="line-clamp-1 font-semibold text-ink">{row.partner.organisationName}</span>
            <span className="text-step">● {tx({ vi: `Còn ${row.partner.slotsAvailable ?? '?'} suất`, en: `${row.partner.slotsAvailable ?? '?'} places` })}</span>
          </span>
        ) : (
          <span className="text-[13px] text-warn">{tx({ vi: 'Chưa có đối tác phù hợp', en: 'No match yet' })}</span>
        ),
    },
    {
      key: 'act',
      header: tx({ vi: 'Hành động', en: 'Action' }),
      cell: (row) => (
        <Link
          to={row.why === 'held' ? '/coordinator/safety' : `/coordinator/match/${row.c.id}`}
          onClick={(e) => e.stopPropagation()}
          className={`press inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-bold ${row.why === 'held' ? 'border border-danger-line bg-danger-soft text-danger' : 'bg-brand text-white hover:bg-brand-strong'}`}
        >
          {row.why === 'held' ? tx({ vi: 'Xem xét', en: 'Review' }) : tx({ vi: 'Điều phối ngay', en: 'Allocate' })}
        </Link>
      ),
    },
  ];

  const activity = buildActivity(referrals.data ?? [], escalations.data ?? [], tx);

  return (
    <div>
      <PageHero
        eyebrow={tx({ vi: 'Điều phối viên', en: 'Coordinator' })}
        title={tx({ vi: 'Toàn cảnh điều phối hôm nay', en: 'Today at a glance' })}
        description={tx({ vi: 'Kết nối đúng nhu cầu với đúng hỗ trợ, đồng thời theo dõi rủi ro an toàn để không ai bị bỏ lại phía sau.', en: 'Match needs to the right help and watch safety risks so nobody is left behind.' })}
      />

      <KpiRow>
        <KpiCard icon={<ClipboardList className="size-5" />} tone="brand" filled label={tx({ vi: 'Ca chờ phân bổ', en: 'Awaiting allocation' })} value={rows.filter((x) => x.why !== 'held').length} unit={tx({ vi: `${rows.filter((x) => x.why === 'declined').length} bị từ chối cần tìm nơi khác`, en: `${rows.filter((x) => x.why === 'declined').length} declined` })} to="/coordinator/match" />
        <KpiCard icon={<Clock className="size-5" />} tone="danger" filled label={tx({ vi: 'Ca quá hạn phản hồi', en: 'Past response time' })} value={r?.sla.late ?? '—'} unit={tx({ vi: 'đối tác chưa trả lời', en: 'partner has not replied' })} />
        <KpiCard icon={<Users className="size-5" />} tone="step" filled label={tx({ vi: 'Đối tác sẵn sàng', en: 'Partners ready' })} value={ready.length} unit={tx({ vi: `/ ${(directory.data ?? []).length} dịch vụ`, en: `/ ${(directory.data ?? []).length} services` })} to="/directory" />
        <KpiCard icon={<ShieldAlert className="size-5" />} tone="warn" filled label={tx({ vi: 'Hành trình nguy cơ cao', en: 'High-risk journeys' })} value={highRisk} unit={p ? tx({ vi: `${escalations.data?.length ?? 0} cảnh báo mở`, en: `${escalations.data?.length ?? 0} open alerts` }) : undefined} to="/coordinator/safety" />
      </KpiRow>

      {(cases.isError || escalations.isError) && (
        <div className="mb-4">
          <ErrorBanner title={s.common.errorTitle} message={errorMessage(cases.error ?? escalations.error, s.common.offline)} onRetry={() => (cases.refetch(), escalations.refetch())} retryLabel={s.common.retry} />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 gap-4">
          <Panel
            title={
              <>
                {tx({ vi: 'Ca cần xử lý hôm nay', en: 'Cases to handle today' })} <span className="tabular text-muted">({rows.length})</span>
              </>
            }
            action={<SeeAll to="/journeys">{tx({ vi: 'Xem tất cả', en: 'See all' })}</SeeAll>}
          >
            {cases.isLoading ? (
              <SkeletonCard rows={5} />
            ) : (
              <DataTable
                label={tx({ vi: 'Ca cần xử lý', en: 'Cases to handle' })}
                rows={rows.slice(0, 8)}
                columns={columns}
                rowKey={(x) => x.c.id}
                empty={<EmptyState icon={<HandHeart className="size-6" />} title={tx({ vi: 'Không có ca nào chờ điều phối', en: 'Nothing waiting for allocation' })} />}
              />
            )}
            {rows.some((x) => x.why !== 'held') && (
              <p className="mt-3 flex items-start gap-1.5 text-[13px] text-muted">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                {tx({ vi: '“Đối tác gợi ý” chỉ là gợi ý nhanh. Quyết định cuối cùng đi qua màn Ghép ca, nơi kiểm tra đủ 6 lớp lọc và sự đồng ý của người được hỗ trợ.', en: '“Likely partner” is a quick hint. The decision goes through the match screen with all 6 filters and the person’s consent.' })}
              </p>
            )}
          </Panel>

          <Panel title={tx({ vi: 'Hoạt động gần đây', en: 'Recent activity' })}>
            <ActivityFeed items={activity} empty={tx({ vi: 'Chưa có hoạt động.', en: 'No activity yet.' })} />
          </Panel>
        </div>

        <div className="grid h-fit gap-4">
          <Panel tone="danger" title={<span className="text-danger">{tx({ vi: `Cảnh báo an toàn (${escalations.data?.length ?? 0})`, en: `Safety alerts (${escalations.data?.length ?? 0})` })}</span>} icon={<AlertTriangle className="size-5 text-danger" />} action={<SeeAll to="/coordinator/safety">{tx({ vi: 'Xem tất cả', en: 'See all' })}</SeeAll>} bodyClassName="p-2 pt-1">
            {(escalations.data ?? []).length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted">{tx({ vi: 'Không có cảnh báo mở.', en: 'No open alerts.' })}</p>
            ) : (
              (escalations.data ?? []).slice(0, 3).map((e) => (
                <AlertRow
                  key={e.id}
                  to="/coordinator/safety"
                  icon={<AlertTriangle className="size-5" />}
                  title={e.alias ?? e.caseId}
                  detail={<span className="line-clamp-1">{humanizeReason(e.reason, lang)}</span>}
                  meta={new Date(e.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                />
              ))
            )}
          </Panel>

          <Panel title={tx({ vi: `Đối tác sẵn sàng (${ready.length})`, en: `Partners ready (${ready.length})` })} icon={<Building2 className="size-5" />} action={<SeeAll to="/directory">{tx({ vi: 'Xem tất cả', en: 'See all' })}</SeeAll>} bodyClassName="p-2 pt-1">
            {ready
              .slice()
              .sort((a, b) => (b.slotsAvailable ?? 0) - (a.slotsAvailable ?? 0))
              .slice(0, 4)
              .map((d) => (
                <Link key={d.id} to="/directory" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-sunken">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-step-soft text-step">
                    <NeedIcon need={d.category as never} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-ink">{d.organisationName}</span>
                    <span className="block truncate text-xs text-muted">{d.serviceName}</span>
                  </span>
                  <span className="tabular shrink-0 text-[13px] font-semibold text-step">{tx({ vi: `${d.slotsAvailable ?? '?'} suất`, en: `${d.slotsAvailable ?? '?'} places` })}</span>
                </Link>
              ))}
          </Panel>

          <Panel title={tx({ vi: 'Theo dõi SLA phản hồi', en: 'Response SLA' })} icon={<Gauge className="size-5" />} action={<SeeAll to="/coordinator/reports">{tx({ vi: 'Chi tiết', en: 'Details' })}</SeeAll>}>
            <div className="flex items-center gap-4">
              <DonutGauge value={slaPct} label={tx({ vi: 'Trong hạn', en: 'Within SLA' })} />
              <div className="grid flex-1 gap-1.5 text-[14px]">
                <p className="text-sm font-semibold text-ink">{tx({ vi: 'Chuyển gửi đang chờ đối tác', en: 'Referrals waiting for partners' })}</p>
                <SlaLine color="bg-step" label={tx({ vi: 'Còn trong hạn', en: 'Within SLA' })} n={r?.sla.onTime ?? 0} />
                <SlaLine color="bg-amber-500" label={tx({ vi: 'Sắp quá hạn (<12h)', en: 'Due soon (<12h)' })} n={r?.sla.soon ?? 0} />
                <SlaLine color="bg-danger" label={tx({ vi: 'Quá hạn', en: 'Late' })} n={r?.sla.late ?? 0} />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">{tx({ vi: 'SLA: 24 giờ với ca khẩn cấp, 48 giờ với ca thường.', en: 'SLA: 24h urgent, 48h normal.' })}</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function SlaLine({ color, label, n }: { color: string; label: string; n: number }) {
  return (
    <p className="flex items-center gap-2 text-ink-2">
      <span className={`size-2.5 rounded-full ${color}`} aria-hidden />
      <span className="flex-1">{label}</span>
      <span className="tabular font-semibold">{n}</span>
    </p>
  );
}

type Tx = (c: { vi: string; en: string }) => string;

function buildActivity(refs: InboxReferral[], escs: Escalation[], tx: Tx): ActivityItem[] {
  const stageText: Record<string, { vi: string; en: string }> = {
    CREATED: { vi: 'đã được gửi cho', en: 'was sent to' },
    RECEIVED: { vi: 'đã được mở bởi', en: 'was opened by' },
    ACCEPTED: { vi: 'đã được nhận bởi', en: 'was accepted by' },
    DECLINED: { vi: 'bị từ chối bởi', en: 'was declined by' },
    ACTION_TAKEN: { vi: 'đã được hỗ trợ bởi', en: 'was supported by' },
    OUTCOME_RECORDED: { vi: 'đã có kết quả từ', en: 'has an outcome from' },
    FOLLOW_UP_DONE: { vi: 'đã hỏi thăm xong với', en: 'finished follow-up with' },
    CLOSED: { vi: 'đã đóng với', en: 'was closed with' },
    ESCALATED: { vi: 'đã được chuyển điều phối viên từ', en: 'was escalated from' },
  };
  const items: ActivityItem[] = refs.map((r) => ({
    id: `r-${r.id}`,
    at: r.updatedAt,
    tone: r.stage === 'DECLINED' ? 'danger' : r.stage === 'ACCEPTED' || r.stage === 'ACTION_TAKEN' ? 'step' : 'brand',
    text: (
      <>
        <strong>{r.alias}</strong> {tx(stageText[r.stage] ?? stageText.CREATED)} {r.organisationName}
      </>
    ),
  }));
  for (const e of escs) items.push({ id: `e-${e.id}`, at: e.createdAt, tone: 'danger', text: <>{tx({ vi: 'Cảnh báo an toàn mới', en: 'New safety alert' })}: <strong>{e.alias}</strong></> });
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5);
}

