/**
 * Small dialogs reused across Navigator, Partner and Coordinator screens.
 */
import { useState } from 'react';
import { useApp } from '../../app/AppContext';
import { Button, Dialog, ErrorBanner, Field, TextArea, TextInput } from '../../design/ui';
import { OutcomeButtons } from '../../design/widgets';
import { errorMessage, useLoopMutation } from '../../lib/hooks';
import { toLocalInput } from '../../lib/format';
import type { FollowUpResult } from '../../lib/types';

/** "Đánh dấu đã hỏi thăm": outcome in one tap, optional short note. HARDER auto-opens a coordinator review server-side. */
export function CheckInDialog({ open, onClose, followUpId, who }: { open: boolean; onClose: () => void; followUpId: string; who: string }) {
  const { tx, s } = useApp();
  const [note, setNote] = useState('');
  const [picked, setPicked] = useState<FollowUpResult | null>(null);
  const m = useLoopMutation<{ _id: string; result: FollowUpResult; note?: string }>((b) => `/follow-ups/${b._id}`);
  const submit = (result: FollowUpResult) => {
    setPicked(result);
    m.mutate(
      { _id: followUpId, result, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setNote('');
          setPicked(null);
          onClose();
        },
      },
    );
  };
  return (
    <Dialog open={open} onClose={onClose} title={tx({ vi: `Hỏi thăm ${who}`, en: `Check-in with ${who}` })} closeLabel={s.common.cancel}>
      <div className="space-y-4">
        <Field label={tx({ vi: 'Ghi chú ngắn (không ghi thông tin nhạy cảm)', en: 'Short note (no sensitive details)' })} htmlFor="ci-note" optionalLabel={tx({ vi: 'không bắt buộc', en: 'optional' })}>
          <TextArea id="ci-note" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={tx({ vi: 'VD: Đã đi thử việc 2 buổi, thấy hợp.', en: 'e.g. Went to 2 trial shifts, likes it.' })} />
        </Field>
        <p className="text-sm font-semibold text-ink">{tx({ vi: 'So với lần trước, tình hình thế nào?', en: 'Compared with last time, how are things?' })}</p>
        <OutcomeButtons onPick={submit} loading={m.isPending ? picked : null} />
        <p className="text-[13px] text-muted">
          {tx({
            vi: '“Khó hơn” sẽ tự gửi ca cho điều phối viên xem lại. “Chưa liên lạc được” sẽ tạo lịch hỏi thăm lại.',
            en: '“Harder” sends the case to a coordinator for review. “Unreachable” schedules another check-in.',
          })}
        </p>
        {m.isError && <ErrorBanner title={tx({ vi: 'Chưa lưu được', en: 'Not saved' })} message={errorMessage(m.error, s.common.offline)} />}
      </div>
    </Dialog>
  );
}

/** "Lên lịch lại": new time + a reason, so a moved check-in never silently disappears. */
export function RescheduleDialog({ open, onClose, followUpId, currentDueAt }: { open: boolean; onClose: () => void; followUpId: string; currentDueAt: string }) {
  const { tx, s } = useApp();
  const tomorrow = new Date(Math.max(Date.now(), new Date(currentDueAt).getTime()) + 86_400_000).toISOString();
  const [when, setWhen] = useState(toLocalInput(tomorrow));
  const [reason, setReason] = useState('');
  const m = useLoopMutation<{ _id: string; dueAt: string; reason: string }>((b) => `/follow-ups/${b._id}`, 'PUT');
  const valid = reason.trim().length >= 3 && Boolean(when);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={tx({ vi: 'Lên lịch hỏi thăm lại', en: 'Reschedule check-in' })}
      closeLabel={s.common.cancel}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {s.common.cancel}
          </Button>
          <Button disabled={!valid} loading={m.isPending} onClick={() => m.mutate({ _id: followUpId, dueAt: new Date(when).toISOString(), reason: reason.trim() }, { onSuccess: onClose })}>
            {tx({ vi: 'Lưu lịch mới', en: 'Save new time' })}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={tx({ vi: 'Thời gian mới (tối đa 30 ngày)', en: 'New time (within 30 days)' })} htmlFor="rs-when">
          <TextInput id="rs-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </Field>
        <Field label={tx({ vi: 'Lý do dời lịch', en: 'Why move it' })} htmlFor="rs-reason">
          <TextInput id="rs-reason" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} placeholder={tx({ vi: 'VD: Cô về quê 3 ngày', en: 'e.g. Away for 3 days' })} />
        </Field>
        {m.isError && <ErrorBanner title={tx({ vi: 'Chưa lưu được', en: 'Not saved' })} message={errorMessage(m.error, s.common.offline)} />}
      </div>
    </Dialog>
  );
}

/** "Báo cáo để được hỗ trợ": flags the case for a coordinator (not an emergency call). */
export function ReportConcernDialog({ open, onClose, caseId, who, suggested }: { open: boolean; onClose: () => void; caseId: string; who: string; suggested?: string }) {
  const { tx, s } = useApp();
  const [reason, setReason] = useState(suggested ?? '');
  const m = useLoopMutation<{ _id: string; reason: string }>((b) => `/cases/${b._id}/escalate`);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={tx({ vi: `Báo điều phối viên về ${who}`, en: `Report ${who} to a coordinator` })}
      closeLabel={s.common.cancel}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {s.common.cancel}
          </Button>
          <Button variant="danger" disabled={reason.trim().length < 5} loading={m.isPending} onClick={() => m.mutate({ _id: caseId, reason: reason.trim() }, { onSuccess: onClose })}>
            {tx({ vi: 'Gửi cho điều phối viên', en: 'Send to coordinator' })}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="rounded-xl bg-warn-soft px-3 py-2.5 text-[14px] text-ink-2">
          {tx({
            vi: 'Dùng khi thấy dấu hiệu bất thường nhưng chưa nguy hiểm tức thời. Nếu có nguy hiểm ngay, hãy dùng nút “Gọi hỗ trợ” ở góc trên.',
            en: 'Use this for worrying signs that are not an immediate danger. For immediate danger use “Get help” at the top.',
          })}
        </p>
        <Field label={tx({ vi: 'Bạn nhận thấy điều gì?', en: 'What did you notice?' })} htmlFor="rc-reason">
          <TextArea id="rc-reason" rows={4} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        {m.isError && <ErrorBanner title={tx({ vi: 'Chưa gửi được', en: 'Not sent' })} message={errorMessage(m.error, s.common.offline)} />}
      </div>
    </Dialog>
  );
}
