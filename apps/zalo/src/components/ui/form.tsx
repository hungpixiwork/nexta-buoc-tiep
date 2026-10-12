import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cx } from './cx';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-small font-medium text-fg">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-caption text-fg-2">{hint}</span>}
    </label>
  );
}

const inputCls =
  'w-full rounded-[var(--radius-control)] border border-line bg-surface px-3.5 text-[16px] text-fg placeholder:text-fg-2 transition-[border-color,box-shadow] duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/25 read-only:bg-surface-soft';

export const TextInput = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(inputCls, 'min-h-[46px]', p.className)} />;
export const TextArea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cx(inputCls, 'min-h-[92px] py-3', p.className)} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(inputCls, 'min-h-[46px] appearance-none bg-[length:0]', p.className)} />;

/** Ô tích cả dòng — dễ bấm một tay; khi chọn: viền xanh + nền ice, dấu check hiện dần. */
export function CheckRow({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode }) {
  return (
    <label
      className={cx(
        'flex min-h-[56px] cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border p-3.5 transition-colors duration-200',
        checked ? 'border-primary bg-surface-soft' : 'border-line bg-surface',
      )}
    >
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className={cx(
          'mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 transition-colors duration-200 peer-focus-visible:ring-4 peer-focus-visible:ring-primary/30',
          checked ? 'border-primary-strong bg-primary-strong text-white' : 'border-line-strong bg-surface',
        )}
      >
        <Check className={cx('size-4 transition-opacity duration-200', checked ? 'opacity-100' : 'opacity-0')} strokeWidth={2.5} />
      </span>
      <span className="min-w-0 text-body text-fg">
        <span className="block font-medium">{label}</span>
        {description && <span className="mt-0.5 block text-small text-fg-2">{description}</span>}
      </span>
    </label>
  );
}

export function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        'min-h-[40px] shrink-0 whitespace-nowrap rounded-full border px-4 text-small font-medium transition-colors duration-200',
        selected ? 'border-primary bg-primary-soft text-primary-ink' : 'border-line bg-surface text-fg',
      )}
    >
      {children}
    </button>
  );
}

/** Ô tìm kiếm dạng viên thuốc (kiểu ZaUI). */
export function SearchBar({ value, onChange, placeholder, icon }: { value: string; onChange: (v: string) => void; placeholder: string; icon: ReactNode }) {
  return (
    <label className="flex min-h-[48px] items-center gap-2 rounded-full border border-line bg-surface pl-4 pr-3 shadow-soft transition-[border-color,box-shadow] duration-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/25">
      <span className="text-fg-2">{icon}</span>
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="min-w-0 flex-1 bg-transparent text-[16px] text-fg placeholder:text-fg-2 focus:outline-none" />
    </label>
  );
}
