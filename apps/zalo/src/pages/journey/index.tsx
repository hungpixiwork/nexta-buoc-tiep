/**
 * Hành trình (chi tiết). Người dùng: người đồng hành. Việc chính: làm bước tiếp theo của hành trình.
 * Tôi đang ở đâu (tên + trạng thái) → tiến triển (StepProgress "đã xong x/6") → bước tiếp theo
 * (NEXTA gợi ý + khối của bước hiện tại) → hồ sơ tối thiểu (thu gọn).
 */
import { useParams } from 'react-router-dom';
import { fmtDateTime } from '@web/lib/format';
import { displayName, pathwayOf } from '@web/lib/pathway';
import type { Journey } from '@web/lib/types';
import { useJourney } from '../../lib/hooks';
import { useLang } from '../../lib/i18n';
import { STAGE, errorText, humanizeReason, needLabel } from '../../lib/labels';
import { JOURNEY_STEPS, nextStepLabel, stepNumber } from '../../lib/nextStep';
import { SupportCall } from '../../components/SupportCall';
import { Alert, Badge, Loading, PageBody, PageHeader, StepProgress } from '../../components/ui';
import { ConsentPanel, UnderstandPanel } from './understand';
import { RiskPanel } from './risk';
import { MatchPanel } from './match';
import { ConnectedPanel } from './connected';
import { situationOf } from './situation';

export function JourneyPage() {
  const { id = '' } = useParams();
  const { tx, lang } = useLang();
  const journey = useJourney(id);

  if (journey.isLoading)
    return (
      <>
        <PageHeader back title={tx({ vi: 'Hành trình', en: 'Journey' })} />
        <Loading />
      </>
    );
  if (journey.error || !journey.data)
    return (
      <>
        <PageHeader back title={tx({ vi: 'Hành trình', en: 'Journey' })} />
        <PageBody>
          <Alert tone="danger" title={tx({ vi: 'Chưa mở được hành trình', en: "Couldn't open the journey" })} onRetry={() => journey.refetch()}>
            {errorText(journey.error, lang)}
          </Alert>
        </PageBody>
      </>
    );

  const j = journey.data;
  const c = j.case;
  const child = pathwayOf(c) === 'child' || c.alias.startsWith('CHILD-');
  const openEsc = j.escalations.filter((e) => e.status === 'OPEN');
  const next = nextStepLabel(c);
  const situation = situationOf(c);

  return (
    <>
      <PageHeader back title={displayName(c)} subtitle={`${tx({ vi: 'Bắt đầu', en: 'Started' })} ${fmtDateTime(c.createdAt, lang)}`} />
      <PageBody>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={c.status === 'CLOSED' ? 'success' : 'primary'}>{tx(STAGE[c.stage])}</Badge>
          {c.need && <Badge>{needLabel(c.need, lang)}</Badge>}
          {c.urgency === 'urgent' && <Badge tone="accent">{tx({ vi: 'Cần trong 24 giờ', en: 'Within 24 hours' })}</Badge>}
          {child && <Badge tone="primary">{tx({ vi: 'Trẻ em · bảo vệ trước', en: 'Child · protection first' })}</Badge>}
        </div>

        <StepProgress steps={JOURNEY_STEPS} current={stepNumber(c.stage)} done={c.status === 'CLOSED'} nextLabel={next ? tx(next) : undefined} />

        {openEsc.length > 0 && (
          <Alert tone={openEsc.some((e) => e.kind === 'HOTLINE_111') ? 'danger' : 'info'} title={tx({ vi: 'Điều phối viên đang xem xét', en: 'A coordinator is reviewing' })}>
            {openEsc.map((e) => (
              <p key={e.id}>{humanizeReason(e.reason, lang)}</p>
            ))}
          </Alert>
        )}

        <StagePanel j={j} />

        {c.status === 'OPEN' && <SupportCall full situation={situation} />}

        <Facts j={j} />
      </PageBody>
    </>
  );
}

function StagePanel({ j }: { j: Journey }) {
  switch (j.case.stage) {
    case 'CONSENT':
      return <ConsentPanel c={j.case} />;
    case 'UNDERSTAND':
      return <UnderstandPanel c={j.case} />;
    case 'RISK':
      return <RiskPanel c={j.case} />;
    case 'MATCH':
    case 'NEXT_STEP':
      return <MatchPanel journey={j} />;
    default:
      return <ConnectedPanel journey={j} />;
  }
}

const FIELD: Record<string, { vi: string; en: string }> = {
  observation: { vi: 'Quan sát ban đầu', en: 'First observation' },
  consent: { vi: 'Sự đồng ý', en: 'Consent' },
  priority_statement: { vi: 'Ưu tiên của họ', en: 'Their priority' },
  need: { vi: 'Nhu cầu', en: 'Need' },
  location: { vi: 'Khu vực', en: 'Area' },
  age: { vi: 'Tuổi', en: 'Age' },
  risk_review: { vi: 'Kiểm tra an toàn', en: 'Safety review' },
  safe_next_step: { vi: 'Bước tiếp đã chốt', en: 'Step confirmed' },
  follow_up: { vi: 'Hỏi thăm', en: 'Check-in' },
  closed: { vi: 'Khép lại', en: 'Closed' },
};

/** Hồ sơ tối thiểu — mỗi dòng ghi ai ghi lại (thu gọn mặc định để màn hình ngắn). */
function Facts({ j }: { j: Journey }) {
  const { tx, lang } = useLang();
  const text = (field: string, v: any): string => {
    if (typeof v === 'string') return field === 'need' ? needLabel(v, lang) : v;
    if (Array.isArray(v)) return v.join(', ') || '—';
    if (v && typeof v === 'object') {
      if (field === 'observation') return v.text || (v.keywords ?? []).join(', ');
      if (field === 'location') return [v.ward, v.district].filter(Boolean).join(', ');
      if (field === 'safe_next_step') return v.action;
      if (field === 'follow_up') return `${v.result}${v.note ? ` — ${v.note}` : ''}`;
      if (field === 'risk_review') return `${v.decision} — ${v.note}`;
      if (field === 'consent') return v.allowSharingWithPartner ? '✓' : tx({ vi: '✓ (không chia sẻ)', en: '✓ (no sharing)' });
      if (field === 'closed') return v.reason;
    }
    return String(v ?? '—');
  };
  if (j.facts.length === 0) return null;
  return (
    <details className="group rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-soft">
      <summary className="flex min-h-[28px] cursor-pointer list-none items-center justify-between text-card font-semibold text-fg">
        {tx({ vi: 'Hồ sơ tối thiểu', en: 'Minimum record' })}
        <span className="text-small font-normal text-fg-2">{tx({ vi: `${j.facts.length} dòng`, en: `${j.facts.length} lines` })}</span>
      </summary>
      <ol className="mt-3 space-y-3">
        {j.facts.map((f) => (
          <li key={f.id} className="border-l-2 border-primary/40 pl-3">
            <p className="text-caption text-fg-2">{FIELD[f.field]?.[lang] ?? f.field} · {f.recordedByName ?? '—'}</p>
            <p className="break-words text-body text-fg">{text(f.field, f.value)}</p>
          </li>
        ))}
      </ol>
    </details>
  );
}
