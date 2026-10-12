import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, MapPin, Phone, RefreshCw, Search } from 'lucide-react';
import { useApp } from '../../../app/AppContext';
import { errorText } from '../../../app/errors';
import { Badge, Button, Card, EmptyState, ErrorBanner, Field, Select, TextInput, cx } from '../../../design/ui';
import { CapacityBadge, FreshnessBadge, MatchFunnel, SafeNextStepCard, useReasonLabel } from '../../../design/widgets';
import { toLocalInput } from '../../../lib/format';
import { useLoopMutation } from '../../../lib/hooks';
import type { Journey, MatchCandidate } from '../../../lib/types';

function tomorrowAt8() {
  const d = new Date(Date.now() + 86_400_000);
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
}

export function MatchStepPanel({ journey }: { journey: Journey }) {
  const { s, tx, lang } = useApp();
  const c = journey.case;
  const runMatch = useLoopMutation(`/cases/${c.id}/match`);
  const autoRan = useRef(false);
  const [picked, setPicked] = useState<MatchCandidate | null>(null);

  useEffect(() => {
    if (c.stage === 'MATCH' && !journey.match && !autoRan.current) {
      autoRan.current = true;
      runMatch.mutate(undefined as never);
    }
  }, [c.stage, journey.match, runMatch]);

  const proposed = journey.nextSteps.find((n) => n.status === 'PROPOSED');
  const declined = journey.referrals.find((r) => r.stage === 'DECLINED');

  if (proposed) return <ConfirmStep journey={journey} />;

  return (
    <div className="space-y-5">
      {declined && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-warn-line bg-warn-soft p-4 text-warn">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="text-[15px]">
            <strong>{declined.organisationName}</strong> {tx({ vi: 'đã từ chối', en: 'declined' })}
            {declined.declineReason ? `: “${declined.declineReason}”` : ''}. {tx({ vi: 'Không sao — hãy cùng chọn một bước tiếp khác.', en: "That's okay — let's choose another next step together." })}
          </p>
        </div>
      )}

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink">{tx({ vi: 'Nguồn lực phù hợp, đã được người xác minh', en: 'Matching resources, verified by people' })}</h2>
            <p className="mt-1 text-[15px] text-muted">
              {tx({ vi: 'Danh sách chỉ lấy từ danh bạ nguồn lực của NEXTA — không phải máy tự nghĩ ra.', en: "Candidates come only from NEXTA's resource directory — never invented by a machine." })}
            </p>
          </div>
          <Button variant="secondary" size="sm" icon={<RefreshCw className="size-4" />} loading={runMatch.isPending} onClick={() => runMatch.mutate(undefined as never)}>
            {journey.match ? tx({ vi: 'Chạy lại', en: 'Run again' }) : tx({ vi: 'Tìm', en: 'Search' })}
          </Button>
        </div>
        {runMatch.error && <div className="mt-4"><ErrorBanner title={s.common.errorTitle} message={errorText(runMatch.error, lang)} /></div>}
        {journey.match && (
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
                {tx({ vi: '6 bước lọc', en: '6 filters' })}
              </p>
              <MatchFunnel match={journey.match} />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
                {tx({ vi: `${journey.match.candidates.length} lựa chọn`, en: `${journey.match.candidates.length} options` })}
              </p>
              {journey.match.candidates.length === 0 ? (
                <EmptyState icon={<Search className="size-6" />} title={tx({ vi: 'Chưa có nguồn lực phù hợp đã xác minh', en: 'No verified match yet' })}>
                  {tx({ vi: 'Xem lý do ở từng bước lọc. Có thể xác minh thêm nguồn lực trong mục Nguồn lực, hoặc mở rộng khu vực.', en: 'See why at each filter. Verify more resources in Resources, or widen the area.' })}
                </EmptyState>
              ) : (
                <ul className="space-y-3">
                  {journey.match.candidates.map((cand, i) => (
                    <CandidateCard key={cand.resource.id} cand={cand} top={i === 0} onPick={() => setPicked(cand)} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        {!journey.match && runMatch.isPending && <p className="mt-4 text-muted">{s.common.loading}</p>}
      </Card>

      {picked && <ComposeStep journey={journey} cand={picked} onCancel={() => setPicked(null)} />}
    </div>
  );
}

function CandidateCard({ cand, top, onPick }: { cand: MatchCandidate; top: boolean; onPick: () => void }) {
  const { tx } = useApp();
  const reasonLabel = useReasonLabel();
  const r = cand.resource;
  const reasons = cand.reasonCodes?.map(reasonLabel) ?? cand.reasons;
  const warnings = cand.warningCodes?.map(reasonLabel) ?? cand.warnings;
  const fit = { same_district: tx({ vi: 'Cùng khu vực', en: 'Same area' }), adjacent: tx({ vi: 'Khu vực lân cận', en: 'Neighbouring area' }), citywide: tx({ vi: 'Toàn thành phố', en: 'Citywide' }) }[cand.locationFit];
  return (
    <li className={cx('rounded-2xl border bg-surface p-4', top ? 'border-2 border-brand' : 'border-line')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-ink">{r.organisationName}</p>
          <p className="text-sm text-muted">{r.serviceName}</p>
        </div>
        {top && <Badge tone="brand">{tx({ vi: 'Phù hợp nhất', en: 'Best fit' })}</Badge>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <FreshnessBadge freshness={cand.freshness} date={r.verifiedAt} />
        <CapacityBadge status={r.capacityStatus} slots={r.slotsAvailable} />
        <Badge>{fit}</Badge>
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {reasons.map((x) => (
          <li key={x} className="flex gap-1.5 text-ink-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-step" aria-hidden />{x}</li>
        ))}
        {warnings.map((x) => (
          <li key={x} className="flex gap-1.5 font-medium text-warn"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />{x}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        {r.address && <span className="inline-flex items-center gap-1"><MapPin className="size-4" aria-hidden />{r.address}</span>}
        {r.phone && <a href={`tel:${r.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 font-semibold text-brand-strong"><Phone className="size-4" aria-hidden />{r.phone}</a>}
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant={top ? 'step' : 'secondary'} onClick={onPick}>
          {tx({ vi: 'Chọn làm bước tiếp', en: 'Use as next step' })}
        </Button>
      </div>
    </li>
  );
}

function ComposeStep({ journey, cand, onCancel }: { journey: Journey; cand: MatchCandidate; onCancel: () => void }) {
  const { s, tx, lang } = useApp();
  const r = cand.resource;
  const c = journey.case;
  const service = r.serviceName.split(/[;(]/)[0].trim().toLowerCase();
  const [action, setAction] = useState(tx({ vi: `Đăng ký ${service}`, en: `Sign up for ${service}` }));
  const [ownerRole, setOwnerRole] = useState<'BENEFICIARY' | 'NAVIGATOR' | 'PARTNER'>('NAVIGATOR');
  const [ownerName, setOwnerName] = useState(c.navigatorName ?? 'Navigator');
  const [place, setPlace] = useState(r.address ?? r.organisationName);
  const [due, setDue] = useState(toLocalInput(tomorrowAt8()));
  const propose = useLoopMutation(`/cases/${c.id}/next-steps`);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div ref={ref}>
      <Card className="border-2 border-step-line p-5 sm:p-6">
        <h3 className="text-xl font-bold text-ink">{tx({ vi: 'Cùng thống nhất một bước tiếp', en: 'Agree one next step together' })}</h3>
        <p className="mt-1 text-[15px] text-muted">{tx({ vi: 'Một hành động. Một người chịu trách nhiệm. Một địa điểm. Một thời điểm.', en: 'One action. One owner. One place. One time.' })}</p>
        <div className="mt-5 grid gap-4">
          <Field label={tx({ vi: 'Hành động cụ thể', en: 'Concrete action' })} htmlFor="action">
            <TextInput id="action" value={action} onChange={(e) => setAction(e.target.value)} maxLength={300} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tx({ vi: 'Ai chịu trách nhiệm', en: 'Who owns it' })} htmlFor="ownerRole">
              <Select id="ownerRole" value={ownerRole} onChange={(e) => {
                const v = e.target.value as typeof ownerRole;
                setOwnerRole(v);
                setOwnerName(v === 'BENEFICIARY' ? c.preferredAddress ?? c.alias : v === 'NAVIGATOR' ? c.navigatorName ?? 'Navigator' : r.organisationName);
              }}>
                <option value="NAVIGATOR">{tx({ vi: 'Navigator đi cùng', en: 'Navigator accompanies' })}</option>
                <option value="BENEFICIARY">{tx({ vi: 'Người dân tự đi', en: 'The person goes' })}</option>
                <option value="PARTNER">{tx({ vi: 'Đối tác liên hệ', en: 'Partner reaches out' })}</option>
              </Select>
            </Field>
            <Field label={tx({ vi: 'Tên người phụ trách', en: 'Owner name' })} htmlFor="ownerName">
              <TextInput id="ownerName" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} maxLength={80} />
            </Field>
            <Field label={tx({ vi: 'Ở đâu', en: 'Where' })} htmlFor="place">
              <TextInput id="place" value={place} onChange={(e) => setPlace(e.target.value)} maxLength={200} />
            </Field>
            <Field label={tx({ vi: 'Khi nào', en: 'When' })} htmlFor="due">
              <TextInput id="due" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
          </div>
        </div>
        {propose.error && <div className="mt-4"><ErrorBanner title={s.common.errorTitle} message={errorText(propose.error, lang)} /></div>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel}>{s.common.cancel}</Button>
          <Button
            variant="step"
            size="lg"
            loading={propose.isPending}
            disabled={action.trim().length < 5 || ownerName.trim().length < 2 || place.trim().length < 3 || !due}
            onClick={() => propose.mutate({ resourceId: r.id, action: action.trim(), ownerName: ownerName.trim(), ownerRole, place: place.trim(), dueAt: new Date(due).toISOString() })}
          >
            {tx({ vi: 'Xem trước bước tiếp', en: 'Preview next step' })}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ConfirmStep({ journey }: { journey: Journey }) {
  const { s, tx, lang } = useApp();
  const step = journey.nextSteps.find((n) => n.status === 'PROPOSED')!;
  const [agreed, setAgreed] = useState(false);
  const [called, setCalled] = useState(false);
  const confirm = useLoopMutation(`/next-steps/${step.id}/confirm`);
  const needsCall = step.verification !== 'VERIFIED';

  return (
    <div className="space-y-4">
      <SafeNextStepCard
        step={step}
        footer={
          <div className="space-y-3">
            <label className="flex min-h-[48px] items-start gap-3 text-[15px] text-ink">
              <input type="checkbox" className="mt-1 size-5" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span><strong>{tx({ vi: 'Người dân đồng ý với bước này', en: 'The person agrees to this step' })}</strong> — {tx({ vi: 'đọc to hành động, nơi chốn và thời gian.', en: 'read back the action, place and time.' })}</span>
            </label>
            {needsCall && (
              <label className="flex min-h-[48px] items-start gap-3 rounded-xl border border-warn-line bg-warn-soft p-3 text-[15px] text-warn">
                <input type="checkbox" className="mt-1 size-5" checked={called} onChange={(e) => setCalled(e.target.checked)} />
                <span>
                  <strong>{tx({ vi: 'Tôi đã gọi xác nhận với đơn vị', en: 'I called the service to confirm' })}</strong> — {tx({ vi: 'nguồn lực này cần kiểm tra lại trước khi cam kết.', en: 'this resource needs re-checking before committing.' })}
                  {step.phone && <a className="ml-1 font-bold underline" href={`tel:${step.phone.replace(/\s/g, '')}`}>{step.phone}</a>}
                </span>
              </label>
            )}
            {confirm.error && <ErrorBanner title={s.common.errorTitle} message={errorText(confirm.error, lang)} />}
            <div className="flex justify-end">
              <Button variant="step" size="lg" disabled={!agreed || (needsCall && !called)} loading={confirm.isPending} onClick={() => confirm.mutate({ beneficiaryAgreed: true, contactConfirmed: called })}>
                {tx({ vi: 'Chốt bước tiếp & gửi chuyển gửi', en: 'Confirm step & send referral' })}
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
}
