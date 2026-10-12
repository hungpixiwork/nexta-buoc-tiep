import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { STRINGS, type Strings } from './strings';
import { readSession, setApiRole, uiRole, writeSession, type DemoRole, type Role, type Session } from '../lib/api';

export type Lang = 'vi' | 'en';

interface AppState {
  /** Effective UI role: from the real session if signed in, else the demo role */
  role: Role;
  /** Demo role switcher (only meaningful without a real session) */
  setRole: (role: DemoRole) => void;
  session: Session | null;
  signIn: (s: Session) => void;
  signOut: () => void;
  isDemo: boolean;
  lang: Lang;
  setLang: (lang: Lang) => void;
  s: Strings;
  /** Inline bilingual copy for page-specific text */
  tx: (copy: { vi: string; en: string }) => string;
}

const Ctx = createContext<AppState | null>(null);

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore — preference just won't persist */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [demoRole, setDemoRole] = useState<DemoRole>(() => {
    const r = read<DemoRole>('nexta_role', ['navigator', 'partner', 'coordinator'], 'navigator');
    setApiRole(r);
    return r;
  });
  const [session, setSession] = useState<Session | null>(() => readSession());
  const [lang, setLangState] = useState<Lang>(() => read<Lang>('nexta_lang', ['vi', 'en'], 'vi'));

  useEffect(() => {
    const onExpired = () => setSession(null);
    window.addEventListener('nexta:session-expired', onExpired);
    return () => window.removeEventListener('nexta:session-expired', onExpired);
  }, []);

  const setRole = useCallback(
    (r: DemoRole) => {
      setApiRole(r);
      setDemoRole(r);
      write('nexta_role', r);
      qc.invalidateQueries();
    },
    [qc],
  );

  const signIn = useCallback(
    (s: Session) => {
      writeSession(s);
      setSession(s);
      qc.invalidateQueries();
    },
    [qc],
  );

  const signOut = useCallback(() => {
    writeSession(null);
    setSession(null);
    qc.clear();
  }, [qc]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    write('nexta_lang', l);
    document.documentElement.lang = l;
  }, []);

  const value = useMemo<AppState>(
    () => ({
      role: session ? uiRole(session.account.role) : demoRole,
      setRole,
      session,
      signIn,
      signOut,
      isDemo: !session,
      lang,
      setLang,
      s: STRINGS[lang],
      tx: (copy) => copy[lang],
    }),
    [demoRole, setRole, session, signIn, signOut, lang, setLang],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}
