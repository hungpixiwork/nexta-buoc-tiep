import type { ReactNode } from 'react';
import { Sheet as ZSheet } from 'zmp-ui';
import { useSetCustomTitle } from '../../lib/title';
import { cx } from './cx';

/** Logo chữ NEXTA — không dùng ảnh để gói build nhẹ và nét ở mọi mật độ điểm ảnh. */
export function BrandMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className={cx('relative grid place-items-center rounded-xl bg-primary-soft', size === 'lg' ? 'size-12' : 'size-8')}>
        <span className={cx('absolute rounded-full bg-primary', size === 'lg' ? 'bottom-3 left-3 size-2.5' : 'bottom-2 left-2 size-1.5')} />
        <span className={cx('absolute rounded-full bg-primary-strong', size === 'lg' ? 'right-3 top-3 size-3.5' : 'right-2 top-2 size-2.5')} />
      </span>
      <span className={cx('font-semibold tracking-tight text-fg', size === 'lg' ? 'text-display' : 'text-card')}>NEXTA</span>
    </span>
  );
}

/**
 * Tiêu đề trang nằm ở Header chung kiểu zaui-doctor (theo `handle` của route).
 * Component này chỉ đẩy tiêu đề tuỳ biến (VD tên người trong Hành trình) và phần `right` (nếu có) xuống đầu trang.
 */
export function PageHeader({ title, back, right }: { title: string; subtitle?: string; back?: boolean; right?: ReactNode; variant?: 'logo' | 'back' | 'title' }) {
  useSetCustomTitle(back ? title : undefined);
  return right ? <div className="flex justify-end px-4 pt-2">{right}</div> : null;
}

/** Nội dung trang: lề 16px, khoảng cách đều, hiện dần 200ms. */
export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('mx-auto w-full max-w-[640px] space-y-3 px-4 pb-6 pt-3', className)}>{children}</div>;
}

/** Bảng trượt từ đáy (zmp-ui Sheet) — cho menu gọi hỗ trợ và xác nhận. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return (
    <ZSheet visible={open} onClose={onClose} autoHeight mask handler swipeToClose title={title} unmountOnClose>
      <div className="max-h-[75vh] overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">{children}</div>
    </ZSheet>
  );
}

/** Lưới lối tắt kiểu ZaUI: ô icon nền xanh nhạt + nhãn ngắn. */
export function ShortcutGrid({ items }: { items: Array<{ key: string; label: string; icon: ReactNode; onClick: () => void; tone?: 'primary' | 'accent' }> }) {
  return (
    <div className="grid grid-cols-4 gap-2 rounded-[var(--radius-card)] border border-line bg-surface px-2 py-3 shadow-soft">
      {items.map((it) => (
        <button key={it.key} type="button" onClick={it.onClick} className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl py-1 transition-colors duration-200 active:bg-surface-soft">
          <span className={cx('grid size-12 place-items-center rounded-[14px]', it.tone === 'accent' ? 'bg-accent-soft text-accent-ink' : 'bg-primary-soft text-primary-ink')}>{it.icon}</span>
          <span className="w-full truncate px-0.5 text-center text-caption font-medium text-fg">{it.label}</span>
        </button>
      ))}
    </div>
  );
}
