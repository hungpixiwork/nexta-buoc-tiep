/**
 * NEXTA UI primitives. Tokens live in src/styles.css (@theme).
 * Touch targets ≥ 44px, visible focus, no blur/glass.
 */
import { forwardRef, useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { AlertTriangle, Loader2, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'step' | 'secondary' | 'ghost' | 'danger';
const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-strong border border-brand',
  step: 'bg-step text-white hover:bg-step-strong border border-step',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-sunken',
  ghost: 'bg-transparent text-brand-strong border border-transparent hover:bg-brand-soft',
  danger: 'bg-danger text-white hover:bg-danger-strong border border-danger',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'md' | 'lg' | 'sm';
  loading?: boolean;
  icon?: ReactNode;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, block, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cx(
        'press inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-60 whitespace-nowrap',
        size === 'lg' && 'min-h-[52px] px-5 text-base',
        size === 'md' && 'min-h-[44px] px-4 text-[15px]',
        size === 'sm' && 'min-h-[36px] px-3 text-sm',
        block && 'w-full',
        BUTTON_VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

// ---------------------------------------------------------------------------
// Surfaces & text
// ---------------------------------------------------------------------------

export function Card({ className, children, as: As = 'section' }: { className?: string; children: ReactNode; as?: 'section' | 'div' | 'article' | 'li' }) {
  return <As className={cx('card', className)}>{children}</As>;
}

// ---------------------------------------------------------------------------
// Super-app home building blocks (brand band, search pill, service grid, carousel)
// ---------------------------------------------------------------------------

/** Curved brand header that bleeds to the screen edges on mobile. */
export function HeroBand({ eyebrow, title, description, children }: { eyebrow?: ReactNode; title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <section className="hero-band relative -mx-4 -mt-6 mb-6 rounded-b-[32px] px-4 pb-6 pt-6 lg:mx-0 lg:mt-0 lg:rounded-[28px] lg:px-8 lg:pb-8 lg:pt-8">
      {eyebrow && <p className="text-sm font-semibold text-brand-soft">{eyebrow}</p>}
      <h1 className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight md:text-[32px]">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-brand-soft">{description}</p>}
      {children && <div className="mt-5 space-y-4">{children}</div>}
    </section>
  );
}

/** Tappable search field that routes to a search screen (Grab-style). */
export function SearchPill({ to, placeholder, action }: { to: string; placeholder: string; action?: string }) {
  return (
    <Link to={to} className="press flex min-h-[52px] max-w-2xl items-center gap-3 rounded-full bg-surface py-1.5 pl-4 pr-1.5 text-ink shadow-[var(--shadow-raised)]">
      <Search className="size-5 shrink-0 text-brand" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-muted">{placeholder}</span>
      {action && <span className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white">{action}</span>}
    </Link>
  );
}

const TILE_TONE: Record<Tone, string> = {
  neutral: 'bg-sunken text-ink-2',
  brand: 'bg-brand-soft text-brand-strong',
  step: 'bg-step-soft text-step',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger text-white',
  ai: 'bg-ai-soft text-ai',
};

export function ServiceGrid({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul aria-label={label} className="grid grid-cols-4 gap-x-1 gap-y-3 sm:gap-x-3 lg:grid-cols-8">
      {children}
    </ul>
  );
}

/** One icon tile in a ServiceGrid. Use `to` for in-app routes, `href` for tel:/external links. */
export function ServiceTile({ icon, label, to, href, tone = 'brand', badge }: { icon: ReactNode; label: string; to?: string; href?: string; tone?: Tone; badge?: number }) {
  const body = (
    <>
      <span className={cx('relative grid size-14 place-items-center rounded-[var(--radius-tile)]', TILE_TONE[tone])}>
        {icon}
        {Boolean(badge) && <span className="tabular absolute -right-1.5 -top-1.5 min-w-[22px] rounded-full border-2 border-surface bg-danger px-1 text-center text-xs font-bold leading-[18px] text-white">{badge}</span>}
      </span>
      <span className={cx('line-clamp-2 text-[13px] font-semibold leading-tight', tone === 'danger' ? 'text-danger' : 'text-ink')}>{label}</span>
    </>
  );
  const cls = 'press flex h-full flex-col items-center gap-1.5 rounded-2xl p-1.5 text-center hover:bg-sunken';
  return <li>{to ? <Link to={to} className={cls}>{body}</Link> : <a href={href} className={cls}>{body}</a>}</li>;
}

/** Horizontal snap carousel on mobile, a plain grid from lg up. */
export function HighlightCarousel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="region" aria-label={label} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
      {children}
    </div>
  );
}

export function HighlightCard({ tone = 'neutral', icon, title, children, action }: { tone?: Tone; icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  const solid = tone === 'step' || tone === 'brand';
  return (
    <article
      className={cx(
        'flex w-[82%] shrink-0 snap-start flex-col rounded-[var(--radius-card)] p-5 sm:w-[55%] lg:w-auto',
        solid ? (tone === 'step' ? 'bg-step text-white' : 'bg-brand text-white') : cx('border', TONE[tone]),
      )}
    >
      {icon && <span className={cx('mb-3 grid size-10 place-items-center rounded-full', solid ? 'bg-white/15 text-white' : 'bg-surface')}>{icon}</span>}
      <h3 className="text-[17px] font-bold leading-snug">{title}</h3>
      {children && <div className={cx('mt-1 text-[15px] leading-relaxed', solid ? 'text-white' : 'text-ink-2')}>{children}</div>}
      {action && <div className="mt-auto pt-4">{action}</div>}
    </article>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-wide text-brand">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink md:text-[28px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ children, hint, action }: { children: ReactNode; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-ink">{children}</h2>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export type Tone = 'neutral' | 'brand' | 'step' | 'warn' | 'danger' | 'ai';
const TONE: Record<Tone, string> = {
  neutral: 'bg-sunken text-ink-2 border-line',
  brand: 'bg-brand-soft text-brand-strong border-brand-line',
  step: 'bg-step-soft text-step border-step-line',
  warn: 'bg-warn-soft text-warn border-warn-line',
  danger: 'bg-danger-soft text-danger border-danger-line',
  ai: 'bg-ai-soft text-ai border-ai-line',
};

export function Badge({ tone = 'neutral', icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-[13px] font-semibold leading-5', TONE[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

export function Stat({ label, value, hint, tone = 'neutral', emphasis }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone; emphasis?: boolean }) {
  return (
    <div className={cx('card p-4', emphasis && 'border-step-line bg-step-soft')}>
      <p className={cx('text-sm font-medium', emphasis ? 'text-step' : 'text-muted')}>{label}</p>
      <p className={cx('tabular mt-1 font-bold tracking-tight', emphasis ? 'text-4xl text-step' : 'text-3xl text-ink')}>{value}</p>
      {hint && <p className={cx('mt-1 text-sm', tone === 'danger' ? 'text-danger' : emphasis ? 'text-step' : 'text-muted')}>{hint}</p>}
    </div>
  );
}

export function EmptyState({ icon, title, children, action, imageSrc, imageAlt }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode; imageSrc?: string; imageAlt?: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
      {imageSrc && <img src={imageSrc} alt={imageAlt ?? ''} className="mb-4 h-36 w-full max-w-xs object-contain" loading="lazy" decoding="async" />}
      {icon && <div className="mb-3 grid size-12 place-items-center rounded-full bg-sunken text-brand">{icon}</div>}
      <p className="font-semibold text-ink">{title}</p>
      {children && <p className="mt-1 max-w-md text-sm text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center gap-2 py-8 text-muted">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBanner({ title, message, onRetry, retryLabel }: { title: string; message: string; onRetry?: () => void; retryLabel?: string }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger-line bg-danger-soft p-4 text-danger">
      <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm">{message}</p>
      </div>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form controls
// ---------------------------------------------------------------------------

export function Field({ label, hint, error, children, htmlFor, optionalLabel }: { label: string; hint?: ReactNode; error?: string; children: ReactNode; htmlFor?: string; optionalLabel?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[15px] font-semibold text-ink">
        {label}
        {optionalLabel && <span className="ml-1 font-normal text-muted">({optionalLabel})</span>}
      </label>
      {hint && <p className="-mt-0.5 text-sm text-muted">{hint}</p>}
      {children}
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}

const inputBase =
  'w-full rounded-xl border border-line-strong bg-surface px-3.5 text-[15px] text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-line';

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput({ className, ...rest }, ref) {
  return <input ref={ref} className={cx(inputBase, 'min-h-[44px]', className)} {...rest} />;
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cx(inputBase, 'min-h-[112px] py-3 leading-relaxed', className)} {...rest} />;
});

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(inputBase, 'min-h-[44px] pr-8', className)} {...rest}>
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label, description, icon }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; icon?: ReactNode }) {
  const id = useId();
  return (
    <label htmlFor={id} className={cx('flex min-h-[56px] items-start gap-3 rounded-xl border p-3.5 transition-colors', checked ? 'border-brand-line bg-brand-soft' : 'border-line bg-surface hover:bg-sunken')}>
      {icon && <span className={cx('mt-0.5 shrink-0', checked ? 'text-brand-strong' : 'text-muted')}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">{label}</span>
        {description && <span className="block text-sm text-muted">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span aria-hidden className={cx('h-7 w-12 rounded-full border-2 transition-colors peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-brand', checked ? 'border-brand bg-brand' : 'border-line-strong bg-sunken')} />
        <span aria-hidden className={cx('absolute top-1 size-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
      </span>
    </label>
  );
}

export function Chip({ selected, onClick, children, icon }: { selected?: boolean; onClick?: () => void; children: ReactNode; icon?: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        'inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 text-[15px] font-medium transition-colors',
        selected ? 'border-brand bg-brand text-white' : 'border-line-strong bg-surface text-ink-2 hover:bg-sunken',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Dialog (solid overlay — no blur)
// ---------------------------------------------------------------------------

export function Dialog({ open, onClose, title, children, footer, closeLabel }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; closeLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgb(15_23_42/0.55)] p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-surface shadow-[var(--shadow-raised)] sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label={closeLabel} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-sunken">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="card animate-pulse p-5 space-y-3">
      <div className="h-5 w-2/3 rounded-full bg-sunken" />
      <div className="h-3 w-full rounded-full bg-sunken" />
      {Array.from({ length: Math.max(1, rows - 1) }).map((_, i) => (
        <div key={i} className="h-3 rounded-full bg-sunken" style={{ width: `${65 + ((i * 17) % 30)}%` }} />
      ))}
      <div className="pt-2 flex justify-between items-center">
        <div className="h-6 w-20 rounded-full bg-sunken" />
        <div className="h-8 w-24 rounded-xl bg-sunken" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  const colClass = cols === 2 ? 'sm:grid-cols-2' : cols === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';
  return (
    <div className={`grid gap-4 ${colClass}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
