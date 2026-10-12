import type { Lang } from '../app/AppContext';

const locale = (lang: Lang) => (lang === 'vi' ? 'vi-VN' : 'en-GB');

export function fmtDate(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(locale(lang), { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function fmtDateTime(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleTimeString(locale(lang), { hour: '2-digit', minute: '2-digit' })} · ${d.toLocaleDateString(locale(lang), { day: '2-digit', month: '2-digit' })}`;
}

/** "in 2 days" / "3 days ago" style relative label */
export function fmtRelative(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return '';
  const diff = new Date(iso).getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: 'auto' });
  const abs = Math.abs(diff);
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), 'minute');
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), 'hour');
  return rtf.format(Math.round(diff / 86_400_000), 'day');
}

export function isOverdue(iso: string | null | undefined): boolean {
  return Boolean(iso) && new Date(iso as string).getTime() < Date.now();
}

/** Value for <input type="datetime-local"> from an ISO string */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
