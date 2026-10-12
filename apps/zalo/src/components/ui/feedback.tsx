import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, RefreshCw, Compass } from 'lucide-react';
import { useLang } from '../../lib/i18n';
import { Button } from './button';
import { cx } from './cx';

export type Tone = 'neutral' | 'primary' | 'success' | 'accent' | 'danger';

const BADGE: Record<Tone, string> = {
  neutral: 'bg-surface-soft text-fg',
  primary: 'bg-primary-soft text-primary-ink',
  success: 'bg-success-soft text-success-ink',
  accent: 'bg-accent-soft text-accent-ink',
  danger: 'bg-danger-soft text-danger',
};

export function Badge({ tone = 'neutral', icon, children }: { tone?: Tone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-caption font-medium', BADGE[tone])}>
      {icon}
      {children}
    </span>
  );
}

/** Thông báo trong trang. danger chỉ cho lỗi thật / nguy hiểm; còn lại dùng info/attention dịu. */
export function Alert({ tone = 'info', title, children, onRetry, action }: { tone?: 'info' | 'success' | 'attention' | 'danger'; title?: ReactNode; children?: ReactNode; onRetry?: () => void; action?: ReactNode }) {
  const { tx } = useLang();
  const conf = {
    info: { cls: 'border-primary/30 bg-surface-soft', ink: 'text-primary-ink', icon: <Info className="size-5" strokeWidth={1.75} aria-hidden /> },
    success: { cls: 'border-success bg-success-soft', ink: 'text-success-ink', icon: <CheckCircle2 className="size-5" strokeWidth={1.75} aria-hidden /> },
    attention: { cls: 'border-accent bg-accent-soft', ink: 'text-accent-ink', icon: <Info className="size-5" strokeWidth={1.75} aria-hidden /> },
    danger: { cls: 'border-danger-line bg-danger-soft', ink: 'text-danger', icon: <AlertTriangle className="size-5" strokeWidth={1.75} aria-hidden /> },
  }[tone];
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cx('animate-enter rounded-[var(--radius-control)] border p-3.5', conf.cls)}>
      <div className="flex items-start gap-2.5">
        <span className={cx('mt-0.5 shrink-0', conf.ink)}>{conf.icon}</span>
        <div className="min-w-0 flex-1 text-body text-fg">
          {title && <p className={cx('font-semibold', conf.ink)}>{title}</p>}
          {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
        </div>
      </div>
      {(onRetry || action) && (
        <div className="mt-3 flex flex-wrap gap-2 pl-7">
          {onRetry && (
            <Button variant="secondary" size="sm" icon={<RefreshCw className="size-4" strokeWidth={1.75} />} onClick={onRetry}>
              {tx({ vi: 'Thử lại', en: 'Try again' })}
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}

export function Loading() {
  const { tx } = useLang();
  return (
    <p className="flex items-center justify-center gap-2 py-10 text-fg-2" role="status">
      <Loader2 className="size-5 animate-spin" strokeWidth={1.75} aria-hidden />
      {tx({ vi: 'Đang tải…', en: 'Loading…' })}
    </p>
  );
}

/**
 * Lớp gợi ý của NEXTA — không phải chatbot. Luôn đi kèm 1 hành động cụ thể.
 * `machine`: nội dung do máy sinh → gắn "Gợi ý — chưa xác minh" (luật 4: con người quyết định).
 */
export function NextSuggestion({ title, children, action, machine }: { title: ReactNode; children?: ReactNode; action?: ReactNode; machine?: boolean }) {
  const { tx } = useLang();
  return (
    <div className="animate-enter rounded-[var(--radius-card)] border-l-4 border-primary bg-surface-soft p-4">
      <p className="flex flex-wrap items-center gap-1.5 text-caption font-medium text-primary-ink">
        <Compass className="size-3.5" strokeWidth={2} aria-hidden />
        {tx({ vi: 'NEXTA gợi ý', en: 'NEXTA suggests' })}
        {machine && <span className="text-fg-2">· {tx({ vi: 'Gợi ý — chưa xác minh', en: 'Suggestion — not verified' })}</span>}
      </p>
      <p className="mt-1 text-card font-semibold text-fg">{title}</p>
      {children && <div className="mt-1 text-body text-fg-2">{children}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
