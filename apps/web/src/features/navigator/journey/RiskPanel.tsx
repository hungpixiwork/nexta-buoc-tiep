import { useState } from 'react';
import { Phone, ShieldCheck, UserCheck } from 'lucide-react';
import { useApp } from '../../../app/AppContext';
import { errorText } from '../../../app/errors';
import { Button, Card, ErrorBanner, Field, TextArea } from '../../../design/ui';
import { RiskBanner, flagLabel } from '../../../design/widgets';
import { useLoopMutation } from '../../../lib/hooks';
import type { LoopCase } from '../../../lib/types';

const NAVIGATOR_FLAGS = ['CHILD_PRESENT', 'VIOLENCE_OR_ABUSE', 'MEDICAL_EMERGENCY', 'EXPLOITATION_OR_TRAFFICKING', 'NO_SAFE_SHELTER_TONIGHT', 'SCAM_PATTERN'] as const;

export function RiskPanel({ c }: { c: LoopCase }) {
  const { s, tx, lang, role } = useApp();
  const [flags, setFlags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [logged111, setLogged111] = useState(false);
  const run = useLoopMutation(`/cases/${c.id}/risk-gate`);
  const review = useLoopMutation(`/cases/${c.id}/risk-review`);
  const held = c.risk && (c.risk.decision === 'HUMAN_REVIEW' || c.risk.decision === 'EMERGENCY_111');

  if (held && c.risk) {
    return (
      <Card className="space-y-5 p-5 sm:p-6">
        <RiskBanner risk={c.risk} />
        {c.risk.call111 && (
          <a href="tel:111" className="flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-danger px-4 text-lg font-bold text-white hover:bg-danger-strong">
            <Phone className="size-5" aria-hidden />
            {tx({ vi: 'Gọi 111 ngay', en: 'Call 111 now' })}
          </a>
        )}
        {role === 'coordinator' ? (
          <div className="rounded-xl border border-line bg-sunken p-4">
            <p className="flex items-center gap-2 font-bold text-ink">
              <UserCheck className="size-5 text-brand" aria-hidden />
              {tx({ vi: 'Xem xét của điều phối viên', en: 'Coordinator review' })}
            </p>
            <p className="mt-1 text-sm text-muted">
              {tx({ vi: 'Ghi rõ bạn đã làm gì. Quyết định được lưu kèm tên bạn.', en: 'Write down what you did. The decision is saved with your name.' })}
            </p>
            <div className="mt-3 space-y-3">
              <Field label={tx({ vi: 'Ghi chú xem xét', en: 'Review note' })} htmlFor="rnote">
                <TextArea id="rnote" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} className="min-h-[88px]" />
              </Field>
              {c.risk.decision === 'EMERGENCY_111' && (
                <label className="flex items-start gap-3 text-[15px] text-ink">
                  <input type="checkbox" className="mt-1 size-5" checked={logged111} onChange={(e) => setLogged111(e.target.checked)} />
                  {tx({ vi: 'Đã gọi 111/115 và ghi nhận cuộc gọi', en: '111/115 has been called and logged' })}
                </label>
              )}
              {review.error && <ErrorBanner title={s.common.errorTitle} message={errorText(review.error, lang)} />}
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="secondary" disabled={note.trim().length < 3} loading={review.isPending} onClick={() => review.mutate({ approved: false, note })}>
                  {tx({ vi: 'Giữ tạm dừng', en: 'Keep on hold' })}
                </Button>
                <Button variant="step" icon={<ShieldCheck className="size-5" />} disabled={note.trim().length < 3} loading={review.isPending} onClick={() => review.mutate({ approved: true, note, escalationLogged: logged111 })}>
                  {tx({ vi: 'Cho phép tiếp tục an toàn', en: 'Allow to continue safely' })}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-line bg-sunken p-4 text-[15px] text-ink">
            {tx({ vi: 'Điều phối viên đã được báo. Hãy ở bên người dân, không hứa hẹn, và chờ hướng dẫn.', en: 'The coordinator has been alerted. Stay with the person, make no promises, and wait for guidance.' })}
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-xl font-bold text-ink">{tx({ vi: 'Kiểm tra an toàn', en: 'Safety check' })}</h2>
      <p className="mt-1 text-[15px] text-muted">
        {tx({
          vi: 'Luật cố định chạy trước mọi gợi ý của máy. Hậu quả càng lớn, máy càng ít quyền. Đánh dấu nếu bạn thấy bất kỳ điều nào dưới đây.',
          en: 'Fixed rules run before any machine suggestion. The greater the consequence, the less authority the machine has. Tick anything you noticed.',
        })}
      </p>
      <fieldset className="mt-4 grid gap-2 sm:grid-cols-2">
        <legend className="sr-only">{tx({ vi: 'Dấu hiệu Navigator quan sát', en: 'Signals observed by the Navigator' })}</legend>
        {NAVIGATOR_FLAGS.map((f) => (
          <label key={f} className="flex min-h-[48px] items-center gap-3 rounded-xl border border-line bg-surface px-3 hover:bg-sunken">
            <input type="checkbox" className="size-5" checked={flags.includes(f)} onChange={(e) => setFlags((x) => (e.target.checked ? [...x, f] : x.filter((y) => y !== f)))} />
            <span className="text-[15px] font-medium text-ink">{flagLabel(f, lang)}</span>
          </label>
        ))}
      </fieldset>
      {run.error && <div className="mt-4"><ErrorBanner title={s.common.errorTitle} message={errorText(run.error, lang)} /></div>}
      <div className="mt-6 flex justify-end">
        <Button size="lg" icon={<ShieldCheck className="size-5" />} loading={run.isPending} onClick={() => run.mutate({ navigatorFlags: flags })}>
          {tx({ vi: 'Chạy kiểm tra an toàn', en: 'Run safety check' })}
        </Button>
      </div>
    </Card>
  );
}
