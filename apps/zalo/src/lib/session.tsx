import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { readSession, SESSION_EXPIRED_EVENT, uiRole, writeSession, type Role, type Session } from './api';
import { clearDrafts } from './offline';

interface SessionCtx {
  session: Session | null;
  role: Role | null;
  signIn: (s: Session) => void;
  signOut: () => void;
}

const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(() => readSession());

  const signIn = useCallback(
    (s: Session) => {
      writeSession(s);
      qc.clear();
      setSession(s);
    },
    [qc],
  );

  const signOut = useCallback(() => {
    const userId = readSession()?.account.id;
    // Bản nháp offline gắn với người dùng — đăng xuất thì xóa, máy dùng chung không lộ dữ liệu.
    if (userId) clearDrafts(userId);
    writeSession(null);
    qc.clear();
    setSession(null);
  }, [qc]);

  useEffect(() => {
    const onExpired = () => {
      qc.clear();
      setSession(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [qc]);

  const value = useMemo(() => ({ session, role: session ? uiRole(session.account.role) : null, signIn, signOut }), [session, signIn, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession must be used inside <SessionProvider>');
  return v;
}
