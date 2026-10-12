/**
 * An toàn — the coordinator's safety queue (no mockup; built with the same system).
 * Why: two kinds of alerts need a human decision. Risk-gate holds (e.g. a child selling at night)
 * change what the journey may do next, so they go through a risk review. Concerns reported by
 * navigators/partners are closed with a written note. Each alert shows who to call for THAT
 * situation instead of one hotline for everything.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ExternalLink, History, Phone, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Button, EmptyState, ErrorBanner, Field, SkeletonCard, TextArea, cx } from '../../design/ui';
import { Avatar, PageHero, Panel, PathwayPill, Pill, Segmented } from '../../design/dashboard';
import { flagLabel, humanizeReason } from '../../design/widgets';
import { errorMessage, useCases, useEscalations, useLoopMutation } from '../../lib/hooks';
import { fmtDateTime } from '../../lib/format';
import { displayName, pathwayOf, type Pathway } from '../../lib/pathway';
import { SUPPORT_CONTACTS, formatPhone, telHref } from '../../lib/supportContacts';
import type { CaseListItem, Escalation } from '../../lib/types';

/** Which public lines fit this alert — children get 111, everyone gets 113/115 for immediate danger. */
function contactsFor(pathway: Pathway, flags: string[]) {
  const ids = ['emergency-113', 'emergency-115'];
  if (pathway === 'child') ids.unshift('child-111');
  if (flags.some((f) => /violence|abuse|bao_luc|DOMESTIC/i.test(f))) ids.push('gbv-peace-house');
  if (flags.some((f) => /SCAM|FRAUD|FEE|lua_dao/i.test(f))) ids.push('scam-156');
  return ids.map((id) => SUPPORT_CONTACTS.find((c) => c.id === id)!).filter(Boolean);
}

export function SafetyPage() {
  const { tx, s } = useApp();
  const [status, setStatus] = useState<'OPEN' | 'ALL'>('OPEN');
  const escalations = useEscalations(status);
  const cases = useCases('ALL');
  const byId = new Map((cases.data ?? []).map((c) => [c.id, c]));
  const list = (escalations.data ?? []).filter((e) => status === 'ALL' || e.status === 'OPEN');

  return (
    <div>
      <PageHero
        eyebrow={tx({ vi: 'Điều phối viên', en: 'Coordinator' })}
        title={tx({ vi: 'An toàn & cảnh báo', en: 'Safety & alerts' })}
        description={tx({ vi: 'Những tình huống hệ thống không được tự quyết: ca bị giữ vì rủi ro và các lo ngại do người đồng hành, đối tác báo lên.', en: 'Situations the system must not decide alone: risk holds and concerns reported by navigators and partners.' })}
      />
      <div className="mb-4 flex items-center justify-between gap-3">
        <Segmented
          label={tx({ vi: 'Trạng thái', en: 'Status' })}
          value={status}
          onChange={setStatus}
          options={[
            { value: 'OPEN', label: <><ShieldAlert className="size-4" aria-hidden />{tx({ vi: 'Đang mở', en: 'Open' })}</>, count: status === 'OPEN' ? list.length : undefined },
            { value: 'ALL', label: <><History className="size-4" aria-hidden />{tx({ vi: 'Tất cả', en: 'All' })}</> },
          ]}
        />
      </div>
      {escalations.isError && <ErrorBanner title={s.common.errorTitle} message={errorMessage(escalations.error, s.common.offline)} onRetry={() => escalations.refetch()} retryLabel={s.common.retry} />}
      {escalations.isLoading ? (
        <SkeletonCard rows={4} />
      ) : list.length === 0 ? (
        <EmptyState icon={<ShieldCheck className="size-6" />} title={tx({ vi: 'Không có cảnh báo nào đang mở', en: 'No open alerts' })} />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {list.map((e) => (
            <li key={e.id}>
              <AlertCard e={e} c={byId.get(e.caseId)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AlertCard({ e, c }: { e: Escalation; c: CaseListItem | undefined }) {
  const { tx, lang } = useApp();
  const pathway = c ? pathwayOf(c) : 'adult';
  const name = c ? displayName(c) : e.alias ?? e.caseId;
  const isHold = Boolean(c && (c.riskDecision === 'HUMAN_REVIEW' || c.riskDecision === 'EMERGENCY_111'));
  const emergency = c?.riskDecision === 'EMERGENCY_111';
  const flags = (c?.risk?.flags ?? []).map((f) => f.code);
  const open = e.status === 'OPEN';

  return (
    <Panel tone={open ? (emergency ? 'danger' : 'warn') : undefined} className="h-full">
      <div className="flex items-start gap-3">
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-ink">{name}</span>
            <PathwayPill pathway={pathway} />
            {open ? (
              <Pill tone={emergency ? 'danger' : 'warn'} icon={<AlertTriangle className="size-3.5" />}>
                {isHold ? (emergency ? tx({ vi: 'Khẩn cấp', en: 'Emergency' }) : tx({ vi: 'Giữ để xem xét', en: 'Held for review' })) : tx({ vi: 'Lo ngại được báo', en: 'Reported concern' })}
              </Pill>
            ) : (
              <Pill tone="step" icon={<CheckCircle2 className="size-3.5" />}>{tx({ vi: 'Đã xử lý', en: 'Resolved' })}</Pill>
            )}
          </p>
          <p className="text-xs text-muted">{fmtDateTime(e.createdAt, lang)}</p>
        </div>
        <Link to={`/journeys/${e.caseId}`} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:underline">
          <ExternalLink className="size-4" aria-hidden />
          {tx({ vi: 'Hành trình', en: 'Journey' })}
        </Link>
      </div>

      <p className="mt-3 whitespace-pre-line rounded-xl bg-surface px-3 py-2.5 text-[14px] text-ink-2">{humanizeReason(e.reason, lang)}</p>
      {flags.length > 0 && !isHold && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {flags.map((f) => (
            <Pill key={f} tone="danger">{flagLabel(f, lang)}</Pill>
          ))}
        </div>
      )}

      {open && (
        <>
          <div className="mt-3">
            <p className="mb-1.5 text-[13px] font-bold text-ink">{tx({ vi: 'Nơi cần báo nếu có nguy hiểm', en: 'Who to call if in danger' })}</p>
            <div className="flex flex-wrap gap-1.5">
              {contactsFor(pathway, flags).map((ct) => (
                <a key={ct.id} href={telHref(ct.number)} className="press inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-danger-line bg-surface px-3 text-[13px] font-semibold text-danger hover:bg-danger-soft" title={tx(ct.when)}>
                  <Phone className="size-3.5" aria-hidden />
                  {formatPhone(ct.number)} · {tx(ct.name)}
                </a>
              ))}
            </div>
          </div>
          {isHold && c ? <RiskReviewForm caseId={c.id} emergency={emergency} pathway={pathway} /> : <ResolveForm id={e.id} />}
        </>
      )}
      {!open && e.resolutionNote && (
        <p className="mt-3 text-[13px] text-muted">
          <strong>{tx({ vi: 'Cách xử lý:', en: 'Resolution:' })}</strong> {e.resolutionNote}
        </p>
      )}
    </Panel>
  );
}

function RiskReviewForm({ caseId, emergency, pathway }: { caseId: string; emergency: boolean; pathway: Pathway }) {
  const { tx, s } = useApp();
  const [note, setNote] = useState('');
  const [logged, setLogged] = useState(false);
  const m = useLoopMutation<{ _id: string; approved: boolean; note: string; escalationLogged: boolean }>((b) => `/cases/${b._id}/risk-review`);
  const canApprove = note.trim().length >= 3 && (!emergency || logged);
  return (
    <div className="mt-4 grid gap-3 border-t border-line pt-3">
      <Field label={tx({ vi: 'Đánh giá của điều phối viên', en: 'Coordinator assessment' })} htmlFor={`rr-${caseId}`} hint={pathway === 'child' ? tx({ vi: 'Với trẻ em: hướng tới gia đình, trường học, công tác xã hội — việc làm luôn bị chặn.', en: 'For children: family, school, social work — jobs stay blocked.' }) : undefined}>
        <TextArea id={`rr-${caseId}`} rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={tx({ vi: 'VD: Đã gặp mẹ em, đồng ý hướng hỗ trợ học tập.', en: 'e.g. Met the mother, agreed on school support.' })} />
      </Field>
      {emergency && (
        <label className="flex items-start gap-2 text-[14px] text-ink-2">
          <input type="checkbox" className="mt-0.5 size-[18px] accent-[#B91C1C]" checked={logged} onChange={(e) => setLogged(e.target.checked)} />
          {tx({ vi: 'Đã báo cơ quan phụ trách (111 với trẻ em / 113 khi có bạo lực) và ghi nhận lại', en: 'Reported to the responsible line (111 for children / 113 for violence) and logged it' })}
        </label>
      )}
      {m.isError && <ErrorBanner title={s.common.errorTitle} message={errorMessage(m.error, s.common.offline)} />}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" disabled={note.trim().length < 3} loading={m.isPending && m.variables?.approved === false} onClick={() => m.mutate({ _id: caseId, approved: false, note: note.trim(), escalationLogged: logged })}>
          {tx({ vi: 'Tiếp tục giữ', en: 'Keep on hold' })}
        </Button>
        <Button variant="step" disabled={!canApprove} loading={m.isPending && m.variables?.approved === true} onClick={() => m.mutate({ _id: caseId, approved: true, note: note.trim(), escalationLogged: logged })}>
          {tx({ vi: 'Cho phép ghép ca', en: 'Allow matching' })}
        </Button>
      </div>
    </div>
  );
}

function ResolveForm({ id }: { id: string }) {
  const { tx, s } = useApp();
  const [note, setNote] = useState('');
  const m = useLoopMutation<{ _id: string; note: string }>((b) => `/escalations/${b._id}/resolve`);
  return (
    <div className={cx('mt-4 grid gap-3 border-t border-line pt-3')}>
      <Field label={tx({ vi: 'Bạn đã xử lý thế nào?', en: 'How was it handled?' })} htmlFor={`rs-${id}`}>
        <TextArea id={`rs-${id}`} rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={tx({ vi: 'VD: Đã gọi người đồng hành, hẹn đi cùng ra phường làm lại CCCD.', en: 'e.g. Called the navigator, will go with them to the ward office.' })} />
      </Field>
      {m.isError && <ErrorBanner title={s.common.errorTitle} message={errorMessage(m.error, s.common.offline)} />}
      <Button variant="step" disabled={note.trim().length < 5} loading={m.isPending} icon={<CheckCircle2 className="size-4" />} onClick={() => m.mutate({ _id: id, note: note.trim() })}>
        {tx({ vi: 'Đánh dấu đã xử lý', en: 'Mark resolved' })}
      </Button>
    </div>
  );
}
