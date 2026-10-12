/**
 * Dashboard building blocks shared by the Navigator, Partner and Coordinator workspaces.
 * Light humanitarian palette, no blur, every status = colour + icon + words.
 */
import type { ReactNode } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cx, type Tone } from './ui';
import { initials, PATHWAY_LABEL, PATHWAY_TONE, type Pathway } from '../lib/pathway';
import { useApp } from '../app/AppContext';

const SOFT: Record<Tone, string> = {
  neutral: 'bg-sunken text-ink-2',
  brand: 'bg-brand-soft text-brand',
  step: 'bg-step-soft text-step',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  ai: 'bg-ai-soft text-ai',
};

const FILLED_CARD: Record<Tone, string> = {
  neutral: 'bg-surface border-line',
  brand: 'bg-[#EFF6FF] border-brand-line',
  step: 'bg-step-soft border-step-line',
  warn: 'bg-warn-soft border-warn-line',
  danger: 'bg-danger-soft border-danger-line',
  ai: 'bg-ai-soft border-ai-line',
};

const VALUE_TONE: Record<Tone, string> = {
  neutral: 'text-ink',
  brand: 'text-brand-strong',
  step: 'text-step',
  warn: 'text-warn',
  danger: 'text-danger',
  ai: 'text-ai',
};

// ---------------------------------------------------------------------------
// Page hero
// ---------------------------------------------------------------------------

export function PageHero({ eyebrow, tags, title, description, aside }: { eyebrow?: string; tags?: ReactNode; title: string; description?: ReactNode; aside?: ReactNode }) {
  return (
    <section className="mb-5 flex flex-col gap-4 rounded-[20px] border border-brand-line/60 bg-[#EDF3FB] px-5 py-5 md:px-7 md:py-6 xl:flex-row xl:items-center">
      <div className="min-w-0 flex-1">
        {(eyebrow || tags) && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {eyebrow && <span className="rounded-full border border-brand-line bg-surface px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand">{eyebrow}</span>}
            {tags}
          </div>
        )}
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink md:text-[34px]">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-ink-2">{description}</p>}
      </div>
      {aside && <div className="shrink-0 xl:max-w-[420px]">{aside}</div>}
    </section>
  );
}

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------

export interface KpiDelta {
  value: number;
  /** true when a rise is good news (completed cases), false when a rise is bad news (overdue) */
  upIsGood?: boolean;
  label?: string;
  suffix?: string;
}

export function KpiCard({
  icon,
  label,
  value,
  unit,
  delta,
  tone = 'brand',
  filled,
  progress,
  to,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  unit?: ReactNode;
  delta?: KpiDelta;
  tone?: Tone;
  filled?: boolean;
  progress?: number;
  to?: string;
}) {
  const body = (
    <>
      <span className={cx('grid size-12 shrink-0 place-items-center rounded-full', SOFT[tone], filled && 'bg-surface')}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={cx('text-[14px] font-semibold leading-snug', filled ? VALUE_TONE[tone] : 'text-ink-2')}>{label}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className={cx('tabular text-[30px] font-extrabold leading-none tracking-tight', filled ? VALUE_TONE[tone] : 'text-ink')}>{value}</span>
          {unit && <span className="text-sm text-muted">{unit}</span>}
          {delta && <DeltaChip {...delta} />}
        </div>
        {progress != null && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
            </div>
            <span className="tabular text-xs font-semibold text-muted">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
    </>
  );
  const cls = cx('flex items-center gap-3.5 rounded-2xl border p-4', filled ? FILLED_CARD[tone] : 'border-line bg-surface', to && 'press hover:border-brand-line');
  return to ? (
    <Link to={to} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function DeltaChip({ value, upIsGood = true, label, suffix = '' }: KpiDelta) {
  if (!Number.isFinite(value)) return null;
  const up = value > 0;
  const good = value === 0 ? null : up === upIsGood;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className={cx('inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-bold', good === null ? 'bg-sunken text-muted' : good ? 'bg-step-soft text-step' : 'bg-danger-soft text-danger')}>
        {value !== 0 && <Icon className="size-3" aria-hidden />}
        {Math.abs(value)}
        {suffix}
      </span>
      {label && <span className="text-muted">{label}</span>}
    </span>
  );
}

export function KpiRow({ children }: { children: ReactNode }) {
  return <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

// ---------------------------------------------------------------------------
// Panel (titled card)
// ---------------------------------------------------------------------------

export function Panel({ title, icon, action, children, className, bodyClassName, tone }: { title?: ReactNode; icon?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string; tone?: Tone }) {
  return (
    <section className={cx('min-w-0 rounded-2xl border', tone ? FILLED_CARD[tone] : 'border-line bg-surface', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4">
          <h2 className="flex min-w-0 items-center gap-2 text-[17px] font-bold text-ink">
            {icon && <span className="shrink-0 text-brand">{icon}</span>}
            <span className="min-w-0">{title}</span>
          </h2>
          {action}
        </header>
      )}
      <div className={cx('p-5', title ? 'pt-3' : null, bodyClassName)}>{children}</div>
    </section>
  );
}

export function SeeAll({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:underline">
      {children}
      <ArrowRight className="size-4" aria-hidden />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Pills
// ---------------------------------------------------------------------------

export function Pill({ tone = 'neutral', icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-semibold leading-4', SOFT[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

export type Priority = 'high' | 'medium' | 'low';
const PRIORITY_TONE: Record<Priority, Tone> = { high: 'danger', medium: 'warn', low: 'step' };
const PRIORITY_DOT: Record<Priority, string> = { high: 'bg-red-600', medium: 'bg-amber-500', low: 'bg-emerald-600' };

export function PriorityPill({ priority }: { priority: Priority }) {
  const { tx } = useApp();
  const label = { high: tx({ vi: 'Cao', en: 'High' }), medium: tx({ vi: 'Trung bình', en: 'Medium' }), low: tx({ vi: 'Thấp', en: 'Low' }) }[priority];
  return (
    <Pill tone={PRIORITY_TONE[priority]}>
      <span className={cx('size-2 rounded-full', PRIORITY_DOT[priority])} aria-hidden />
      {label}
    </Pill>
  );
}

export function PriorityDot({ priority }: { priority: Priority }) {
  return <span className={cx('inline-block size-2.5 rounded-full', PRIORITY_DOT[priority])} aria-hidden />;
}

export function PathwayPill({ pathway }: { pathway: Pathway }) {
  const { tx } = useApp();
  return <Pill tone={PATHWAY_TONE[pathway]}>{tx(PATHWAY_LABEL[pathway])}</Pill>;
}

export const STEP_META = [
  { n: 1, vi: 'Quan sát', en: 'Observe', cls: 'bg-sky-100 text-sky-900 border-sky-200', dot: 'bg-sky-600' },
  { n: 2, vi: 'Thấu hiểu', en: 'Understand', cls: 'bg-emerald-100 text-emerald-900 border-emerald-200', dot: 'bg-emerald-600' },
  { n: 3, vi: 'Xác minh', en: 'Verify', cls: 'bg-violet-100 text-violet-900 border-violet-200', dot: 'bg-violet-600' },
  { n: 4, vi: 'Bước tiếp', en: 'Next step', cls: 'bg-teal-100 text-teal-900 border-teal-200', dot: 'bg-teal-600' },
  { n: 5, vi: 'Kết nối', en: 'Connect', cls: 'bg-blue-100 text-blue-900 border-blue-200', dot: 'bg-blue-600' },
  { n: 6, vi: 'Theo dõi', en: 'Follow up', cls: 'bg-amber-100 text-amber-900 border-amber-200', dot: 'bg-amber-600' },
] as const;

export function StepPill({ step }: { step: number }) {
  const { tx } = useApp();
  const m = STEP_META[Math.min(6, Math.max(1, step)) - 1];
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-1 text-[12.5px] font-semibold', m.cls)}>
      <span className="tabular font-black">{m.n}</span>
      {tx(m)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Person avatar (initials only — photos of beneficiaries are never shown)
// ---------------------------------------------------------------------------

const AVATAR_TONES = ['bg-sky-100 text-sky-900', 'bg-emerald-100 text-emerald-900', 'bg-violet-100 text-violet-900', 'bg-amber-100 text-amber-900', 'bg-rose-100 text-rose-900', 'bg-teal-100 text-teal-900'];

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden
      className={cx(
        'grid shrink-0 place-items-center rounded-full font-bold',
        AVATAR_TONES[h % AVATAR_TONES.length],
        size === 'sm' && 'size-9 text-xs',
        size === 'md' && 'size-11 text-sm',
        size === 'lg' && 'size-16 text-lg',
      )}
    >
      {initials(name)}
    </span>
  );
}

export function PersonCell({ name, meta }: { name: string; meta?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={name} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink">{name}</p>
        {meta && <p className="truncate text-[13px] text-muted">{meta}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data table: a real <table> on desktop, stacked cards below md
// ---------------------------------------------------------------------------

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Hide on the mobile card layout */
  hideOnMobile?: boolean;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  selectedKey,
  onRowClick,
  empty,
  showChevron,
  label,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  selectedKey?: string | null;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  showChevron?: boolean;
  label: string;
}) {
  if (rows.length === 0) return <div className="py-6">{empty}</div>;
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-separate border-spacing-y-1 text-left text-[14px]" aria-label={label}>
          <thead>
            <tr className="text-[13px] font-semibold text-muted">
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cx('px-3 pb-1 font-semibold', c.className)}>
                  {c.header}
                </th>
              ))}
              {showChevron && <th aria-hidden className="w-8" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const k = rowKey(r);
              const sel = selectedKey === k;
              return (
                <tr
                  key={k}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                  onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onRowClick(r)) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-selected={onRowClick ? sel : undefined}
                  className={cx('align-middle', onRowClick && 'cursor-pointer', sel ? 'bg-brand-soft' : onRowClick && 'hover:bg-sunken')}
                >
                  {columns.map((c, i) => (
                    <td key={c.key} className={cx('px-3 py-2.5', i === 0 && 'rounded-l-xl', !showChevron && i === columns.length - 1 && 'rounded-r-xl', c.className)}>
                      {c.cell(r)}
                    </td>
                  ))}
                  {showChevron && (
                    <td className="rounded-r-xl pr-3 text-muted">
                      <ChevronRight className="size-5" aria-hidden />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-2 md:hidden" aria-label={label}>
        {rows.map((r) => {
          const k = rowKey(r);
          return (
            <li key={k}>
              <div
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onRowClick(r)) : undefined}
                className={cx('grid gap-2 rounded-xl border p-3.5', selectedKey === k ? 'border-brand-line bg-brand-soft' : 'border-line bg-surface')}
              >
                {columns
                  .filter((c) => !c.hideOnMobile)
                  .map((c, i) => (
                    <div key={c.key} className={cx('min-w-0', i > 0 && 'flex flex-wrap items-center gap-x-2 text-sm')}>
                      {i > 0 && typeof c.header === 'string' && <span className="text-xs font-semibold text-muted">{c.header}:</span>}
                      {c.cell(r)}
                    </div>
                  ))}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// ---------------------------------------------------------------------------
// Right-hand detail panel actions
// ---------------------------------------------------------------------------

export function ActionRow({ icon, label, to, onClick, primary }: { icon: ReactNode; label: string; to?: string; onClick?: () => void; primary?: boolean }) {
  const cls = cx(
    'press flex min-h-[48px] w-full items-center gap-3 rounded-xl border px-4 text-[15px] font-semibold',
    primary ? 'border-brand bg-brand text-white hover:bg-brand-strong' : 'border-brand-line bg-surface text-brand-strong hover:bg-brand-soft',
  );
  const inner = (
    <>
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      <ChevronRight className="size-5 shrink-0" aria-hidden />
    </>
  );
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Activity feed, alerts, tip
// ---------------------------------------------------------------------------

export interface ActivityItem {
  id: string;
  at: string;
  text: ReactNode;
  tone?: Tone;
}

const DOT: Record<Tone, string> = {
  neutral: 'bg-slate-400',
  brand: 'bg-brand',
  step: 'bg-step',
  warn: 'bg-amber-500',
  danger: 'bg-danger',
  ai: 'bg-ai',
};

export function ActivityFeed({ items, empty }: { items: ActivityItem[]; empty: string }) {
  const { lang } = useApp();
  if (items.length === 0) return <p className="py-2 text-sm text-muted">{empty}</p>;
  return (
    <ol className="grid gap-2.5">
      {items.map((it) => (
        <li key={it.id} className="flex items-start gap-3 text-[14px]">
          <span className={cx('mt-1.5 size-2.5 shrink-0 rounded-full', DOT[it.tone ?? 'brand'])} aria-hidden />
          <time className="tabular w-[92px] shrink-0 text-muted" dateTime={it.at}>
            {timeLabel(it.at, lang)}
          </time>
          <span className="min-w-0 text-ink-2">{it.text}</span>
        </li>
      ))}
    </ol>
  );
}

function timeLabel(iso: string, lang: 'vi' | 'en') {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const today = new Date();
  const hm = d.toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return hm;
  return `${hm} · ${d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit' })}`;
}

export function AlertRow({ icon, title, detail, meta, to, tone = 'danger' }: { icon: ReactNode; title: ReactNode; detail?: ReactNode; meta?: ReactNode; to?: string; tone?: Tone }) {
  const body = (
    <>
      <span className={cx('shrink-0', VALUE_TONE[tone])}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{title}</p>
        {detail && <p className="text-[13px] text-muted">{detail}</p>}
      </div>
      {meta && <span className="tabular shrink-0 text-[13px] text-muted">{meta}</span>}
      {to && <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />}
    </>
  );
  const cls = 'flex items-center gap-3 rounded-xl px-3 py-2.5';
  return to ? (
    <Link to={to} className={cx(cls, 'hover:bg-surface')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function TipCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-step-line bg-step-soft p-4">
      <span className="mt-0.5 shrink-0 text-step">{icon}</span>
      <div className="min-w-0">
        <p className="font-bold text-ink">{title}</p>
        <div className="mt-1 text-[14px] leading-relaxed text-ink-2">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Charts (plain SVG / CSS)
// ---------------------------------------------------------------------------

export function DonutGauge({ value, label, size = 120, color = '#047857' }: { value: number; label?: string; size?: number; color?: string }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(100, Math.max(0, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label ?? ''} ${Math.round(v)}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth="14" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${(v / 100) * c} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-ink text-[22px] font-extrabold">
        {Math.round(v)}%
      </text>
    </svg>
  );
}

export function HBar({ icon, label, value, max, share, color }: { icon?: ReactNode; label: string; value: number; max: number; share?: number; color: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(80px,1.1fr)_auto] items-center gap-3 text-[14px]">
      <span className="flex min-w-0 items-center gap-2 text-ink-2">
        {icon && <span className="shrink-0 text-brand">{icon}</span>}
        <span className="truncate">{label}</span>
      </span>
      <span className="h-3 overflow-hidden rounded-full bg-sunken">
        <span className="block h-full rounded-full" style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, backgroundColor: color }} />
      </span>
      <span className="tabular w-[72px] text-right font-semibold text-ink">
        {value}
        {share != null && <span className="font-normal text-muted"> ({share}%)</span>}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Segmented control / filter chips
// ---------------------------------------------------------------------------

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: ReactNode; count?: number }>; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'press inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-semibold',
            value === o.value ? 'border-brand bg-brand text-white' : 'border-line-strong bg-surface text-ink-2 hover:bg-sunken',
          )}
        >
          {o.label}
          {o.count != null && <span className={cx('tabular rounded-full px-1.5 text-[11px] font-bold', value === o.value ? 'bg-white/20' : 'bg-sunken')}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function CheckFilter({ label, checked, onChange, count, dot }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; count?: number; dot?: ReactNode }) {
  return (
    <label className="flex min-h-[36px] cursor-pointer items-center gap-2.5 text-[14px] text-ink-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-[18px] rounded accent-[#075985]" />
      {dot}
      <span className="flex-1">{label}</span>
      {count != null && <span className="tabular rounded-md bg-sunken px-1.5 text-xs font-semibold text-muted">{count}</span>}
    </label>
  );
}
