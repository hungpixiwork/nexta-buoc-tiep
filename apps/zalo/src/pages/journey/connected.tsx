import { useState } from 'react';
import { CalendarCheck, CheckCircle2, Flag, Phone } from 'lucide-react';
import { fmtDateTime, fmtRelative, isOverdue } from '@web/lib/format';
import type { Journey } from '@web/lib/types';
import { useLoopMutation } from '../../lib/hooks';
import { useLang } from '../../lib/i18n';
import { OUTCOME, REFERRAL_STAGE, errorText } from '../../lib/labels';
import { callNumber } from '../../lib/platform';
import { Badge, Button, Card, Alert, Field, TextArea } from '../../components/ui';
import { RecordCheckIn } from '../../components/RecordCheckIn';

/** Sau khi chốt bước tiếp: theo dõi chuyển gửi → hỏi thăm → khép lại (hoặc báo điều phối viên). */
export function ConnectedPanel({ journey }: { journey: Journey }) {
  const { tx, lang } = useLang();
  const c = journey.case;
  const step = journey.nextSteps.find((n) => n.status !== 'CANCELLED' && n.status !== 'PROPOSED');
  const referral = journey.referrals[0];
  const pending = journey.followUps.find((f) => !f.result);
  const done = journey.followUps.filter((f) => f.result);
  const closed = c.status === 'CLOSED';
  const [escalating, setEscalating] = useState(false);
  const [reason, setReason] = useState('');
  const act = useLoopMutation<{ action: string; reason?: string; note?: string }>(`/referrals/${referral?.id}/actions`, { important: true });
  const closeCase = useLoopMutation(`/cases/${c.id}/close`, { important: true });

  return (
    <div className="space-y-3">
      {closed && (
        <Card className="border-success bg-success-soft">
          <p className="text-card font-semibold text-success-ink">{tx({ vi: 'Hành trình đã khép lại — trọn vòng', en: 'Journey closed — full loop' })}</p>
          <p className="text-body text-fg">{tx({ vi: 'Bước tiếp đã diễn ra và đã hỏi thăm kết quả.', en: 'The step happened and the outcome was checked.' })}</p>
        </Card>
      )}

      {step && (
        <Card className="space-y-1">
          <p className="text-small font-semibold text-fg-2">{tx({ vi: 'Bước tiếp đã chốt', en: 'Agreed next step' })}</p>
          <p className="font-semibold text-fg">{step.action}</p>
          <p className="text-body text-fg">{step.organisationName} — {step.place}</p>
          <p className="text-body text-fg">{fmtDateTime(step.dueAt, lang)} · {step.ownerName}</p>
          {step.phone && (
            <Button className="mt-2" size="sm" variant="secondary" icon={<Phone className="size-4" />} onClick={() => callNumber(step.phone!)}>
              {step.phone}
            </Button>
          )}
        </Card>
      )}

      {referral && (
        <Card className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-fg">{tx({ vi: 'Chuyển gửi', en: 'Referral' })} <span className="text-fg-2">{referral.code}</span></p>
            <Badge tone={referral.stage === 'DECLINED' ? 'accent' : referral.stage === 'CLOSED' ? 'success' : 'primary'}>{tx(REFERRAL_STAGE[referral.stage])}</Badge>
          </div>
          {!closed && (
            <p className="text-body text-fg-2">
              {referral.stage === 'CREATED' && tx({ vi: 'Đang chờ đơn vị hỗ trợ mở và nhận.', en: 'Waiting for the service to open it.' })}
              {referral.stage === 'RECEIVED' && tx({ vi: 'Đơn vị hỗ trợ đã xem, đang cân nhắc.', en: 'The service has seen it and is deciding.' })}
              {referral.stage === 'ACCEPTED' && tx({ vi: 'Đơn vị hỗ trợ đã nhận. Chờ buổi hỗ trợ diễn ra.', en: 'Accepted. Waiting for the support to happen.' })}
            </p>
          )}
          {!closed && referral.availableActions.includes('close') && (
            <Button full variant="primary" icon={<CheckCircle2 className="size-5" />} loading={act.isPending} onClick={() => act.mutate({ action: 'close', note: 'Journey closed after follow-up' })}>
              {tx({ vi: 'Khép lại hành trình', en: 'Close the journey' })}
            </Button>
          )}
          {!closed && referral.availableActions.includes('escalate') && !escalating && (
            <Button full variant="secondary" icon={<Flag className="size-4" />} onClick={() => setEscalating(true)}>
              {tx({ vi: 'Báo điều phối viên', en: 'Alert the coordinator' })}
            </Button>
          )}
          {escalating && (
            <div className="space-y-2 rounded-[var(--radius-control)] border border-line bg-surface-soft p-3">
              <Field label={tx({ vi: 'Vì sao cần báo?', en: 'Why alert?' })}>
                <TextArea rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => setEscalating(false)}>{tx({ vi: 'Hủy', en: 'Cancel' })}</Button>
                <Button disabled={reason.trim().length < 3} loading={act.isPending} onClick={async () => {
                  await act.mutateAsync({ action: 'escalate', reason: reason.trim() });
                  setEscalating(false);
                }}>
                  {tx({ vi: 'Gửi báo', en: 'Send alert' })}
                </Button>
              </div>
            </div>
          )}
          {act.error && <Alert tone="danger">{errorText(act.error, lang)}</Alert>}
        </Card>
      )}

      {!referral && step && !closed && (
        <Card className="space-y-2">
          <p className="text-body text-fg-2">{tx({ vi: 'Nơi này là kênh tự phục vụ (không nhận chuyển gửi có theo dõi). Vẫn có lịch hỏi thăm.', en: 'This place is self-service (no tracked referral). A check-in is still scheduled.' })}</p>
          {closeCase.error && <Alert tone="danger">{errorText(closeCase.error, lang)}</Alert>}
          <Button full variant="secondary" loading={closeCase.isPending} onClick={() => closeCase.mutate({ reason: 'Self-service step completed' })}>
            {tx({ vi: 'Khép lại hành trình', en: 'Close the journey' })}
          </Button>
        </Card>
      )}

      <Card className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-medium text-fg">
          <CalendarCheck className="size-5 text-primary-ink" aria-hidden />
          {tx({ vi: 'Hỏi thăm', en: 'Check-in' })}
        </h2>
        {pending && !closed ? (
          <>
            <p className="text-body text-fg-2">
              {fmtDateTime(pending.dueAt, lang)}{' '}
              <span className={isOverdue(pending.dueAt) ? 'font-medium text-accent-ink' : ''}>({fmtRelative(pending.dueAt, lang)})</span>
            </p>
            <RecordCheckIn followUpId={pending.id} need={c.need} person={c} />
          </>
        ) : (
          !closed && <p className="text-body text-fg-2">{tx({ vi: 'Chưa có lịch hỏi thăm.', en: 'No check-in scheduled.' })}</p>
        )}
        {done.length > 0 && (
          <ul className="space-y-1.5 border-t border-line pt-3">
            {done.map((f) => (
              <li key={f.id} className="text-small">
                <Badge tone={f.result === 'BETTER' ? 'success' : 'neutral'}>{OUTCOME[f.result!][lang]}</Badge>{' '}
                <span className="text-fg-2">{fmtDateTime(f.completedAt, lang)} · {f.completedByName}</span>
                {f.note && <span className="block text-fg">{f.note}</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
