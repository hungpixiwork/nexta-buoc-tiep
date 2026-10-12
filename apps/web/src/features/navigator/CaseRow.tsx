import { Link } from 'react-router-dom';
import { ChevronRight, CalendarClock } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { Badge, cx } from '../../design/ui';
import { NeedIcon } from '../../design/widgets';
import { fmtRelative, isOverdue } from '../../lib/format';
import type { CaseListItem, JourneyStage } from '../../lib/types';

export function stageTone(stage: JourneyStage) {
  if (stage === 'CLOSED') return 'step' as const;
  if (stage === 'ESCALATED' || stage === 'RISK') return 'danger' as const;
  if (stage === 'CONNECTED' || stage === 'FOLLOW_UP') return 'brand' as const;
  return 'neutral' as const;
}

export function CaseRow({ c }: { c: CaseListItem }) {
  const { s, lang } = useApp();
  const held = c.riskDecision === 'HUMAN_REVIEW' || c.riskDecision === 'EMERGENCY_111';
  return (
    <li className="min-w-0">
      <Link to={`/journeys/${c.id}`} className="card flex items-center gap-3 p-3.5 transition-colors hover:border-line-strong sm:p-4">
        <span className={cx('grid size-11 shrink-0 place-items-center rounded-xl', held ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-brand-strong')}>
          <NeedIcon need={c.need} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-bold text-ink">{c.alias}</span>
            <Badge tone={held ? 'danger' : stageTone(c.stage)}>{held && c.stage === 'RISK' ? s.stage.RISK : s.stage[c.stage]}</Badge>
            {c.referral && <Badge tone="neutral">{c.referral.code} · {s.referralStage[c.referral.stage]}</Badge>}
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted">
            {c.nextStep?.action ?? c.priorityStatement ?? c.observation ?? '—'}
          </span>
          {c.followUp && (
            <span className={cx('mt-1 inline-flex items-center gap-1 text-[13px] font-semibold', isOverdue(c.followUp.dueAt) ? 'text-danger' : 'text-brand-strong')}>
              <CalendarClock className="size-3.5" aria-hidden />
              {s.loop.followUp} {fmtRelative(c.followUp.dueAt, lang)}
            </span>
          )}
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
      </Link>
    </li>
  );
}
