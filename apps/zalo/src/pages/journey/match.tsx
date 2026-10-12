import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, MapPin, Phone, RefreshCw } from 'lucide-react';
import { fmtDateTime, toLocalInput } from '@web/lib/format';
import type { Journey, MatchCandidate } from '@web/lib/types';
import { useLoopMutation } from '../../lib/hooks';
import { useLang } from '../../lib/i18n';
import { errorText, reasonLabel } from '../../lib/labels';
import { callNumber } from '../../lib/platform';
import { Badge, Button, Card, CheckRow, EmptyState, Alert, Field, Loading, Select, TextInput, cx } from '../../components/ui';

function tomorrowAt8() {
  const d = new Date(Date.now() + 86_400_000);
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
}

/** Tìm nơi phù hợp → cùng thống nhất một bước tiếp → chốt và gửi chuyển gửi. */
export function MatchPanel({ journey }: { journey: Journey }) {
  const { tx, lang } = useLang();
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
  if (picked) return <ComposeStep journey={journey} cand={picked} onCancel={() => setPicked(null)} />;

  return (
    <div className="space-y-3">
      {declined && (
        <p role="status" className="flex items-start gap-2 rounded-[var(--radius-control)] border border-accent bg-accent-soft p-3 text-body text-accent-ink">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span>
            <strong>{declined.organisationName}</strong> {tx({ vi: 'đã từ chối', en: 'declined' })}
            {declined.declineReason ? `: “${declined.declineReason}”` : ''}. {tx({ vi: 'Hãy cùng chọn nơi khác.', en: "Let's choose another place." })}
          </span>
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium text-fg">{tx({ vi: 'Nơi hỗ trợ phù hợp', en: 'Matching places' })}</h2>
        <Button size="sm" variant="secondary" icon={<RefreshCw className="size-4" />} loading={runMatch.isPending} onClick={() => runMatch.mutate(undefined as never)}>
          {tx({ vi: 'Tìm lại', en: 'Search again' })}
        </Button>
      </div>
      <p className="text-small text-fg-2">{tx({ vi: 'Chỉ lấy từ danh bạ nơi hỗ trợ đã được người xác minh — máy không tự nghĩ ra.', en: 'Only from the people-verified directory — never invented by a machine.' })}</p>
      {runMatch.error && <Alert tone="danger" onRetry={() => runMatch.mutate(undefined as never)}>{errorText(runMatch.error, lang)}</Alert>}
      {!journey.match && runMatch.isPending && <Loading />}
      {journey.match &&
        (journey.match.candidates.length === 0 ? (
          <EmptyState title={tx({ vi: 'Chưa có nơi hỗ trợ phù hợp đã xác minh', en: 'No verified match yet' })}>
            {tx({ vi: 'Báo điều phối viên để xác minh thêm nơi hỗ trợ, hoặc mở rộng khu vực.', en: 'Ask the coordinator to verify more places, or widen the area.' })}
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {journey.match.candidates.map((cand, i) => (
              <Candidate key={cand.resource.id} cand={cand} top={i === 0} onPick={() => setPicked(cand)} />
            ))}
          </ul>
        ))}
    </div>
  );
}

function Candidate({ cand, top, onPick }: { cand: MatchCandidate; top: boolean; onPick: () => void }) {
  const { tx, lang } = useLang();
  const r = cand.resource;
  const reasons = cand.reasonCodes?.map((x) => reasonLabel(x, lang)) ?? cand.reasons;
  const warnings = cand.warningCodes?.map((x) => reasonLabel(x, lang)) ?? cand.warnings;
  return (
    <li className={cx('rounded-[var(--radius-card)] border bg-surface p-4', top ? 'border-primary shadow-soft' : 'border-line shadow-soft')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-fg">{r.organisationName}</p>
          <p className="text-small text-fg-2">{r.serviceName}</p>
        </div>
        {top && <Badge tone="primary">{tx({ vi: 'Phù hợp nhất', en: 'Best fit' })}</Badge>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge tone={cand.freshness === 'VERIFIED' ? 'success' : 'accent'}>{cand.freshness === 'VERIFIED' ? tx({ vi: 'Đã xác minh', en: 'Verified' }) : tx({ vi: 'Chưa xác minh lại', en: 'Needs re-check' })}</Badge>
        {r.capacityStatus === 'LIMITED' && <Badge tone="accent">{tx({ vi: 'Còn ít chỗ', en: 'Few places' })}</Badge>}
      </div>
      <ul className="mt-2 space-y-1 text-small">
        {reasons.map((x) => (
          <li key={x} className="flex gap-1.5 text-fg"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-ink" aria-hidden />{x}</li>
        ))}
        {warnings.map((x) => (
          <li key={x} className="flex gap-1.5 font-medium text-accent-ink"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />{x}</li>
        ))}
      </ul>
      {r.address && <p className="mt-2 flex gap-1 text-small text-fg-2"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />{r.address}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {r.phone ? (
          <Button variant="secondary" icon={<Phone className="size-4" />} onClick={() => callNumber(r.phone!)}>
            {tx({ vi: 'Gọi', en: 'Call' })}
          </Button>
        ) : (
          <span />
        )}
        <Button variant={top ? 'primary' : 'secondary'} onClick={onPick}>
          {tx({ vi: 'Chọn nơi này', en: 'Choose' })}
        </Button>
      </div>
    </li>
  );
}

function ComposeStep({ journey, cand, onCancel }: { journey: Journey; cand: MatchCandidate; onCancel: () => void }) {
  const { tx, lang } = useLang();
  const r = cand.resource;
  const c = journey.case;
  const service = r.serviceName.split(/[;(]/)[0].trim().toLowerCase();
  const [action, setAction] = useState(tx({ vi: `Đăng ký ${service}`, en: `Sign up for ${service}` }));
  const [ownerRole, setOwnerRole] = useState<'BENEFICIARY' | 'NAVIGATOR' | 'PARTNER'>('NAVIGATOR');
  const [ownerName, setOwnerName] = useState(c.navigatorName ?? '');
  const [place, setPlace] = useState(r.address ?? r.organisationName);
  const [due, setDue] = useState(toLocalInput(tomorrowAt8()));
  const propose = useLoopMutation(`/cases/${c.id}/next-steps`, { important: true });
  const valid = action.trim().length >= 5 && ownerName.trim().length >= 2 && place.trim().length >= 3 && Boolean(due);

  return (
    <Card className="space-y-3 border-primary/40">
      <h2 className="text-lg font-medium text-fg">{tx({ vi: 'Cùng thống nhất một bước tiếp', en: 'Agree one next step together' })}</h2>
      <p className="text-small text-fg-2">{r.organisationName} · {tx({ vi: 'Một việc, một người, một nơi, một lúc.', en: 'One action, one owner, one place, one time.' })}</p>
      <Field label={tx({ vi: 'Việc cụ thể', en: 'Concrete action' })}>
        <TextInput maxLength={300} value={action} onChange={(e) => setAction(e.target.value)} />
      </Field>
      <Field label={tx({ vi: 'Ai làm', en: 'Who does it' })}>
        <Select
          value={ownerRole}
          onChange={(e) => {
            const v = e.target.value as typeof ownerRole;
            setOwnerRole(v);
            setOwnerName(v === 'BENEFICIARY' ? c.preferredAddress ?? c.alias : v === 'NAVIGATOR' ? c.navigatorName ?? '' : r.organisationName);
          }}
        >
          <option value="NAVIGATOR">{tx({ vi: 'Người đồng hành đi cùng', en: 'Navigator goes along' })}</option>
          <option value="BENEFICIARY">{tx({ vi: 'Người được hỗ trợ tự đi', en: 'The person goes alone' })}</option>
          <option value="PARTNER">{tx({ vi: 'Đơn vị hỗ trợ liên hệ', en: 'The service reaches out' })}</option>
        </Select>
      </Field>
      <Field label={tx({ vi: 'Tên người phụ trách', en: 'Owner name' })}>
        <TextInput maxLength={80} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
      </Field>
      <Field label={tx({ vi: 'Ở đâu', en: 'Where' })}>
        <TextInput maxLength={200} value={place} onChange={(e) => setPlace(e.target.value)} />
      </Field>
      <Field label={tx({ vi: 'Khi nào', en: 'When' })}>
        <TextInput type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
      </Field>
      {propose.error && <Alert tone="danger">{errorText(propose.error, lang)}</Alert>}
      <Button
        full
        size="lg"
        variant="primary"
        disabled={!valid}
        loading={propose.isPending}
        onClick={() => propose.mutate({ resourceId: r.id, action: action.trim(), ownerName: ownerName.trim(), ownerRole, place: place.trim(), dueAt: new Date(due).toISOString() })}
      >
        {tx({ vi: 'Xem lại bước tiếp', en: 'Review next step' })}
      </Button>
      <Button full variant="ghost" onClick={onCancel}>{tx({ vi: 'Chọn nơi khác', en: 'Choose another place' })}</Button>
    </Card>
  );
}

function ConfirmStep({ journey }: { journey: Journey }) {
  const { tx, lang } = useLang();
  const step = journey.nextSteps.find((n) => n.status === 'PROPOSED')!;
  const [agreed, setAgreed] = useState(false);
  const [called, setCalled] = useState(false);
  const confirm = useLoopMutation(`/next-steps/${step.id}/confirm`, { important: true });
  const needsCall = step.verification !== 'VERIFIED';

  return (
    <Card className="space-y-3 border-primary/40">
      <h2 className="text-lg font-medium text-fg">{tx({ vi: 'Đọc lại cho họ nghe', en: 'Read it back to them' })}</h2>
      <dl className="space-y-1.5 text-body">
        <Row k={tx({ vi: 'Việc', en: 'Action' })} v={step.action} />
        <Row k={tx({ vi: 'Nơi', en: 'Place' })} v={`${step.organisationName ?? ''} — ${step.place}`} />
        <Row k={tx({ vi: 'Lúc', en: 'When' })} v={fmtDateTime(step.dueAt, lang)} />
        <Row k={tx({ vi: 'Ai làm', en: 'Owner' })} v={step.ownerName} />
      </dl>
      <CheckRow checked={agreed} onChange={setAgreed} label={tx({ vi: 'Người được hỗ trợ đồng ý với bước này', en: 'The person agrees to this step' })} />
      {needsCall && (
        <>
          <CheckRow checked={called} onChange={setCalled} label={tx({ vi: 'Tôi đã gọi xác nhận với nơi hỗ trợ', en: 'I called the place to confirm' })} description={tx({ vi: 'Nơi này chưa xác minh lại — cần gọi trước khi chốt.', en: 'Not re-verified — call before confirming.' })} />
          {step.phone && (
            <Button full variant="secondary" icon={<Phone className="size-4" />} onClick={() => callNumber(step.phone!)}>
              {tx({ vi: 'Gọi', en: 'Call' })} {step.phone}
            </Button>
          )}
        </>
      )}
      {confirm.error && <Alert tone="danger">{errorText(confirm.error, lang)}</Alert>}
      <Button full size="lg" variant="primary" disabled={!agreed || (needsCall && !called)} loading={confirm.isPending} onClick={() => confirm.mutate({ beneficiaryAgreed: true, contactConfirmed: called })}>
        {tx({ vi: 'Chốt và gửi chuyển gửi', en: 'Confirm and send referral' })}
      </Button>
    </Card>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-16 shrink-0 font-semibold text-fg-2">{k}</dt>
      <dd className="min-w-0 break-words text-fg">{v}</dd>
    </div>
  );
}
