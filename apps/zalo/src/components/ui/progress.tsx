import { Check } from 'lucide-react';
import { useLang, type Copy } from '../../lib/i18n';
import { cx } from './cx';

/**
 * Tiến trình theo bước — nói bằng lời "Bạn đã xong 3/6 bước", không phải "62%".
 * `current` tính từ 1; `done` = mọi bước đã xong (hành trình khép lại).
 */
export function StepProgress({ steps, current, done, nextLabel }: { steps: Copy[]; current: number; done?: boolean; nextLabel?: string }) {
  const { tx } = useLang();
  const finished = done ? steps.length : Math.max(0, current - 1);
  const pct = (finished / steps.length) * 100;
  return (
    <div className="rounded-xl bg-white p-4">
      <p className="text-card font-semibold text-fg">
        {done
          ? tx({ vi: 'Đã đi trọn hành trình', en: 'Journey completed' })
          : tx({ vi: `Bạn đã xong ${finished}/${steps.length} bước`, en: `You've completed ${finished} of ${steps.length} steps` })}
      </p>
      {!done && nextLabel && (
        <p className="text-small text-fg-2">
          {tx({ vi: 'Bước tiếp theo:', en: 'Next step:' })} <span className="font-medium text-primary-ink">{nextLabel}</span>
        </p>
      )}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-soft" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={finished}>
        <div className="h-full rounded-full bg-sky transition-[width] duration-200 ease-[var(--ease-calm)]" style={{ width: `${pct}%` }} />
      </div>
      <ol className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => {
          const n = i + 1;
          const isDone = done || n < current;
          const isNow = !done && n === current;
          return (
            <li key={s.vi} className="flex flex-col items-center text-center">
              <span
                className={cx(
                  'grid size-6 place-items-center rounded-full text-caption font-semibold transition-colors duration-200',
                  isDone ? 'bg-success text-fg' : isNow ? 'bg-primary-strong text-white' : 'bg-surface-soft text-fg-2',
                )}
              >
                {isDone ? <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> : n}
              </span>
              <span className={cx('mt-1 w-full truncate text-[11px] leading-tight', isNow ? 'font-semibold text-primary-ink' : 'text-fg-2')}>{tx(s)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Thanh bước gọn cho form nhiều phần: "Bước 1/3 · Gọi họ là gì". */
export function MiniSteps({ total, current, label }: { total: number; current: number; label: string }) {
  const { tx } = useLang();
  return (
    <div>
      <p className="text-small text-fg-2">
        {tx({ vi: `Bước ${current}/${total}`, en: `Step ${current} of ${total}` })} · <span className="font-medium text-fg">{label}</span>
      </p>
      <div className="mt-2 flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cx('h-1.5 flex-1 rounded-full transition-colors duration-200', i < current ? 'bg-sky' : 'bg-line')} />
        ))}
      </div>
    </div>
  );
}
