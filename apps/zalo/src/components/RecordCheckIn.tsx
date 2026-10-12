import { useState } from 'react';
import { checkInQuestions } from '@web/lib/caseSignals';
import { pathwayOf } from '@web/lib/pathway';
import type { FollowUpResult, NeedCategory } from '@web/lib/types';
import { useLoopMutation } from '../lib/hooks';
import { useLang } from '../lib/i18n';
import { OUTCOME, errorText } from '../lib/labels';
import { Alert, Field, TextArea, cx } from './ui';

const RESULTS: FollowUpResult[] = ['BETTER', 'SAME', 'HARDER', 'UNREACHABLE'];
const TONE: Record<FollowUpResult, string> = {
  // Chỉ "Tốt hơn" có màu (mint); các kết quả khác trung tính — không đánh giá, không làm người dùng thấy có lỗi.
  BETTER: 'border-success bg-success text-fg',
  SAME: 'border-line bg-surface text-fg',
  HARDER: 'border-line bg-surface text-fg',
  UNREACHABLE: 'border-line bg-surface-soft text-fg',
};

/** Ghi kết quả một lần hỏi thăm: câu hỏi mở gợi ý → ghi chú → 1 chạm chọn kết quả. */
export function RecordCheckIn({
  followUpId,
  need,
  person,
  onDone,
}: {
  followUpId: string;
  need: NeedCategory | null | undefined;
  person: { isMinor?: boolean | null; age?: number | null; alias?: string };
  onDone?: () => void;
}) {
  const { tx, lang } = useLang();
  const [note, setNote] = useState('');
  const [picking, setPicking] = useState<FollowUpResult | null>(null);
  const record = useLoopMutation<{ result: FollowUpResult; note?: string }>(`/follow-ups/${followUpId}`, { important: true });
  const child = person.alias?.startsWith('CHILD-') ? { isMinor: true } : person;
  const questions = checkInQuestions(need, pathwayOf(child), 2);

  return (
    <div className="space-y-3">
      {questions.length > 0 && (
        <ul className="list-disc space-y-1 rounded-[var(--radius-control)] bg-surface-soft py-3 pl-8 pr-3 text-body text-fg">
          {questions.map((q) => <li key={q.vi}>{q[lang]}</li>)}
        </ul>
      )}
      <Field label={tx({ vi: 'Họ nói gì (không bắt buộc)', en: 'What they said (optional)' })}>
        <TextArea rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <p className="text-body font-semibold text-fg">{tx({ vi: 'So với trước, mọi thứ thế nào?', en: 'Compared with before, how are things?' })}</p>
      <div className="grid grid-cols-2 gap-2">
        {RESULTS.map((r) => (
          <button
            key={r}
            type="button"
            disabled={record.isPending}
            onClick={async () => {
              setPicking(r);
              try {
                await record.mutateAsync({ result: r, note: note.trim() || undefined });
                setNote('');
                onDone?.();
              } catch {
                /* lỗi hiện bên dưới */
              } finally {
                setPicking(null);
              }
            }}
            className={cx('min-h-[52px] rounded-[var(--radius-control)] border px-2 text-body font-semibold transition-colors duration-200 disabled:opacity-60', TONE[r], picking === r && 'ring-4 ring-primary/30')}
          >
            {picking === r ? '…' : OUTCOME[r][lang]}
          </button>
        ))}
      </div>
      {record.error && <Alert tone="danger">{errorText(record.error, lang)}</Alert>}
    </div>
  );
}
