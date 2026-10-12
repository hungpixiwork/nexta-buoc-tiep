/**
 * Báo cáo & chất lượng vận hành (mockup 9).
 * Why: the pilot is judged on outcomes (people reaching the right service, adults starting trial
 * work, older people getting welfare, children back in protection) — not on app usage. Every
 * number here comes from /loop/reports with definitions shown on screen, and the recommendations
 * are rules over those numbers, so a coordinator can defend each one to partners and funders.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CalendarDays, ChevronRight, Clock, ClipboardList, Info, ShieldAlert, Sparkles, Users } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { EmptyState, ErrorBanner, SkeletonCard, cx } from '../../design/ui';
import { HBar, KpiCard, KpiRow, PageHero, Panel, Segmented, STEP_META } from '../../design/dashboard';
import { NeedIcon } from '../../design/widgets';
import { errorMessage, useReport } from '../../lib/hooks';
import type { LoopReport } from '@buoc-tiep/shared';

const STEP_COLOR = ['#38BDF8', '#34D399', '#A78BFA', '#2DD4BF', '#60A5FA', '#FBBF24'];
const NEED_COLOR = ['#2563EB', '#059669', '#7C3AED', '#0284C7', '#D97706', '#64748B', '#DB2777', '#0D9488'];
const STEP_DESC = [
  { vi: 'Phát hiện nhu cầu', en: 'Need spotted' },
  { vi: 'Lắng nghe, hiểu rõ', en: 'Listened' },
  { vi: 'Xác minh, đánh giá rủi ro', en: 'Risk checked' },
  { vi: 'Chọn hỗ trợ phù hợp', en: 'Step chosen' },
  { vi: 'Đối tác đã nhận', en: 'Partner accepted' },
  { vi: 'Hỏi thăm có kết quả', en: 'Followed up' },
];

type Tx = (c: { vi: string; en: string }) => string;

export function ReportsPage() {
  const { tx, s } = useApp();
  const [range, setRange] = useState<'week' | 'month'>('week');
  const q = useReport(range);
  const r = q.data?.report;
  const p = q.data?.previous;
  // Only compare with the previous period when it actually had data — otherwise "+100pp" is noise.
  const prevHasCases = Boolean(p && p.funnel[0].count > 0);
  const prevHasDecisions = Boolean(p && p.partners.length > 0);
  const vsLabel = range === 'week' ? tx({ vi: 'so với tuần trước', en: 'vs last week' }) : tx({ vi: 'so với tháng trước', en: 'vs last month' });

  return (
    <div>
      <PageHero
        eyebrow={tx({ vi: 'Báo cáo & chất lượng', en: 'Reports & quality' })}
        tags={<span className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] font-bold text-muted">{tx({ vi: 'Điều phối viên', en: 'Coordinator' })}</span>}
        title={tx({ vi: 'Báo cáo & chất lượng vận hành', en: 'Operations & quality report' })}
        description={tx({ vi: 'Theo dõi kết quả hỗ trợ, mức độ phản hồi của đối tác và các tín hiệu an toàn để mỗi người được hỗ trợ kịp thời, đúng nhu cầu.', en: 'Track outcomes, partner responsiveness and safety signals so everyone gets timely, fitting help.' })}
        aside={
          <Segmented
            label={tx({ vi: 'Kỳ báo cáo', en: 'Period' })}
            value={range}
            onChange={setRange}
            options={[
              { value: 'week', label: <><CalendarDays className="size-4" aria-hidden />{tx({ vi: 'Tuần này', en: 'This week' })}</> },
              { value: 'month', label: tx({ vi: 'Tháng này', en: 'This month' }) },
            ]}
          />
        }
      />

      {q.isError && <ErrorBanner title={s.common.errorTitle} message={errorMessage(q.error, s.common.offline)} onRetry={() => q.refetch()} retryLabel={s.common.retry} />}
      {q.isLoading || !r || !p ? (
        <SkeletonCard rows={6} />
      ) : (
        <>
          <KpiRow>
            <KpiCard icon={<ClipboardList className="size-5" />} tone="brand" label={tx({ vi: 'Hành trình đang theo dõi', en: 'Journeys open' })} value={r.journeysActive} unit={tx({ vi: `${r.funnel[0].count} ca mới trong kỳ`, en: `${r.funnel[0].count} new this period` })} delta={prevHasCases ? { value: r.funnel[0].count - p.funnel[0].count, label: vsLabel } : undefined} />
            <KpiCard icon={<Users className="size-5" />} tone="step" label={tx({ vi: 'Tỷ lệ kết nối thành công', en: 'Connection success' })} value={`${r.connectionRate}%`} delta={prevHasDecisions ? { value: r.connectionRate - p.connectionRate, suffix: 'pp', label: vsLabel } : undefined} unit={prevHasDecisions ? undefined : tx({ vi: 'kỳ trước chưa có dữ liệu', en: 'no data last period' })} />
            <KpiCard icon={<Clock className="size-5" />} tone="ai" label={tx({ vi: 'Đối tác phản hồi đúng hạn', en: 'On-time partner reply' })} value={`${r.onTimeRate}%`} delta={prevHasDecisions ? { value: r.onTimeRate - p.onTimeRate, suffix: 'pp', label: vsLabel } : undefined} unit={prevHasDecisions ? undefined : tx({ vi: 'kỳ trước chưa có dữ liệu', en: 'no data last period' })} />
            <KpiCard icon={<AlertTriangle className="size-5" />} tone="warn" label={tx({ vi: 'Ca cần xem lại', en: 'Needs review' })} value={r.needsReview} delta={prevHasCases ? { value: r.needsReview - p.needsReview, upIsGood: false, label: vsLabel } : undefined} unit={tx({ vi: 'việc cần xử lý', en: 'items' })} />
          </KpiRow>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <Panel title={tx({ vi: 'Hành trình hỗ trợ: từ nhu cầu đến kết quả', en: 'From need to outcome' })} action={<span title={tx({ vi: 'Trong số hành trình mở trong kỳ, bao nhiêu đã đến từng bước', en: 'Of journeys opened in the period, how many reached each step' })}><Info className="size-4 text-muted" aria-hidden /></span>}>
              {r.funnel[0].count === 0 ? (
                <EmptyState title={tx({ vi: 'Chưa có hành trình nào mở trong kỳ này', en: 'No journeys opened in this period' })} />
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {r.funnel.map((f, i) => (
                    <div key={f.step} className="flex flex-col items-center rounded-2xl bg-sunken px-2 py-3 text-center">
                      <span className="grid size-6 place-items-center rounded-full text-xs font-black text-white" style={{ backgroundColor: STEP_COLOR[i] }}>
                        {f.step}
                      </span>
                      <span className="mt-1 text-[13px] font-bold text-ink-2">{tx(STEP_META[i])}</span>
                      <span className="tabular text-[24px] font-extrabold text-ink">{f.count}</span>
                      <span className="tabular text-xs text-muted">{f.pct}%</span>
                      <div className="mt-2 flex h-24 w-full items-end justify-center">
                        <div className="w-3/4 rounded-t-lg" style={{ height: `${Math.max(4, f.pct)}%`, backgroundColor: STEP_COLOR[i] }} />
                      </div>
                      <span className="mt-2 text-[11.5px] leading-tight text-muted">{tx(STEP_DESC[i])}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title={range === 'week' ? tx({ vi: 'Nhu cầu phổ biến tuần này', en: 'Top needs this week' }) : tx({ vi: 'Nhu cầu phổ biến tháng này', en: 'Top needs this month' })}>
              {r.needs.length === 0 ? (
                <EmptyState title={tx({ vi: 'Chưa có dữ liệu', en: 'No data yet' })} />
              ) : (
                <div className="grid gap-3">
                  {r.needs.map((n, i) => (
                    <HBar key={n.need} icon={<NeedIcon need={n.need as never} className="size-4" />} label={s.need[n.need as keyof typeof s.need] ?? n.need} value={n.count} max={r.needs[0].count} share={n.pct} color={NEED_COLOR[i % NEED_COLOR.length]} />
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <Panel title={tx({ vi: 'Đối tác phản hồi nhanh nhất', en: 'Fastest-responding partners' })}>
              {r.partners.length === 0 ? (
                <p className="text-sm text-muted">{tx({ vi: 'Chưa có đối tác nào phản hồi trong kỳ.', en: 'No partner decisions in this period.' })}</p>
              ) : (
                <table className="w-full text-left text-[13.5px]">
                  <thead className="text-xs text-muted">
                    <tr>
                      <th className="w-6 pb-2">#</th>
                      <th className="pb-2">{tx({ vi: 'Đối tác', en: 'Partner' })}</th>
                      <th className="pb-2 text-right">{tx({ vi: 'TB', en: 'Avg' })}</th>
                      <th className="pb-2 text-right">{tx({ vi: 'Đúng hạn', en: 'On time' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.partners.slice(0, 6).map((pt, i) => (
                      <tr key={pt.organisationName} className="border-t border-line">
                        <td className="py-2 text-muted">{i + 1}</td>
                        <td className="py-2">
                          <span className="line-clamp-1 font-semibold text-ink">{pt.organisationName}</span>
                          <span className="text-xs text-muted">{pt.category ? s.need[pt.category as keyof typeof s.need] ?? pt.category : ''} · {tx({ vi: `${pt.decided} ca`, en: `${pt.decided} cases` })}</span>
                        </td>
                        <td className="tabular whitespace-nowrap py-2 text-right">{pt.avgHours < 1 ? tx({ vi: '< 1 giờ', en: '< 1h' }) : tx({ vi: `${pt.avgHours} giờ`, en: `${pt.avgHours}h` })}</td>
                        <td className={cx('tabular py-2 text-right font-bold', pt.onTimeRate >= 80 ? 'text-step' : pt.onTimeRate >= 50 ? 'text-warn' : 'text-danger')}>{pt.onTimeRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>

            <Panel title={tx({ vi: 'Tín hiệu cần chú ý', en: 'Signals to watch' })} bodyClassName="grid gap-2">
              <Signal to="/journeys" tone="danger" icon={<AlertTriangle className="size-5" />} n={r.signals.staleJourneys} title={tx({ vi: 'Hành trình quá hạn', en: 'Stalled journeys' })} hint={tx({ vi: 'Chưa có cập nhật sau 7 ngày', en: 'No update in 7 days' })} />
              <Signal to="/coordinator" tone="warn" icon={<Clock className="size-5" />} n={r.signals.waitingPartner} title={tx({ vi: 'Chờ đối tác phản hồi', en: 'Waiting on partners' })} hint={tx({ vi: 'Đã quá hạn 24/48 giờ', en: 'Past the 24/48h SLA' })} />
              <Signal to="/navigator/follow-ups" tone="warn" icon={<CalendarDays className="size-5" />} n={r.signals.overdueFollowUps} title={tx({ vi: 'Hỏi thăm quá hạn', en: 'Overdue check-ins' })} hint={tx({ vi: 'Người đồng hành chưa ghi nhận', en: 'Not yet recorded' })} />
              <Signal to="/coordinator/safety" tone="brand" icon={<ShieldAlert className="size-5" />} n={r.signals.openSafety} title={tx({ vi: 'Tín hiệu rủi ro an toàn', en: 'Open safety alerts' })} hint={tx({ vi: 'Cần điều phối viên xem xét', en: 'Need a coordinator' })} />
            </Panel>

            <Panel title={tx({ vi: 'Khuyến nghị hành động', en: 'Recommended actions' })} icon={<Sparkles className="size-5" />} bodyClassName="grid gap-2">
              {recommendations(r, p, tx, s.need as Record<string, string>).map((rec) => (
                <Link key={rec.title} to={rec.to} className={cx('press flex items-start gap-3 rounded-xl border p-3', rec.cls)}>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">{rec.title}</p>
                    <p className="text-[13px] text-ink-2">{rec.body}</p>
                  </div>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-muted" aria-hidden />
                </Link>
              ))}
            </Panel>
          </div>

          <p className="mt-4 flex items-start gap-1.5 text-xs text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {tx({
              vi: 'Cách tính: Kết nối thành công = đối tác nhận ÷ đối tác đã quyết định. Đúng hạn = quyết định trong 24 giờ (khẩn cấp) hoặc 48 giờ. Phễu tính trên hành trình mở trong kỳ.',
              en: 'Definitions: success = accepted ÷ decided. On time = decided within 24h (urgent) or 48h. Funnel counts journeys opened in the period.',
            })}
          </p>
        </>
      )}
    </div>
  );
}

function Signal({ to, tone, icon, n, title, hint }: { to: string; tone: 'danger' | 'warn' | 'brand'; icon: React.ReactNode; n: number; title: string; hint: string }) {
  const cls = { danger: 'border-danger-line bg-danger-soft text-danger', warn: 'border-warn-line bg-warn-soft text-warn', brand: 'border-brand-line bg-brand-soft text-brand' }[tone];
  return (
    <Link to={to} className={cx('press flex items-center gap-3 rounded-xl border p-3', cls)}>
      {icon}
      <span className="tabular w-8 text-[22px] font-extrabold">{n}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-ink">{title}</span>
        <span className="block text-[13px] text-ink-2">{hint}</span>
      </span>
      <ArrowRight className="size-4 shrink-0" aria-hidden />
    </Link>
  );
}

/** Rule-based, explainable recommendations over the report numbers. */
function recommendations(r: LoopReport, p: LoopReport, tx: Tx, needLabel: Record<string, string>) {
  const out: Array<{ title: string; body: string; to: string; cls: string }> = [];
  const top = r.needs[0];
  const prevTop = p.needs.find((n) => n.need === top?.need);
  if (top && top.count >= 2) {
    const growth = prevTop && prevTop.count > 0 ? Math.round(((top.count - prevTop.count) / prevTop.count) * 100) : null;
    out.push({
      title: tx({ vi: `Tăng nguồn lực “${needLabel[top.need] ?? top.need}”`, en: `Grow “${needLabel[top.need] ?? top.need}” capacity` }),
      body: tx({
        vi: `Chiếm ${top.pct}% nhu cầu${growth != null ? `, ${growth >= 0 ? 'tăng' : 'giảm'} ${Math.abs(growth)}% so với kỳ trước` : ''}. Rà soát và xác minh thêm đối tác cho nhóm này.`,
        en: `${top.pct}% of needs${growth != null ? `, ${growth >= 0 ? 'up' : 'down'} ${Math.abs(growth)}% vs previous` : ''}. Verify more partners for it.`,
      }),
      to: '/directory',
      cls: 'border-step-line bg-step-soft',
    });
  }
  if (r.signals.staleJourneys + r.signals.overdueFollowUps > 0) {
    out.push({
      title: tx({ vi: 'Theo dõi các ca quá hạn', en: 'Chase overdue cases' }),
      body: tx({ vi: `${r.signals.staleJourneys} hành trình không cập nhật 7 ngày, ${r.signals.overdueFollowUps} lượt hỏi thăm quá hạn. Nhắc người đồng hành trong hôm nay.`, en: `${r.signals.staleJourneys} journeys idle 7 days, ${r.signals.overdueFollowUps} overdue check-ins. Nudge navigators today.` }),
      to: '/navigator/follow-ups',
      cls: 'border-brand-line bg-brand-soft',
    });
  }
  const slow = r.partners.filter((pt) => pt.onTimeRate < 60);
  if (slow.length) {
    out.push({
      title: tx({ vi: 'Liên hệ đối tác phản hồi chậm', en: 'Contact slow partners' }),
      body: tx({ vi: `${slow.map((x) => x.organisationName).slice(0, 2).join(', ')} đúng hạn dưới 60%. Kiểm tra lại năng lực hoặc đầu mối tiếp nhận.`, en: `${slow.map((x) => x.organisationName).slice(0, 2).join(', ')} under 60% on time. Recheck capacity or contact person.` }),
      to: '/directory',
      cls: 'border-warn-line bg-warn-soft',
    });
  }
  if (r.funnel[0].count > 0 && r.funnel[2].pct < 60) {
    out.push({
      title: tx({ vi: 'Nhiều ca dừng ở bước Xác minh', en: 'Many cases stuck at Verify' }),
      body: tx({ vi: `Chỉ ${r.funnel[2].pct}% hành trình qua bước đánh giá rủi ro. Kiểm tra hàng đợi An toàn và hướng dẫn người đồng hành hoàn tất bước Thấu hiểu.`, en: `Only ${r.funnel[2].pct}% passed the risk check. Review the safety queue and help navigators finish Understand.` }),
      to: '/coordinator/safety',
      cls: 'border-ai-line bg-ai-soft',
    });
  }
  if (out.length === 0) out.push({ title: tx({ vi: 'Vận hành ổn định', en: 'Running smoothly' }), body: tx({ vi: 'Không có tín hiệu bất thường trong kỳ này.', en: 'No unusual signals this period.' }), to: '/coordinator', cls: 'border-step-line bg-step-soft' });
  return out.slice(0, 3);
}
