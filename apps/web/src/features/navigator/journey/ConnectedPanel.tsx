import { useState } from 'react';
import { CalendarCheck, CheckCircle2, Flag, PartyPopper } from 'lucide-react';
import { useApp } from '../../../app/AppContext';
import { errorText } from '../../../app/errors';
import { Badge, Button, Card, Dialog, ErrorBanner, Field, TextArea } from '../../../design/ui';
import { OutcomeButtons, ReferralTracker, SafeNextStepCard } from '../../../design/widgets';
import { fmtDateTime, fmtRelative, isOverdue } from '../../../lib/format';
import { useLoopMutation } from '../../../lib/hooks';
import type { FollowUpResult, Journey } from '../../../lib/types';

export function ConnectedPanel({ journey }: { journey: Journey }) {
  const { s, tx, lang } = useApp();
  const step = journey.nextSteps.find((n) => n.status !== 'CANCELLED' && n.status !== 'PROPOSED');
  const referral = journey.referrals[0];
  const pending = journey.followUps.find((f) => !f.result);
  const done = journey.followUps.filter((f) => f.result);
  const [note, setNote] = useState('');
  const [picking, setPicking] = useState<FollowUpResult | null>(null);
  const [actionDialog, setActionDialog] = useState<'escalate' | null>(null);
  const [reason, setReason] = useState('');
  const record = useLoopMutation<{ _id: string; result: FollowUpResult; note?: string }>((b) => `/follow-ups/${b._id}`);
  const act = useLoopMutation<{ action: string; reason?: string; note?: string }>(`/referrals/${referral?.id}/actions`);
  const closeCase = useLoopMutation(`/cases/${journey.case.id}/close`);

  const closed = journey.case.status === 'CLOSED';

  return (
    <div className="space-y-5">
      {closed && (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-step-line bg-step-soft p-5 text-step">
          <PartyPopper className="size-6 shrink-0" aria-hidden />
          <div>
            <p className="text-lg font-bold">{tx({ vi: 'Hành trình đã khép lại — trọn vòng', en: 'Journey closed — full loop' })}</p>
            <p className="text-[15px]">{tx({ vi: 'Bước tiếp đã xảy ra và đã được hỏi thăm kết quả. Dữ liệu này tính vào Tỉ lệ Bước tiếp an toàn.', en: 'The step happened and the outcome was checked. This counts toward the Safe Next Step Rate.' })}</p>
          </div>
        </div>
      )}

      {step && <SafeNextStepCard step={step} />}

      {referral && (
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-ink">
              {tx({ vi: 'Chuyển gửi', en: 'Referral' })} <span className="tabular text-muted">{referral.code}</span>
            </h2>
            <Badge tone="brand">{referral.organisationName}</Badge>
          </div>
          <ReferralTracker stage={referral.stage} events={referral.events} />
          {!closed && (
            <p className="mt-4 text-sm text-muted">
              {referral.stage === 'CREATED' && tx({ vi: 'Đang chờ đối tác mở và nhận. Không chuyển gửi nào được biến mất trong im lặng.', en: 'Waiting for the partner to open it. No referral disappears silently.' })}
              {referral.stage === 'RECEIVED' && tx({ vi: 'Đối tác đã thấy chuyển gửi, đang cân nhắc.', en: 'The partner has seen it and is deciding.' })}
              {referral.stage === 'ACCEPTED' && tx({ vi: 'Đối tác đã nhận trách nhiệm. Chờ buổi hỗ trợ diễn ra.', en: 'The partner has taken responsibility. Waiting for the support to happen.' })}
            </p>
          )}
          {!closed && referral.availableActions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              {referral.availableActions.includes('close') && (
                <Button variant="step" icon={<CheckCircle2 className="size-5" />} loading={act.isPending} onClick={() => act.mutate({ action: 'close', note: 'Journey closed after follow-up' })}>
                  {s.action.close}
                </Button>
              )}
              {referral.availableActions.includes('escalate') && (
                <Button variant="secondary" icon={<Flag className="size-4" />} onClick={() => setActionDialog('escalate')}>
                  {s.action.escalate}
                </Button>
              )}
            </div>
          )}
          {act.error && <div className="mt-3"><ErrorBanner title={s.common.errorTitle} message={errorText(act.error, lang)} /></div>}
        </Card>
      )}

      {!referral && step && !closed && (
        <Card className="p-5">
          <p className="text-[15px] text-muted">{tx({ vi: 'Nguồn lực này là kênh tự phục vụ (không nhận chuyển gửi có theo dõi). NEXTA vẫn lên lịch hỏi thăm.', en: 'This resource is self-service (no tracked referral). NEXTA still schedules a check-in.' })}</p>
          <Button className="mt-3" variant="secondary" loading={closeCase.isPending} onClick={() => closeCase.mutate({ reason: 'Self-service step completed' })}>
            {s.action.close}
          </Button>
        </Card>
      )}

      <div id="follow-up">
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <CalendarCheck className="size-5 text-brand" aria-hidden />
            {s.loop.followUp}
          </h2>
          {pending && !closed ? (
            <>
              <p className="mt-1 text-[15px] text-muted">
                {tx({ vi: 'Hỏi thăm', en: 'Check in' })} {fmtDateTime(pending.dueAt, lang)}{' '}
                <span className={isOverdue(pending.dueAt) ? 'font-semibold text-danger' : ''}>({fmtRelative(pending.dueAt, lang)})</span>.{' '}
                {tx({ vi: 'Hỏi: "So với trước, mọi thứ thế nào?"', en: 'Ask: "Compared with before, how are things?"' })}
              </p>
              <div className="mt-4 space-y-3">
                <Field label={tx({ vi: 'Họ nói gì', en: 'What they said' })} htmlFor="funote" optionalLabel={s.common.optional}>
                  <TextArea id="funote" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} className="min-h-[72px]" />
                </Field>
                <OutcomeButtons
                  loading={picking}
                  onPick={async (r) => {
                    setPicking(r);
                    try {
                      await record.mutateAsync({ _id: pending.id, result: r, note: note.trim() || undefined });
                      setNote('');
                    } finally {
                      setPicking(null);
                    }
                  }}
                />
                {record.error && <ErrorBanner title={s.common.errorTitle} message={errorText(record.error, lang)} />}
              </div>
            </>
          ) : (
            !closed && <p className="mt-1 text-[15px] text-muted">{s.common.none}</p>
          )}
          {done.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-line pt-4">
              {done.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge tone={f.result === 'BETTER' ? 'step' : f.result === 'HARDER' ? 'danger' : 'neutral'}>{s.outcome[f.result!]}</Badge>
                  <span className="text-muted">{fmtDateTime(f.completedAt, lang)} · {f.completedByName}</span>
                  {f.note && <span className="text-ink-2">— {f.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Dialog
        open={actionDialog === 'escalate'}
        onClose={() => setActionDialog(null)}
        title={s.action.escalate}
        closeLabel={s.common.cancel}
        footer={
          <>
            <Button variant="secondary" onClick={() => setActionDialog(null)}>{s.common.cancel}</Button>
            <Button variant="danger" disabled={reason.trim().length < 3} loading={act.isPending} onClick={async () => {
              await act.mutateAsync({ action: 'escalate', reason: reason.trim() });
              setActionDialog(null);
            }}>
              {s.action.escalate}
            </Button>
          </>
        }
      >
        <Field label={tx({ vi: 'Lý do chuyển cấp', en: 'Why escalate' })} htmlFor="escreason">
          <TextArea id="escreason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
        </Field>
      </Dialog>
    </div>
  );
}
