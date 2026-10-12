import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cx } from './cx';

/**
 * primary = hành động chính (1 nút/màn) · secondary = phụ · success = xác nhận hoàn thành ·
 * accent = cột mốc/nhắc · ghost = liên kết · danger = chỉ hành động nguy hiểm thật.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'accent' | 'ghost' | 'danger';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-br from-primary to-primary-gradient text-white shadow shadow-highlight',
  secondary: 'bg-highlight text-primary',
  success: 'bg-success text-fg hover:brightness-95 active:brightness-95',
  accent: 'bg-accent text-fg hover:brightness-95 active:brightness-95',
  ghost: 'text-primary active:bg-highlight',
  danger: 'bg-danger text-white hover:brightness-110 active:brightness-110',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  full,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: 'sm' | 'md' | 'lg'; loading?: boolean; icon?: ReactNode; full?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      className={cx(
        'inline-flex select-none items-center justify-center gap-2 rounded-full font-medium transition-[background-color,filter,transform] duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-45',
        size === 'sm' ? 'min-h-[34px] px-3 text-xs' : size === 'lg' ? 'h-12 px-5 text-lg' : 'min-h-[44px] px-4 text-base',
        VARIANT[variant],
        full && 'w-full',
        className,
      )}
    >
      {loading ? <Loader2 className="size-5 animate-spin" strokeWidth={1.75} aria-hidden /> : icon}
      {children}
    </button>
  );
}
