/**
 * NEXTA domain widgets — the visual vocabulary of the closed loop.
 */
import type { ReactNode } from 'react';
import {
  Ban,
  BadgeCheck,
  Briefcase,
  CalendarClock,
  Check,
  CircleDashed,
  Eye,
  FileText,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Home,
  Landmark,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  UserRound,
  Utensils,
} from 'lucide-react';
import { LOOP_TRACK } from '@buoc-tiep/shared';
import { useApp } from '../app/AppContext';
import { fmtDate, fmtDateTime, fmtRelative, isOverdue } from '../lib/format';
import type { JourneyStage, LoopStage, MatchResult, NeedCategory, NextStep, ProvenanceSource, RiskGateResult, VerificationFreshness, FollowUpResult } from '../lib/types';
import { Badge, Button, cx } from './ui';

// ---------------------------------------------------------------------------

const NEED_ICON: Record<NeedCategory, typeof Briefcase> = {
  employment: Briefcase,
  training: GraduationCap,
  health: HeartPulse,
  legal: Scale,
  documents: FileText,
  shelter: Home,
  food: Utensils,
  social_assistance: HandHeart,
  emergency: Siren,
};

export function NeedIcon({ need, className = 'size-5' }: { need: NeedCategory | null | undefined; className?: string }) {
  const Icon = need ? NEED_ICON[need] ?? HandHeart : HandHeart;
  return <Icon className={className} aria-hidden />;
}

export function NeedBadge({ need }: { need: NeedCategory | null | undefined }) {
  const { s } = useApp();
  if (!need) return null;
  return (
    <Badge tone="brand" icon={<NeedIcon need={need} className="size-3.5" />}>
      {s.need[need]}
    </Badge>
  );
}

export function FreshnessBadge({ freshness, date }: { freshness: VerificationFreshness; date?: string | null }) {
  const { s, lang } = useApp();
  const map = {
    VERIFIED: { tone: 'step', icon: <ShieldCheck className="size-3.5" aria-hidden /> },
    NEEDS_RECHECK: { tone: 'warn', icon: <RefreshCw className="size-3.5" aria-hidden /> },
    UNCONFIRMED: { tone: 'neutral', icon: <CircleDashed className="size-3.5" aria-hidden /> },
    INACTIVE: { tone: 'danger', icon: <Ban className="size-3.5" aria-hidden /> },
  } as const;
  const m = map[freshness];
  return (
    <Badge tone={m.tone} icon={m.icon}>
      {s.freshness[freshness]}
      {date && freshness === 'VERIFIED' ? ` · ${fmtDate(date, lang)}` : ''}
    </Badge>
  );
}

export function CapacityBadge({ status, slots }: { status: 'AVAILABLE' | 'LIMITED' | 'FULL' | 'UNKNOWN'; slots?: number | null }) {
  const { s, tx } = useApp();
  const tone = status === 'AVAILABLE' ? 'step' : status === 'LIMITED' ? 'warn' : status === 'FULL' ? 'danger' : 'neutral';
  return (
    <Badge tone={tone}>
      {s.capacity[status]}
      {slots != null && status !== 'FULL' ? ` · ${slots} ${tx({ vi: 'chỗ', en: 'places' })}` : ''}
    </Badge>
  );
}

const PROVENANCE_ICON: Record<ProvenanceSource, ReactNode> = {
  BENEFICIARY_STATED: <MessageCircle className="size-3.5" aria-hidden />,
  NAVIGATOR_OBSERVED: <Eye className="size-3.5" aria-hidden />,
  AI_SUGGESTED: <Sparkles className="size-3.5" aria-hidden />,
  HUMAN_VERIFIED: <BadgeCheck className="size-3.5" aria-hidden />,
  VERIFIED_EXTERNAL: <Landmark className="size-3.5" aria-hidden />,
};

export function ProvenanceChip({ source }: { source: ProvenanceSource }) {
  const { s } = useApp();
  const tone = source === 'AI_SUGGESTED' ? 'ai' : source === 'HUMAN_VERIFIED' || source === 'VERIFIED_EXTERNAL' ? 'step' : 'neutral';
  return (
    <Badge tone={tone} icon={PROVENANCE_ICON[source]} className="text-xs">
      {s.provenance[source]}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Loop ribbon — where this journey is in Observe → … → Follow up
// ---------------------------------------------------------------------------

const RIBBON_INDEX: Record<JourneyStage, number> = {
  CONSENT: 1,
  UNDERSTAND: 1,
  RISK: 2,
  MATCH: 2,
  NEXT_STEP: 3,
  CONNECTED: 4,
  FOLLOW_UP: 5,
  CLOSED: 6,
  ESCALATED: 2,
};

export function LoopRibbon({ stage }: { stage: JourneyStage }) {
  const { s } = useApp();
  const steps = [s.loop.observe, s.loop.understand, s.loop.verify, s.loop.step, s.loop.connect, s.loop.followUp];
  const current = RIBBON_INDEX[stage];
  return (
    <div>
    <ol className="grid grid-cols-6 gap-1" aria-label="NEXTA loop">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="min-w-0" aria-current={active ? 'step' : undefined}>
            <div className={cx('h-1.5 rounded-full', done ? 'bg-step' : active ? (stage === 'ESCALATED' ? 'bg-danger' : 'bg-brand') : 'bg-line')} />
            <p className={cx('mt-1.5 hidden truncate text-[13px] font-semibold sm:block', done ? 'text-step' : active ? 'text-ink' : 'text-muted')}>
              {done && <Check className="-mt-0.5 mr-0.5 inline size-3.5" aria-hidden />}
              {label}
            </p>
          </li>
        );
      })}
    </ol>
    <p className="mt-2 text-sm font-semibold text-ink sm:hidden">
      {Math.min(current + 1, steps.length)}/{steps.length} · {steps[Math.min(current, steps.length - 1)]}
    </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Safe Next Step card — the core output of NEXTA
// ---------------------------------------------------------------------------

export function SafeNextStepCard({ step, footer }: { step: NextStep; footer?: ReactNode }) {
  const { s, lang, tx } = useApp();
  const statusTone = step.status === 'REACHED' ? 'step' : step.status === 'CONFIRMED' ? 'brand' : step.status === 'CANCELLED' ? 'neutral' : 'warn';
  const statusLabel = {
    PROPOSED: tx({ vi: 'Đề xuất — chờ đồng ý', en: 'Proposed — awaiting agreement' }),
    CONFIRMED: tx({ vi: 'Đã thống nhất', en: 'Agreed' }),
    REACHED: tx({ vi: 'Đã thực hiện', en: 'Happened' }),
    CANCELLED: tx({ vi: 'Đã huỷ', en: 'Cancelled' }),
  }[step.status];
  const overdue = step.status === 'CONFIRMED' && isOverdue(step.dueAt);
  const ownerRole = { BENEFICIARY: tx({ vi: 'Người dân', en: 'The person' }), NAVIGATOR: 'Navigator', PARTNER: s.roles.partner }[step.ownerRole];

  return (
    <article className={cx('overflow-hidden rounded-2xl border-2 bg-surface shadow-[var(--shadow-card)]', step.status === 'CANCELLED' ? 'border-line opacity-80' : 'border-step-line')}>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-step-soft px-4 py-2.5">
        <p className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wide text-step">
          <ShieldCheck className="size-4" aria-hidden />
          {s.loop.step}
        </p>
        <Badge tone={statusTone}>{statusLabel}</Badge>
      </div>
      <div className="px-4 pb-4 pt-3">
        <p className="text-lg font-bold leading-snug text-ink sm:text-xl">{step.action}</p>
        {step.organisationName && (
          <p className="mt-1 text-[15px] text-muted">
            {step.organisationName}
            {step.serviceName ? ` — ${step.serviceName}` : ''}
          </p>
        )}
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Meta icon={<UserRound className="size-4" />} label={tx({ vi: 'Người chịu trách nhiệm', en: 'Owner' })} value={`${step.ownerName} · ${ownerRole}`} />
          <Meta icon={<MapPin className="size-4" />} label={tx({ vi: 'Ở đâu', en: 'Where' })} value={step.place} />
          <Meta
            icon={<CalendarClock className="size-4" />}
            label={tx({ vi: 'Khi nào', en: 'When' })}
            value={
              <span className={overdue ? 'text-danger' : undefined}>
                {fmtDateTime(step.dueAt, lang)} <span className="text-muted">({fmtRelative(step.dueAt, lang)})</span>
              </span>
            }
          />
          <Meta icon={<ShieldCheck className="size-4" />} label={tx({ vi: 'Xác minh', en: 'Verification' })} value={
              step.verification === 'CONTACT_CONFIRMED' ? (
                <Badge tone="step" icon={<Phone className="size-3.5" aria-hidden />}>
                  {tx({ vi: 'Đã gọi xác nhận', en: 'Confirmed by phone' })} · {fmtDate(step.verifiedAt, lang)}
                </Badge>
              ) : (
                <FreshnessBadge freshness={step.verification} date={step.verifiedAt} />
              )
            } />
        </dl>
        {step.phone && (
          <a href={`tel:${step.phone.replace(/\s/g, '')}`} className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-line-strong px-3 font-semibold text-brand-strong hover:bg-sunken">
            <Phone className="size-4" aria-hidden />
            {step.phone}
          </a>
        )}
        {footer && <div className="mt-4 border-t border-line pt-4">{footer}</div>}
      </div>
    </article>
  );
}

function Meta({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-xl bg-sunken px-3 py-2.5">
      <span className="mt-0.5 text-brand-strong" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[13px] font-medium text-muted">{label}</dt>
        <dd className="font-semibold text-ink">{value}</dd>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Referral tracker — "no referral disappears silently"
// ---------------------------------------------------------------------------

export function ReferralTracker({ stage, events }: { stage: LoopStage; events?: Array<{ toStage: LoopStage; createdAt: string; actorName: string | null; note: string | null; action?: string }> }) {
  const { s, lang } = useApp();
  const offTrack = stage === 'DECLINED' || stage === 'ESCALATED';
  const reachedIdx = offTrack ? LOOP_TRACK.indexOf(stage === 'DECLINED' ? 'RECEIVED' : 'CREATED') : LOOP_TRACK.indexOf(stage);
  const eventFor = (st: LoopStage) => events?.filter((e) => e.toStage === st && e.action !== 'question').slice(-1)[0];

  return (
    <div>
      <ol className="flex flex-col gap-0 md:flex-row md:gap-1">
        {LOOP_TRACK.map((st, i) => {
          const done = i <= reachedIdx;
          const ev = eventFor(st);
          return (
            <li key={st} className="flex gap-3 md:flex-1 md:flex-col md:gap-2">
              <div className="flex flex-col items-center md:flex-row">
                <span className={cx('grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold', done ? 'border-step bg-step text-white' : 'border-line-strong bg-surface text-muted')}>
                  {done ? <Check className="size-4" aria-hidden /> : i + 1}
                </span>
                {i < LOOP_TRACK.length - 1 && <span className={cx('w-0.5 flex-1 md:h-0.5 md:w-auto', i < reachedIdx ? 'bg-step' : 'bg-line')} style={{ minHeight: 16 }} />}
              </div>
              <div className="pb-3 md:pb-0">
                <p className={cx('text-sm font-semibold', done ? 'text-ink' : 'text-muted')}>{s.referralStage[st]}</p>
                {ev && <p className="text-xs text-muted">{fmtDateTime(ev.createdAt, lang)}{ev.actorName ? ` · ${ev.actorName}` : ''}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      {offTrack && (
        <p className={cx('mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold', stage === 'DECLINED' ? 'border-warn-line bg-warn-soft text-warn' : 'border-danger-line bg-danger-soft text-danger')}>
          <ShieldAlert className="size-4" aria-hidden />
          {s.referralStage[stage]}
          {eventFor(stage)?.note ? ` — ${eventFor(stage)?.note}` : ''}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk gate banner
// ---------------------------------------------------------------------------

const FLAG_LABEL: Record<string, { vi: string; en: string }> = {
  CHILD_PRESENT: { vi: 'Có trẻ em (<18 tuổi)', en: 'A child (<18) is involved' },
  VIOLENCE_OR_ABUSE: { vi: 'Bạo lực / xâm hại', en: 'Violence or abuse' },
  SELF_HARM: { vi: 'Nguy cơ tự hại', en: 'Risk of self-harm' },
  MEDICAL_EMERGENCY: { vi: 'Cấp cứu y tế', en: 'Medical emergency' },
  EXPLOITATION_OR_TRAFFICKING: { vi: 'Bóc lột / mua bán người', en: 'Exploitation or trafficking' },
  SCAM_PATTERN: { vi: 'Dấu hiệu lừa đảo việc làm', en: 'Job-scam language' },
  IMPERSONATION_PATTERN: { vi: 'Dấu hiệu giả danh', en: 'Impersonation language' },
  NO_SAFE_SHELTER_TONIGHT: { vi: 'Không có chỗ ngủ an toàn tối nay', en: 'No safe place to sleep tonight' },
  OTHER: { vi: 'Khác', en: 'Other' },
};

export function flagLabel(code: string, lang: 'vi' | 'en') {
  return FLAG_LABEL[code]?.[lang] ?? code;
}

/** Risk-gate escalations store "CODE evidence; CODE evidence" — show the human label per flag instead. */
export function humanizeReason(reason: string, lang: 'vi' | 'en') {
  return reason
    .split(/;\s*/)
    .map((part) => {
      const m = part.match(/^([A-Z][A-Z0-9_]{2,})\b/);
      return m && FLAG_LABEL[m[1]] ? FLAG_LABEL[m[1]][lang] : part;
    })
    .filter((v, i, a) => v && a.indexOf(v) === i)
    .join(' · ');
}

export function RiskBanner({ risk }: { risk: RiskGateResult }) {
  const { lang, tx } = useApp();
  const conf = {
    PROCEED: { tone: 'border-step-line bg-step-soft text-step', icon: <ShieldCheck className="size-6" aria-hidden />, title: tx({ vi: 'An toàn để tiếp tục', en: 'Safe to continue' }), body: tx({ vi: 'Không phát hiện dấu hiệu cần chuyển cấp. Luật kiểm tra chạy trước mọi gợi ý của máy.', en: 'No signal requires escalation. Rules run before any machine suggestion.' }) },
    ASK_MORE: { tone: 'border-warn-line bg-warn-soft text-warn', icon: <ShieldAlert className="size-6" aria-hidden />, title: tx({ vi: 'Cần hỏi thêm', en: 'Ask a little more' }), body: tx({ vi: 'Còn thiếu thông tin quan trọng trước khi tìm nguồn lực.', en: 'Key context is missing before matching.' }) },
    HUMAN_REVIEW: { tone: 'border-danger-line bg-danger-soft text-danger', icon: <ShieldAlert className="size-6" aria-hidden />, title: tx({ vi: 'Tạm dừng — cần người điều phối xem xét', en: 'On hold — a coordinator must review' }), body: tx({ vi: 'Hành trình được giữ lại cho đến khi một người có thẩm quyền xem xét. Máy không được quyết định thay.', en: 'The journey is held until an accountable person reviews it. The machine cannot decide.' }) },
    EMERGENCY_111: { tone: 'border-danger bg-danger text-white', icon: <Siren className="size-6" aria-hidden />, title: tx({ vi: 'Khẩn cấp — liên hệ ngay', en: 'Emergency — act now' }), body: tx({ vi: 'Gọi 111 (trẻ em) hoặc 115 (cấp cứu) ngay. Người điều phối đã được báo.', en: 'Call 111 (child protection) or 115 (ambulance) now. The coordinator has been alerted.' }) },
  }[risk.decision];

  const missing: Record<string, { vi: string; en: string }> = {
    consent: { vi: 'Chưa có đồng ý', en: 'No consent yet' },
    need: { vi: 'Chưa rõ nhu cầu ưu tiên', en: 'Priority need unclear' },
    location: { vi: 'Chưa rõ khu vực', en: 'Location unclear' },
    age_if_child_suspected: { vi: 'Cần xác nhận tuổi', en: 'Confirm age' },
  };

  return (
    <div role={risk.decision === 'PROCEED' ? 'status' : 'alert'} className={cx('rounded-2xl border-2 p-4', conf.tone)}>
      <div className="flex items-start gap-3">
        {conf.icon}
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold">{conf.title}</p>
          <p className="text-[15px]">{conf.body}</p>
        </div>
      </div>
      {(risk.flags.length > 0 || risk.missingContext.length > 0) && (
        <ul className="mt-3 space-y-1.5">
          {risk.flags.map((f, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-surface px-3 py-2 text-[14px] text-ink">
              <span className="font-semibold">{flagLabel(f.code, lang)}</span>
              <span className="text-muted">{f.evidence}</span>
              <Badge tone={f.source === 'AI_SUGGESTED' ? 'ai' : f.source === 'NAVIGATOR' ? 'brand' : 'neutral'} className="text-xs">
                {f.source === 'RULE' ? tx({ vi: 'Luật', en: 'Rule' }) : f.source === 'NAVIGATOR' ? 'Navigator' : tx({ vi: 'Máy gợi ý', en: 'Machine suggestion' })}
              </Badge>
            </li>
          ))}
          {risk.missingContext.map((m) => (
            <li key={m} className="rounded-lg bg-surface px-3 py-2 text-[14px] font-semibold text-ink">
              {missing[m]?.[lang] ?? m}
            </li>
          ))}
        </ul>
      )}
      {risk.showVerificationCard && (
        <div className="mt-3 rounded-xl border border-warn-line bg-surface p-3 text-[14px] text-ink">
          <p className="font-bold text-warn">{tx({ vi: 'Thẻ kiểm chứng', en: 'Verification card' })}</p>
          <p>
            {tx({
              vi: 'Không chuyển tiền, không đóng phí trước, không gửi giấy tờ gốc. Kiểm tra qua kênh chính thức (Trung tâm Dịch vụ việc làm, Cổng 1022) trước khi nhận việc.',
              en: 'No transfers, no upfront fees, no original documents. Check via an official channel (Employment Service Centre, 1022) before accepting any job.',
            })}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Match funnel — why each resource was or wasn't suggested
// ---------------------------------------------------------------------------

export function MatchFunnel({ match }: { match: MatchResult }) {
  const { tx } = useApp();
  const reasonLabel = useReasonLabel();
  const label: Record<string, { vi: string; en: string }> = {
    need: { vi: 'Đúng nhu cầu', en: 'Need' },
    location: { vi: 'Phục vụ khu vực', en: 'Location' },
    eligibility: { vi: 'Đủ điều kiện', en: 'Eligibility' },
    availability: { vi: 'Đang mở / nhận chuyển gửi', en: 'Availability' },
    verification: { vi: 'Đã được người xác minh', en: 'Verification' },
    capacity: { vi: 'Còn sức chứa', en: 'Capacity' },
  };
  const max = Math.max(1, match.stages[0]?.inCount ?? 1);
  return (
    <ol className="space-y-2">
      {match.stages.map((st, i) => (
        <li key={st.stage}>
          <details className="group rounded-xl border border-line bg-surface">
            <summary className="flex min-h-[48px] cursor-pointer list-none items-center gap-3 px-3 py-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-sunken text-xs font-bold text-ink-2">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2 text-[14px] font-semibold text-ink">
                  <span className="truncate">{tx(label[st.stage])}</span>
                  <span className="tabular shrink-0 text-muted">
                    {st.passedCount}/{st.inCount}
                  </span>
                </span>
                <span className="mt-1 block h-2 overflow-hidden rounded-full bg-sunken">
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${(st.passedCount / max) * 100}%` }} />
                </span>
              </span>
            </summary>
            {st.eliminated.length > 0 && (
              <ul className="space-y-1 border-t border-line px-3 py-2 text-[13px]">
                {st.eliminated.map((e) => (
                  <li key={e.resourceId} className="flex flex-wrap gap-x-2">
                    <span className="font-medium text-ink">{e.resourceName}</span>
                    <span className="text-muted">— {e.code ? reasonLabel({ code: e.code, value: e.value }) : e.reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </details>
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Follow-up outcome buttons — Better / Same / Harder
// ---------------------------------------------------------------------------

export function OutcomeButtons({ onPick, loading }: { onPick: (r: FollowUpResult) => void; loading?: FollowUpResult | null }) {
  const { s } = useApp();
  const opts: Array<{ r: FollowUpResult; cls: string; emoji: string }> = [
    { r: 'BETTER', cls: 'border-step-line bg-step-soft text-step hover:border-step', emoji: '↗' },
    { r: 'SAME', cls: 'border-line-strong bg-surface text-ink hover:border-ink-2', emoji: '→' },
    { r: 'HARDER', cls: 'border-danger-line bg-danger-soft text-danger hover:border-danger', emoji: '↘' },
  ];
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-3 gap-2">
        {opts.map((o) => (
          <button key={o.r} type="button" disabled={Boolean(loading)} onClick={() => onPick(o.r)} className={cx('flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border-2 font-bold transition-colors disabled:opacity-60', o.cls)}>
            <span aria-hidden className="text-2xl leading-none">
              {o.emoji}
            </span>
            {s.outcome[o.r]}
          </button>
        ))}
      </div>
      <Button variant="ghost" size="sm" onClick={() => onPick('UNREACHABLE')} disabled={Boolean(loading)}>
        {s.outcome.UNREACHABLE}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Match reason codes → human copy
// ---------------------------------------------------------------------------

export function useReasonLabel() {
  const { s, tx } = useApp();
  const need = (v: unknown) => (s.need as Record<string, string>)[String(v)] ?? String(v ?? '');
  return (r: { code: string; value?: string | number }): string => {
    switch (r.code) {
      case 'NOT_THIS_NEED': return tx({ vi: `Không cung cấp hỗ trợ ${need(r.value).toLowerCase()}`, en: `Does not offer ${need(r.value).toLowerCase()}` });
      case 'OUTSIDE_AREA': return tx({ vi: `Không phục vụ khu vực ${r.value}`, en: `Does not serve ${r.value}` });
      case 'SAFEGUARDING_EMPLOYMENT_BLOCK': return tx({ vi: 'Bảo vệ an toàn: không giới thiệu việc làm cho trường hợp này', en: 'Safeguarding: no employment referral for this person' });
      case 'MIN_AGE': return tx({ vi: `Chỉ nhận từ ${r.value} tuổi`, en: `Minimum age ${r.value}` });
      case 'MAX_AGE': return tx({ vi: `Chỉ nhận đến ${r.value} tuổi`, en: `Maximum age ${r.value}` });
      case 'TARGET_GROUP': return tx({ vi: `Chỉ phục vụ nhóm: ${r.value}`, en: `Serves only: ${r.value}` });
      case 'REQUIRES_ID': return tx({ vi: 'Bắt buộc có giấy tờ tùy thân', en: 'Requires ID documents' });
      case 'NOT_ACCEPTING_REFERRALS': return tx({ vi: 'Kênh tự phục vụ, không nhận chuyển gửi có theo dõi', en: 'Self-service, no tracked referrals' });
      case 'CLOSED_WEEKENDS': return tx({ vi: 'Không mở cuối tuần', en: 'Closed at weekends' });
      case 'NIGHT_ONLY': return tx({ vi: 'Chỉ mở ngoài giờ ban ngày', en: 'Open only outside daytime' });
      case 'INACTIVE': return tx({ vi: 'Đã ngừng hoạt động', en: 'Inactive' });
      case 'UNCONFIRMED': return tx({ vi: 'Chưa được người xác minh', en: 'Not yet verified by a person' });
      case 'FULL': return tx({ vi: 'Hiện đã hết chỗ', en: 'Full right now' });
      case 'NO_SLOTS': return tx({ vi: 'Không còn suất', en: 'No places left' });
      case 'PROVIDES_NEED': return tx({ vi: `Đúng nhu cầu ${need(r.value).toLowerCase()}`, en: `Offers ${need(r.value).toLowerCase()}` });
      case 'RELATED_SERVICE': return tx({ vi: `Dịch vụ liên quan (${need(r.value).toLowerCase()})`, en: `Related service (${need(r.value).toLowerCase()})` });
      case 'SAME_DISTRICT': return tx({ vi: 'Phục vụ đúng khu vực', en: 'Serves this area' });
      case 'ADJACENT_DISTRICT': return tx({ vi: 'Khu vực lân cận', en: 'Neighbouring area' });
      case 'CITYWIDE': return tx({ vi: 'Phục vụ toàn thành phố', en: 'Serves the whole city' });
      case 'VERIFIED_ON': return tx({ vi: `Đã xác minh ${r.value ?? ''}`, en: `Verified ${r.value ?? ''}` }).trim();
      case 'STRENGTH': return tx({ vi: `Phát huy điểm mạnh: ${r.value}`, en: `Builds on strength: ${r.value}` });
      case 'NEEDS_RECHECK': return tx({ vi: 'Cần gọi xác nhận trước khi chuyển gửi', en: 'Call to confirm before referring' });
      case 'LIMITED_CAPACITY': return tx({ vi: 'Còn ít chỗ', en: 'Limited places' });
      case 'CAPACITY_UNKNOWN': return tx({ vi: 'Chưa rõ còn nhận không', en: 'Capacity not confirmed' });
      default: return r.code;
    }
  };
}
