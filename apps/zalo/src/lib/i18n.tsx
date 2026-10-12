/**
 * Ngôn ngữ: tiếng Việt là chính, tiếng Anh bổ sung. Chữ viết tại chỗ dạng `tx({ vi, en })`
 * (giống web); nhãn dùng lại nhiều nơi ở `labels.ts`.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { storage } from './platform';

export type Lang = 'vi' | 'en';
export type Copy = { vi: string; en: string };

const LANG_KEY = 'nexta_zalo_lang_v1';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  tx: (c: Copy) => string;
}

const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (storage.get(LANG_KEY) === 'en' ? 'en' : 'vi'));
  const setLang = useCallback((l: Lang) => {
    storage.set(LANG_KEY, l);
    setLangState(l);
  }, []);
  const tx = useCallback((c: Copy) => c[lang], [lang]);
  const value = useMemo(() => ({ lang, setLang, tx }), [lang, setLang, tx]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLang must be used inside <LangProvider>');
  return v;
}
