import { useState } from 'react';
import { ShieldAlert, ShieldCheck, Siren } from 'lucide-react';
import type { LoopCase, RiskGateResult } from '@web/lib/types';
import { useLoopMutation } from '../../lib/hooks';
import { useLang } from '../../lib/i18n';
import { errorText, flagLabel } from '../../lib/labels';
import { useSession } from '../../lib/session';
import { Button, Card, CheckRow, Alert, Field, TextArea, cx } from '../../components/ui';
import { SupportCall } from '../../components/SupportCall';
import { situationOf } from './situation';

const NAVIGATOR_FLAGS = ['CHILD_PRESENT', 'VIOLENCE_OR_ABUSE', 'MEDICAL_EMERGENCY', 'EXPLOITATION_OR_TRAFFICKING', 'NO_SAFE_SHELTER_TONIGHT', 'SCAM_PATTERN'] as const;

/** Kiểm tra an toàn: luật cố định chạy trước mọi gợi ý máy; con người quyết định khi bị giữ lại. */
export function RiskPanel({ c }: { c: LoopCase }) {
  const { tx, lang } = useLang();
  const { role } = useSession();
  const [flags, setFlags] = useState<string[]>(c.alias.startsWith('CHILD-') ? ['CHILD_PRESENT'] : []);
  const [note, setNote] = useState('');
  const [logged111, setLogged111] = useState(false);
  const run = useLoopMutation(`/cases/${c.id}/risk-gate`, { important: true });
  const review = useLoopMutation(`/cases/${c.id}/risk-review`, { important: true });
  const held = c.risk && (c.risk.decision === 'HUMAN_REVIEW' || c.risk.decision === 'EMERGENCY_111');

  if (held && c.risk) {
    return (
      <div className="space-y-3">
        <RiskBanner risk={c.risk} />
        <SupportCall full size="lg" situation={situationOf(c)} />
        {role === 'coordinator' ? (
          <Card className="space-y-3">
            <p className="font-semibold text-fg">{tx({ vi: 'Điều phối viên xem xét', en: 'Coordinator review' })}</p>
            <p className="text-small text-fg-2">{tx({ vi: 'Ghi rõ bạn đã làm gì. Quyết định được lưu kèm tên bạn.', en: 'Write what you did. The decision is saved with your name.' })}</p>
            <Field label={tx({ vi: 'Ghi chú', en: 'Note' })}>
              <TextArea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            {c.risk.decision === 'EMERGENCY_111' && (
              <CheckRow checked={logged111} onChange={setLogged111} label={tx({ vi: 'Đã gọi 111/115 và ghi lại cuộc gọi', en: '111/115 has been called and logged' })} />
            )}
            {review.error && <Alert tone="danger">{errorText(review.error, lang)}</Alert>}
            <Button full size="lg" variant="primary" icon={<ShieldCheck className="size-5" />} disabled={note.trim().length < 3} loading={review.isPending} onClick={() => review.mutate({ approved: true, note, escalationLogged: logged111 })}>
              {tx({ vi: 'Cho phép tiếp tục an toàn', en: 'Allow to continue safely' })}
            </Button>
            <Button full variant="secondary" disabled={note.trim().length < 3} loading={review.isPending} onClick={() => review.mutate({ approved: false, note })}>
              {tx({ vi: 'Giữ tạm dừng', en: 'Keep on hold' })}
            </Button>
          </Card>
        ) : (
          <Card>
            <p className="text-body text-fg">{tx({ vi: 'Điều phối viên đã được báo. Hãy ở bên người này, không hứa hẹn, và chờ hướng dẫn.', en: 'The coordinator has been alerted. Stay with the person, make no promises, and wait for guidance.' })}</p>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className="space-y-3">
      {c.risk?.decision === 'ASK_MORE' && <RiskBanner risk={c.risk} />}
      <h2 className="text-lg font-medium text-fg">{tx({ vi: 'Kiểm tra an toàn', en: 'Safety check' })}</h2>
      <p className="text-body text-fg-2">{tx({ vi: 'Đánh dấu nếu bạn thấy bất kỳ điều nào dưới đây. Luật an toàn chạy trước mọi gợi ý của máy.', en: 'Tick anything you noticed. Safety rules run before any machine suggestion.' })}</p>
      <div className="space-y-2">
        {NAVIGATOR_FLAGS.map((f) => (
          <CheckRow key={f} checked={flags.includes(f)} onChange={(v) => setFlags((x) => (v ? [...x, f] : x.filter((y) => y !== f)))} label={flagLabel(f, lang)} />
        ))}
      </div>
      {run.error && <Alert tone="danger">{errorText(run.error, lang)}</Alert>}
      <Button full size="lg" icon={<ShieldCheck className="size-5" />} loading={run.isPending} onClick={() => run.mutate({ navigatorFlags: flags })}>
        {tx({ vi: 'Chạy kiểm tra an toàn', en: 'Run safety check' })}
      </Button>
    </Card>
  );
}

export function RiskBanner({ risk }: { risk: RiskGateResult }) {
  const { tx, lang } = useLang();
  const conf = {
    PROCEED: { cls: 'border-success bg-success-soft text-success-ink', icon: <ShieldCheck className="size-6" aria-hidden />, title: tx({ vi: 'An toàn để tiếp tục', en: 'Safe to continue' }) },
    ASK_MORE: { cls: 'border-accent bg-accent-soft text-accent-ink', icon: <ShieldAlert className="size-6" aria-hidden />, title: tx({ vi: 'Cần hỏi thêm trước khi tìm nơi hỗ trợ', en: 'Ask a little more before finding support' }) },
    HUMAN_REVIEW: { cls: 'border-primary/40 bg-surface-soft text-primary-ink', icon: <ShieldAlert className="size-6" aria-hidden />, title: tx({ vi: 'Tạm dừng — chờ điều phối viên xem xét', en: 'On hold — waiting for coordinator review' }) },
    EMERGENCY_111: { cls: 'border-danger bg-danger text-white', icon: <Siren className="size-6" aria-hidden />, title: tx({ vi: 'Khẩn cấp — gọi 111 (trẻ em) hoặc 115 (cấp cứu) ngay', en: 'Emergency — call 111 (child) or 115 (ambulance) now' }) },
  }[risk.decision];
  const missing: Record<string, { vi: string; en: string }> = {
    consent: { vi: 'Chưa có sự đồng ý', en: 'No consent yet' },
    need: { vi: 'Chưa rõ nhu cầu chính', en: 'Main need unclear' },
    location: { vi: 'Chưa rõ khu vực', en: 'Area unclear' },
    age_if_child_suspected: { vi: 'Cần xác nhận tuổi', en: 'Confirm age' },
  };
  return (
    <div role={risk.decision === 'PROCEED' ? 'status' : 'alert'} className={cx('animate-enter rounded-[var(--radius-card)] border p-4', conf.cls)}>
      <p className="flex items-start gap-2 font-semibold">{conf.icon}{conf.title}</p>
      {(risk.flags.length > 0 || risk.missingContext.length > 0) && (
        <ul className="mt-2 space-y-1">
          {risk.flags.map((f, i) => (
            <li key={i} className="rounded-lg bg-surface px-3 py-1.5 text-small text-fg">
              <span className="font-semibold">{flagLabel(f.code, lang)}</span> <span className="text-fg-2">{f.evidence}</span>
              {f.source === 'AI_SUGGESTED' && <span className="ml-1 text-caption font-semibold text-primary-ink">· {tx({ vi: 'Gợi ý — chưa xác minh', en: 'Suggestion — not verified' })}</span>}
            </li>
          ))}
          {risk.missingContext.map((m) => (
            <li key={m} className="rounded-lg bg-surface px-3 py-1.5 text-small font-semibold text-fg">{missing[m]?.[lang] ?? m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
