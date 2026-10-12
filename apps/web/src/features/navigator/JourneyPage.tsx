import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldAlert } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { errorText } from '../../app/errors';
import { Badge, Card, ErrorBanner, Spinner } from '../../design/ui';
import { LoopRibbon, NeedBadge, ProvenanceChip } from '../../design/widgets';
import { fmtDate, fmtDateTime } from '../../lib/format';
import { useJourney } from '../../lib/hooks';
import type { Fact, Journey } from '../../lib/types';
import { stageTone } from './CaseRow';
import { ConsentPanel } from './journey/ConsentPanel';
import { UnderstandPanel } from './journey/UnderstandPanel';
import { RiskPanel } from './journey/RiskPanel';
import { MatchStepPanel } from './journey/MatchStepPanel';
import { ConnectedPanel } from './journey/ConnectedPanel';

export function JourneyPage() {
  const { id = '' } = useParams();
  const { s, tx, lang } = useApp();
  const journey = useJourney(id);
  const { hash } = useLocation();

  useEffect(() => {
    if (hash && journey.data) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash, journey.data]);

  if (journey.isLoading) return <Spinner label={s.common.loading} />;
  if (journey.error || !journey.data) return <ErrorBanner title={s.common.errorTitle} message={errorText(journey.error, lang)} onRetry={() => journey.refetch()} retryLabel={s.common.retry} />;

  const j = journey.data;
  const c = j.case;

  return (
    <>
      <Link to="/journeys" className="mb-3 inline-flex min-h-[40px] items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        {s.nav.journeys}
      </Link>
      <header className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-[28px]">{c.alias}</h1>
          <NeedBadge need={c.need} />
          <Badge tone={stageTone(c.stage)}>{s.stage[c.stage]}</Badge>
          {c.urgency === 'urgent' && <Badge tone="danger">{tx({ vi: 'Gấp', en: 'Urgent' })}</Badge>}
        </div>
        <p className="mt-1 text-sm text-muted">
          {tx({ vi: 'Bắt đầu', en: 'Started' })} {fmtDateTime(c.createdAt, lang)} · {c.navigatorName}
        </p>
        <div className="mt-4">
          <LoopRibbon stage={c.stage} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <StagePanel j={j} />
        </div>
        <JourneyAside j={j} />
      </div>
    </>
  );
}

function StagePanel({ j }: { j: Journey }) {
  const c = j.case;
  switch (c.stage) {
    case 'CONSENT':
      return <ConsentPanel c={c} />;
    case 'UNDERSTAND':
      return <UnderstandPanel c={c} />;
    case 'RISK':
      return <RiskPanel c={c} />;
    case 'MATCH':
    case 'NEXT_STEP':
      return <MatchStepPanel journey={j} />;
    default:
      return <ConnectedPanel journey={j} />;
  }
}

const FIELD_LABEL: Record<string, { vi: string; en: string }> = {
  observation: { vi: 'Quan sát ban đầu', en: 'First observation' },
  consent: { vi: 'Đồng ý', en: 'Consent' },
  priority_statement: { vi: 'Ưu tiên', en: 'Priority' },
  need: { vi: 'Nhu cầu', en: 'Need' },
  location: { vi: 'Khu vực', en: 'Area' },
  strengths: { vi: 'Điểm mạnh', en: 'Strengths' },
  constraints: { vi: 'Giới hạn', en: 'Constraints' },
  age: { vi: 'Tuổi', en: 'Age' },
  risk_review: { vi: 'Xem xét an toàn', en: 'Safety review' },
  safe_next_step: { vi: 'Bước tiếp đã chốt', en: 'Step confirmed' },
  follow_up: { vi: 'Theo dõi', en: 'Follow-up' },
  closed: { vi: 'Khép lại', en: 'Closed' },
};

function factText(f: Fact, needLabel: (n: string) => string): string {
  const v = f.value as any;
  if (typeof v === 'string') return f.field === 'need' ? needLabel(v) : v;
  if (Array.isArray(v)) return v.join(', ') || '—';
  if (v && typeof v === 'object') {
    if (f.field === 'observation') return v.text || (v.keywords ?? []).join(', ');
    if (f.field === 'location') return [v.ward, v.district].filter(Boolean).join(', ');
    if (f.field === 'constraints') return Object.entries(v).filter(([, on]) => on).map(([k]) => k).join(', ') || '—';
    if (f.field === 'safe_next_step') return v.action;
    if (f.field === 'follow_up') return `${v.result}${v.note ? ` — ${v.note}` : ''}`;
    if (f.field === 'risk_review') return `${v.decision} — ${v.note}`;
    if (f.field === 'consent') return v.allowSharingWithPartner ? '✓' : '✓ (no sharing)';
    if (f.field === 'closed') return v.reason;
  }
  return String(v);
}

function JourneyAside({ j }: { j: Journey }) {
  const { s, tx, lang } = useApp();
  const c = j.case;
  const openEsc = j.escalations.filter((e) => e.status === 'OPEN');
  return (
    <aside className="space-y-4">
      {openEsc.length > 0 && (
        <div className="rounded-2xl border-2 border-danger-line bg-danger-soft p-4 text-danger">
          <p className="flex items-center gap-2 font-bold">
            <ShieldAlert className="size-5" aria-hidden />
            {tx({ vi: 'Đang chờ điều phối viên', en: 'Waiting for coordinator' })}
          </p>
          {openEsc.map((e) => (
            <p key={e.id} className="mt-1 text-sm">{e.kind === 'HOTLINE_111' ? '111 · ' : ''}{e.reason}</p>
          ))}
        </div>
      )}
      <Card className="p-4">
        <p className="flex items-center gap-2 font-bold text-ink">
          <Lock className="size-4 text-brand" aria-hidden />
          {tx({ vi: 'Hồ sơ tối thiểu', en: 'Minimum record' })}
        </p>
        <p className="mt-1 text-[13px] text-muted">{tx({ vi: 'Mỗi dòng ghi rõ nguồn gốc thông tin.', en: 'Every line shows where it came from.' })}</p>
        {c.consent && (
          <p className="mt-3 rounded-lg bg-step-soft px-3 py-2 text-[13px] font-medium text-step">
            {tx({ vi: 'Đồng ý bằng lời', en: 'Verbal consent' })} · {fmtDate(c.consentGivenAt, lang)} · {tx({ vi: 'ảnh', en: 'photo' })} {c.consent.allowPhoto ? '✓' : '✗'} · {tx({ vi: 'gọi điện', en: 'phone' })} {c.consent.allowPhone ? '✓' : '✗'}
          </p>
        )}
        <ol className="mt-3 space-y-3">
          {j.facts.map((f) => (
            <li key={f.id} className="border-l-2 border-line pl-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[13px] font-semibold text-muted">{FIELD_LABEL[f.field]?.[lang] ?? f.field}</span>
                <ProvenanceChip source={f.source} />
              </div>
              <p className="mt-0.5 break-words text-sm text-ink">{factText(f, (n) => (s.need as Record<string, string>)[n] ?? n)}</p>
            </li>
          ))}
        </ol>
      </Card>
    </aside>
  );
}
