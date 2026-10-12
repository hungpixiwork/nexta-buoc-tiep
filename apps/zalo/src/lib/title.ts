import { useEffect, useSyncExternalStore } from 'react';

/** Tiêu đề tuỳ biến cho trang có handle.title = 'custom' (VD tên người trong Hành trình). */
let title = '';
const subs = new Set<() => void>();
export function setCustomTitle(t: string) {
  title = t;
  subs.forEach((f) => f());
}
export const useCustomTitle = () => useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), () => title);
export function useSetCustomTitle(t: string | undefined) {
  useEffect(() => {
    if (t) setCustomTitle(t);
  }, [t]);
}
