/**
 * Ghép ca với đối tác phù hợp (mockup 2).
 * Why: choosing a partner is a human decision informed by the pipeline, not the other way round.
 * Candidates only come from the 6-stage match pipeline (need → area → eligibility → hours →
 * verification → capacity); the coordinator sees why each fits, how fast that partner really
 * answers, and a checklist that must be green before anything is sent — including the person's agreement.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, BadgeCheck, Bookmark, CheckCircle2, CircleDashed, Clock, HeartHandshake, Lightbulb, MapPin, Send, ShieldAlert, Sparkles, Target, Users, Zap } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Button, EmptyState, ErrorBanner, Field, SkeletonCard, TextInput, cx } from '../../design/ui';
import { Avatar, PageHero, Panel, PathwayPill, Pill, PriorityPill, Segmented, StepPill } from '../../design/dashboard';
import { NeedIcon, flagLabel, useReasonLabel } from '../../design/widgets';
import { errorMessage, useCases, useJourney, useLoopMutation, useReport } from '../../lib/hooks';
import { priorityOf, stepOfStage } from '../../lib/caseSignals';
import { displayName, pathwayOf } from '../../lib/pathway';
import { toLocalInput } from '../../lib/format';
import type { MatchCandidate } from '../../lib/types';

type Sort = 'best' | 'local' | 'fast' | 'slots';

export function MatchPage() {
  const { caseId } = useParams();
  return caseId ? <MatchCase caseId={caseId} /> : <PickCase />;
}

/** Without a case: list journeys waiting for allocation. */
function PickCase() {
  const { tx, s } = useApp();
  const cases = useCases('OPEN');
  const waiting = (cases.data ?? []).filter((c) => (c.stage === 'MATCH' || c.stage === 'NEXT_STEP') && !c.referral && c.riskDecision === 'PROCEED');
  return (
    <div>
      <PageHero eyebrow={tx({ vi: 'Điều phối viên', en: 'Coordinator' })} title={tx({ vi: 'Ghép ca với đối tác phù hợp', en: 'Match cases with partners' })} description={tx({ vi: 'Chọn một ca đang chờ phân bổ để xem các đối tác phù hợp.', en: 'Pick a case waiting for allocation to see matching partners.' })} />
      <Panel title={tx({ vi: `Ca chờ phân bổ (${waiting.length})`, en: `Waiting (${waiting.length})` })}>
        {cases.isLoading ? (
          <SkeletonCard rows={4} />
        ) : waiting.length === 0 ? (
          <EmptyState icon={<CheckCircle2 className="size-6" />} title={tx({ vi: 'Không có ca nào chờ phân bổ', en: 'Nothing waiting' })} />
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {waiting.map((c) => (
              <li key={c.id}>
                <Link to={`/coordinator/match/${c.id}`} className="press flex items-center gap-3 rounded-2xl border border-line p-3 hover:bg-sunken">
                  <Avatar name={displayName(c)} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{displayName(c)}</span>
                    <span className="block text-[13px] text-muted">
                      {c.need ? s.need[c.need] : '—'} · {c.district ?? '—'}
                    </span>
                  </span>
                  <PriorityPill priority={priorityOf(c, c.nextStep?.dueAt)} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function MatchCase({ caseId }: { caseId: string }) {
  const { tx, s, lang } = useApp();
  const navigate = useNavigate();
  const journey = useJourney(caseId);
  const report = useReport('month');
  const runMatch = useLoopMutation(`/cases/${caseId}/match`);
  const autoRan = useRef(false);
  const [sort, setSort] = useState<Sort>('best');
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date(Date.now() + 86_400_000);
    d.setHours(9, 0, 0, 0);
    return toLocalInput(d.toISOString());
  });
  const createStep = useLoopMutation<{ resourceId: string; action: string; ownerName: string; ownerRole: 'NAVIGATOR'; place: string; dueAt: string }, { nextStep: { id: string } }>(`/cases/${caseId}/next-steps`);
  const confirm = useLoopMutation<{ _id: string; beneficiaryAgreed: true; contactConfirmed: boolean; note?: string }, { referralId: string }>((b) => `/next-steps/${b._id}/confirm`);
  const reasonLabel = useReasonLabel();

  const c = journey.data?.case;
  const match = journey.data?.match;
  const canMatch = c?.riskDecision === 'PROCEED';
  const openReferral = journey.data?.referrals.find((r) => !['DECLINED', 'CLOSED'].includes(r.stage));

  // Run the pipeline once when the case is ready and has no stored match yet.
  useEffect(() => {
    if (c && canMatch && !match && !openReferral && !autoRan.current) {
      autoRan.current = true;
      runMatch.mutate(undefined as never);
    }
  }, [c, canMatch, match, openReferral, runMatch]);

  const speed = useMemo(() => new Map((report.data?.report.partners ?? []).concat(report.data?.previous.partners ?? []).map((p) => [p.organisationName, p])), [report.data]);
  const candidates = useMemo(() => {
    const list = [...(match?.candidates ?? [])];
    const h = (x: MatchCandidate) => speed.get(x.resource.organisationName)?.avgHours ?? Number.POSITIVE_INFINITY;
    if (sort === 'local') list.sort((a, b) => Number(b.locationFit === 'same_district') - Number(a.locationFit === 'same_district') || b.score - a.score);
    if (sort === 'fast') list.sort((a, b) => h(a) - h(b) || b.score - a.score);
    if (sort === 'slots') list.sort((a, b) => (b.resource.slotsAvailable ?? -1) - (a.resource.slotsAvailable ?? -1));
    return list;
  }, [match, sort, speed]);
  const picked = candidates.find((x) => x.resource.id === pickedId) ?? candidates[0];

  if (journey.isLoading) return <SkeletonCard rows={6} />;
  if (journey.isError || !c) return <ErrorBanner title={s.common.errorTitle} message={errorMessage(journey.error, s.common.offline)} onRetry={() => journey.refetch()} retryLabel={s.common.retry} />;

  const name = displayName(c);
  const pathway = pathwayOf(c);
  const priority = priorityOf(c, journey.data?.nextSteps.find((n) => n.status !== "CANCELLED")?.dueAt);
  const flags = c.risk?.flags ?? [];

  const checks = [
    { ok: Boolean(c.need && c.district && c.priorityStatement), title: tx({ vi: 'Dữ liệu tối thiểu đã đủ', en: 'Minimum data complete' }), hint: tx({ vi: 'Bí danh, nhu cầu, địa bàn và mong muốn đã được ghi nhận.', en: 'Alias, need, area and goal recorded.' }), required: true },
    { ok: c.consent?.allowSharingWithPartner === true, title: tx({ vi: 'Đồng ý chia sẻ với đối tác', en: 'Consent to share with partner' }), hint: tx({ vi: 'Đã giải thích và người được hỗ trợ đồng ý chia sẻ thông tin tối thiểu.', en: 'Explained and agreed to share minimum data.' }), required: true },
    { ok: Boolean(picked && picked.resource.capacityStatus !== 'FULL'), title: tx({ vi: 'Đối tác còn suất tiếp nhận', en: 'Partner has places' }), hint: picked ? tx({ vi: `${picked.resource.organisationName}: ${picked.resource.slotsAvailable ?? 'chưa rõ'} suất`, en: `${picked.resource.organisationName}: ${picked.resource.slotsAvailable ?? 'unknown'} places` }) : '—', required: true },
    ...(pathway === 'child' ? [{ ok: picked?.resource.category !== 'employment', title: tx({ vi: 'Không phải kết nối lao động', en: 'Not an employment referral' }), hint: tx({ vi: 'Trẻ em chỉ được kết nối bảo vệ, học tập, chăm sóc.', en: 'Children only go to protection, school or care.' }), required: true }] : []),
    { ok: candidates.length >= 2, title: tx({ vi: 'Có phương án dự phòng', en: 'Backup option exists' }), hint: candidates.length >= 2 ? tx({ vi: `Còn ${candidates.length - 1} đối tác thay thế nếu bị từ chối.`, en: `${candidates.length - 1} alternatives if declined.` }) : tx({ vi: 'Chỉ có 1 lựa chọn — nếu bị từ chối cần tìm thêm nguồn lực.', en: 'Only one option — find more if declined.' }), required: false },
    { ok: agreed, title: tx({ vi: 'Người được hỗ trợ đồng ý bước này', en: 'The person agreed to this step' }), hint: tx({ vi: 'Xác nhận qua người đồng hành trước khi gửi.', en: 'Confirmed via the navigator before sending.' }), required: true, toggle: true },
  ];
  const ready = checks.every((x) => x.ok || !x.required);

  const send = async () => {
    if (!picked) return;
    const r = picked.resource;
    const step = await createStep.mutateAsync({
      resourceId: r.id,
      action: tx({ vi: `Kết nối với ${r.organisationName} — ${r.serviceName}`, en: `Connect with ${r.organisationName} — ${r.serviceName}` }).slice(0, 300),
      ownerName: c.navigatorName ?? 'Navigator',
      ownerRole: 'NAVIGATOR',
      place: (r.address ?? r.district ?? '—').padEnd(3, '.'),
      dueAt: new Date(dueAt).toISOString(),
    });
    await confirm.mutateAsync({ _id: step.nextStep.id, beneficiaryAgreed: true, contactConfirmed: picked.freshness === 'VERIFIED', note: tx({ vi: 'Điều phối viên gửi sau khi người được hỗ trợ đồng ý qua người đồng hành', en: 'Sent by coordinator after the person agreed via the navigator' }) });
    navigate('/coordinator');
  };

  return (
    <div>
      <PageHero
        eyebrow={tx({ vi: 'Điều phối viên', en: 'Coordinator' })}
        title={tx({ vi: 'Ghép ca với đối tác phù hợp', en: 'Match with the right partner' })}
        description={tx({ vi: 'Cân bằng giữa nhu cầu của người cần hỗ trợ, mức độ an toàn và năng lực của đối tác để chọn phương án phù hợp nhất.', en: 'Balance the person’s need, safety and partner capacity to pick the best option.' })}
      />

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        {/* Case */}
        <Panel title={tx({ vi: 'Thông tin ca cần điều phối', en: 'Case to allocate' })} className="h-fit">
          <Pill tone={openReferral ? 'step' : 'warn'} icon={<CircleDashed className="size-3.5" />}>
            {openReferral ? tx({ vi: `Đã gửi ${openReferral.code}`, en: `Sent ${openReferral.code}` }) : tx({ vi: 'Đang chờ ghép ca', en: 'Waiting for a match' })}
          </Pill>
          <div className="mt-3 flex items-center gap-3">
            <Avatar name={name} size="lg" />
            <div className="min-w-0">
              <p className="text-[18px] font-bold text-ink">{name}</p>
              <p className="text-sm text-muted">
                {c.age != null ? `${c.age} ${tx({ vi: 'tuổi', en: 'y/o' })} · ` : ''}
                {c.district ?? '—'}
              </p>
              <div className="mt-1.5">
                <PathwayPill pathway={pathway} />
              </div>
            </div>
          </div>
          <dl className="mt-4 grid gap-3 border-t border-line pt-4 text-[14px]">
            <div>
              <dt className="flex items-center gap-2 font-bold text-ink">
                <Target className="size-4 text-brand" aria-hidden />
                {tx({ vi: 'Nhu cầu chính', en: 'Main need' })}
              </dt>
              <dd className="mt-0.5 text-ink-2">
                {c.need ? s.need[c.need] : '—'}
                {c.priorityStatement && <span className="block text-muted">“{c.priorityStatement}”</span>}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-ink">{tx({ vi: 'Mức độ ưu tiên', en: 'Priority' })}</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-2">
                <PriorityPill priority={priority} />
                <span className="text-[13px] text-muted">{priority === 'high' ? tx({ vi: 'Cần phản hồi trong 24 giờ', en: 'Reply within 24h' }) : tx({ vi: 'Cần phản hồi trong 48 giờ', en: 'Reply within 48h' })}</span>
              </dd>
            </div>
            <div>
              <dt className="font-bold text-ink">{tx({ vi: 'Bước hiện tại', en: 'Current step' })}</dt>
              <dd className="mt-1">
                <StepPill step={stepOfStage(c.stage)} />
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 font-bold text-ink">
                <AlertTriangle className="size-4 text-danger" aria-hidden />
                {tx({ vi: 'Nguy cơ đã ghi nhận', en: 'Recorded risks' })}
              </dt>
              <dd className="mt-0.5 text-ink-2">
                {flags.length === 0 ? (
                  <span className="text-muted">{tx({ vi: 'Không có cờ rủi ro', en: 'No risk flags' })}</span>
                ) : (
                  <ul className="list-disc pl-5">
                    {flags.map((f) => (
                      <li key={f.code + f.source}>{flagLabel(f.code, lang)}</li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
            {c.constraints?.daytimeOnly && (
              <div>
                <dt className="font-bold text-ink">{tx({ vi: 'Ràng buộc', en: 'Constraints' })}</dt>
                <dd className="text-ink-2">{tx({ vi: 'Chỉ đi được ban ngày', en: 'Daytime only' })}</dd>
              </div>
            )}
          </dl>
          <Link to={`/journeys/${c.id}`} className="mt-4 inline-flex text-sm font-semibold text-brand hover:underline">
            {s.common.viewJourney} →
          </Link>
        </Panel>

        {/* Candidates */}
        <Panel title={tx({ vi: 'Đối tác phù hợp', en: 'Matching partners' })}>
          <p className="-mt-1 mb-3 text-sm text-muted">{tx({ vi: 'Chỉ gồm dịch vụ đã qua 6 lớp lọc: nhu cầu, địa bàn, điều kiện, giờ mở cửa, xác minh, còn suất.', en: 'Only services that passed 6 filters: need, area, eligibility, hours, verification, capacity.' })}</p>
          {!canMatch ? (
            <EmptyState icon={<ShieldAlert className="size-6" />} title={tx({ vi: 'Ca đang được giữ để xem xét an toàn', en: 'This case is on a safety hold' })} action={<Link to="/coordinator/safety" className="font-semibold text-brand">{tx({ vi: 'Mở màn An toàn', en: 'Open Safety' })}</Link>}>
              {tx({ vi: 'Cần điều phối viên xem xét rủi ro trước khi ghép với bất kỳ đối tác nào.', en: 'A coordinator must review the risk before any match.' })}
            </EmptyState>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <Segmented
                  label={tx({ vi: 'Sắp xếp', en: 'Sort' })}
                  value={sort}
                  onChange={setSort}
                  options={[
                    { value: 'best', label: <><Sparkles className="size-4" aria-hidden />{tx({ vi: 'Gợi ý tốt nhất', en: 'Best fit' })}</> },
                    { value: 'local', label: tx({ vi: 'Cùng quận', en: 'Same district' }) },
                    { value: 'fast', label: tx({ vi: 'Phản hồi nhanh', en: 'Fast reply' }) },
                    { value: 'slots', label: tx({ vi: 'Còn nhiều suất', en: 'Most places' }) },
                  ]}
                />
                <Button size="sm" variant="ghost" loading={runMatch.isPending} onClick={() => runMatch.mutate(undefined as never)}>
                  {tx({ vi: 'Chạy lại', en: 'Re-run' })}
                </Button>
              </div>
              {runMatch.isError && <ErrorBanner title={s.common.errorTitle} message={errorMessage(runMatch.error, s.common.offline)} />}
              {!match && runMatch.isPending ? (
                <SkeletonCard rows={4} />
              ) : candidates.length === 0 ? (
                <EmptyState icon={<Users className="size-6" />} title={tx({ vi: 'Chưa có đối tác nào qua đủ 6 lớp lọc', en: 'No partner passed all 6 filters' })}>
                  {tx({ vi: 'Hãy gọi xác minh thêm nguồn lực trong Danh bạ hoặc mở rộng khu vực.', en: 'Verify more resources in the directory or widen the area.' })}
                </EmptyState>
              ) : (
                <ol className="grid gap-2.5">
                  {candidates.map((cand, i) => (
                    <li key={cand.resource.id}>
                      <CandidateCard cand={cand} rank={i + 1} selected={picked?.resource.id === cand.resource.id} onPick={() => setPickedId(cand.resource.id)} avgHours={speed.get(cand.resource.organisationName)?.avgHours} />
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </Panel>

        {/* Decision */}
        <div className="grid h-fit gap-4">
          <Panel title={tx({ vi: 'Quyết định điều phối', en: 'Allocation decision' })}>
            <ul className="grid gap-2">
              {checks.map((x) => (
                <li key={x.title} className={cx('flex gap-3 rounded-xl p-3', x.ok ? 'bg-step-soft' : x.required ? 'bg-sunken' : 'bg-warn-soft')}>
                  {x.toggle ? (
                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} aria-label={x.title} className="mt-0.5 size-5 shrink-0 accent-[#047857]" />
                  ) : x.ok ? (
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-step" aria-hidden />
                  ) : (
                    <AlertTriangle className={cx('mt-0.5 size-5 shrink-0', x.required ? 'text-danger' : 'text-warn')} aria-hidden />
                  )}
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-ink">{x.title}</p>
                    <p className="text-[13px] text-muted">{x.hint}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <Field label={tx({ vi: 'Hẹn gặp đối tác', en: 'Appointment' })} htmlFor="m-due">
                <TextInput id="m-due" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              </Field>
            </div>
            {(createStep.isError || confirm.isError) && (
              <div className="mt-3">
                <ErrorBanner title={s.common.errorTitle} message={errorMessage(createStep.error ?? confirm.error, s.common.offline)} />
              </div>
            )}
            <div className="mt-4 grid gap-2">
              <Button size="lg" block icon={<Send className="size-5" />} disabled={!ready || !picked || Boolean(openReferral)} loading={createStep.isPending || confirm.isPending} onClick={send}>
                {tx({ vi: 'Gửi ca cho đối tác', en: 'Send to partner' })}
              </Button>
              <Link to={`/journeys/${c.id}`} className="press inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-line-strong text-[15px] font-semibold text-brand-strong hover:bg-sunken">
                <Bookmark className="size-4" aria-hidden />
                {tx({ vi: 'Mở hành trình để trao đổi thêm', en: 'Open journey to discuss' })}
              </Link>
            </div>
            {openReferral && <p className="mt-2 text-[13px] text-muted">{tx({ vi: 'Ca này đã có chuyển gửi đang mở — chờ đối tác phản hồi.', en: 'This case already has an open referral.' })}</p>}
          </Panel>

          {picked && (
            <Panel tone="brand">
              <p className="flex items-center gap-2 font-bold text-ink">
                <Lightbulb className="size-5 text-warn" aria-hidden />
                {tx({ vi: 'Lý do gợi ý', en: 'Why this suggestion' })}
              </p>
              <p className="mt-1 text-[14px] font-semibold text-ink-2">{picked.resource.organisationName}</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[14px] text-ink-2">
                {(picked.reasonCodes?.length ? picked.reasonCodes.map(reasonLabel) : picked.reasons).map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              {(picked.warningCodes?.length ? picked.warningCodes.map(reasonLabel) : picked.warnings).length > 0 && (
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[13px] text-warn">
                  {(picked.warningCodes?.length ? picked.warningCodes.map(reasonLabel) : picked.warnings).map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-muted">{new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB')}</p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function CandidateCard({ cand, rank, selected, onPick, avgHours }: { cand: MatchCandidate; rank: number; selected: boolean; onPick: () => void; avgHours?: number }) {
  const { tx, s } = useApp();
  const r = cand.resource;
  const fit = { same_district: tx({ vi: 'Cùng quận', en: 'Same district' }), adjacent: tx({ vi: 'Quận lân cận', en: 'Adjacent' }), citywide: tx({ vi: 'Toàn thành phố', en: 'Citywide' }) }[cand.locationFit];
  return (
    <div className={cx('rounded-2xl border p-4', selected ? 'border-step bg-step-soft/60 ring-1 ring-step' : 'border-line')}>
      <div className="flex items-start gap-3">
        <span className={cx('tabular grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold', selected ? 'bg-brand text-white' : 'bg-sunken text-ink-2')}>{rank}</span>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-step">
          <NeedIcon need={r.category as never} className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-ink">{r.organisationName}</span>
            {cand.freshness === 'VERIFIED' ? (
              <Pill tone="step" icon={<BadgeCheck className="size-3.5" />}>{tx({ vi: 'Đã xác minh', en: 'Verified' })}</Pill>
            ) : (
              <Pill tone="warn">{tx({ vi: 'Cần gọi xác nhận', en: 'Call to confirm' })}</Pill>
            )}
          </p>
          <p className="text-[13px] text-muted">
            {r.serviceName} · {r.district}
          </p>
        </div>
        <div className="shrink-0 rounded-xl bg-surface px-3 py-1.5 text-center">
          <p className="text-[11px] text-muted">{tx({ vi: 'Điểm phù hợp', en: 'Fit score' })}</p>
          <p className="tabular text-[24px] font-extrabold leading-tight text-step">{Math.round(cand.score)}%</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
        <Metric icon={<HeartHandshake className="size-4 text-ai" />} label={tx({ vi: 'Phù hợp dịch vụ', en: 'Service fit' })} value={cand.reasonCodes?.some((x) => x.code === 'PROVIDES_NEED') ? tx({ vi: 'Đúng nhu cầu', en: 'Exact need' }) : tx({ vi: 'Liên quan', en: 'Related' })} sub={s.need[r.category as keyof typeof s.need] ?? r.category} />
        <Metric icon={<MapPin className="size-4 text-ai" />} label={tx({ vi: 'Phù hợp địa bàn', en: 'Area fit' })} value={fit} sub={r.district} />
        <Metric icon={<Users className="size-4 text-brand" />} label={tx({ vi: 'Suất còn lại', en: 'Places left' })} value={r.slotsAvailable != null ? String(r.slotsAvailable) : tx({ vi: 'Chưa rõ', en: 'Unknown' })} sub={tx({ vi: 'trong tuần này', en: 'this week' })} />
        <Metric icon={<Zap className="size-4 text-warn" />} label={tx({ vi: 'Phản hồi trung bình', en: 'Avg. reply' })} value={avgHours != null ? tx({ vi: `${avgHours} giờ`, en: `${avgHours}h` }) : tx({ vi: 'Chưa có dữ liệu', en: 'No data yet' })} sub={<Clock className="inline size-3" aria-hidden />} />
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant={selected ? 'primary' : 'secondary'} icon={<CheckCircle2 className="size-4" />} onClick={onPick}>
          {selected ? tx({ vi: 'Đã chọn', en: 'Selected' }) : tx({ vi: 'Chọn đối tác', en: 'Choose' })}
        </Button>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[11.5px] text-muted">
        {icon}
        {label}
      </p>
      <p className="truncate font-bold text-ink">{value}</p>
      {sub && <p className="truncate text-[11.5px] text-muted">{sub}</p>}
    </div>
  );
}
