import type { ReactNode } from 'react';
import { ChevronRight, Inbox } from 'lucide-react';
import { cx } from './cx';

/** Card sáng, viền mảnh, bóng rất nhẹ. `soft` = nền ice sky (khối gợi ý, nhóm phụ). */
export function Card({ children, className, variant = 'default', as: Tag = 'section' }: { children: ReactNode; className?: string; variant?: 'default' | 'soft'; as?: 'section' | 'div' | 'li' }) {
  return (
    <Tag
      className={cx(
        'rounded-xl p-4',
        variant === 'soft' ? 'bg-highlight' : 'bg-white',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Tiêu đề mục trong trang: 1 dòng, không viết hoa toàn bộ. */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 pt-2">
      <h2 className="text-section font-semibold text-fg">{children}</h2>
      {action}
    </div>
  );
}

/** Dòng chạm được trong danh sách — nội dung trái, chevron phải. */
export function ListRow({ onClick, leading, title, subtitle, trailing, className }: { onClick?: () => void; leading?: ReactNode; title: ReactNode; subtitle?: ReactNode; trailing?: ReactNode; className?: string }) {
  const body = (
    <>
      {leading && <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-highlight text-primary">{leading}</span>}
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-card font-semibold text-fg">{title}</span>
        {subtitle && <span className="mt-0.5 block text-small text-fg-2">{subtitle}</span>}
      </span>
      {trailing ?? (onClick && <ChevronRight className="size-5 shrink-0 text-fg-2" strokeWidth={1.75} aria-hidden />)}
    </>
  );
  const cls = cx('flex min-h-[60px] w-full items-center gap-3 px-4 py-3', className);
  return onClick ? (
    <button type="button" onClick={onClick} className={cx(cls, 'transition-colors duration-200 active:bg-surface-soft')}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Nhóm các ListRow trong 1 card, có đường kẻ mảnh giữa các dòng. */
export function ListGroup({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-black/5 overflow-hidden rounded-xl bg-white">{children}</div>;
}

export function EmptyState({ title, children, icon, action }: { title: string; children?: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-white px-5 py-8 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-primary-ink">{icon ?? <Inbox className="size-7" strokeWidth={1.75} aria-hidden />}</span>
      <p className="mt-3 text-card font-semibold text-fg">{title}</p>
      {children && <div className="mt-1 max-w-[32ch] text-small text-fg-2">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
