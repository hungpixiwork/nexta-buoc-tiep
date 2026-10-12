/**
 * API client.
 *
 * Two ways to be signed in:
 *  - Real session: email one-time code → token for the account's approved role
 *    (partner, volunteer, host_admin, observer, coordinator).
 *  - Demo mode: one signed token per demo role (dev-login). On production it needs
 *    the shared demo access code; the backend marks these tokens `demo`.
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'https://buoc-tiep-api.ppnh10092002.workers.dev';

/** UI roles */
export type Role = 'navigator' | 'partner' | 'coordinator' | 'host' | 'observer' | 'applicant';
export type DemoRole = 'navigator' | 'partner' | 'coordinator';

export const ROLE_LOGIN: Record<DemoRole, { role: string; name: string; email: string; userId: string }> = {
  navigator: { role: 'volunteer', name: 'Hưng · Youth Navigator', email: 'navigator@nexta.vn', userId: 'demo-navigator' },
  partner: { role: 'partner', name: 'Cán bộ tiếp nhận · Đối tác', email: 'partner@nexta.vn', userId: 'demo-partner' },
  coordinator: { role: 'admin', name: 'Điều phối viên Living Lab', email: 'coordinator@nexta.vn', userId: 'demo-coordinator' },
};

/** Backend role → UI role */
export function uiRole(apiRole: string | null | undefined): Role {
  switch ((apiRole ?? '').toLowerCase()) {
    case 'partner':
    case 'partner_staff':
      return 'partner';
    case 'admin':
    case 'coordinator':
    case 'social_worker':
      return 'coordinator';
    case 'host_admin':
      return 'host';
    case 'observer':
      return 'observer';
    case 'volunteer':
      return 'navigator';
    default:
      return 'applicant';
  }
}

export interface Session {
  token: string;
  account: { id: string; email: string; fullName: string | null; role: string; orgId: string | null };
}

const SESSION_KEY = 'nexta_session_v1';
const DEMO_CODE_KEY = 'nexta_demo_code_v1';
const DEMO_TOKEN_KEY = (role: DemoRole) => `nexta_token_${role}_v1`;

function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function put(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — value lives for this page load only */
  }
}

export function readSession(): Session | null {
  const raw = get(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}
export function writeSession(s: Session | null) {
  put(SESSION_KEY, s ? JSON.stringify(s) : null);
}
export function setDemoCode(code: string | null) {
  put(DEMO_CODE_KEY, code);
  for (const r of Object.keys(ROLE_LOGIN) as DemoRole[]) put(DEMO_TOKEN_KEY(r), null);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

/** Fired when production refuses demo sign-in; the shell asks for the demo code. */
export const DEMO_CODE_REQUIRED_EVENT = 'nexta:demo-code-required';

const inflight = new Map<DemoRole, Promise<string>>();

async function demoLogin(role: DemoRole): Promise<string> {
  const existing = inflight.get(role);
  if (existing) return existing;
  const p = (async () => {
    const res = await fetch(`${API_BASE_URL}/api/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ROLE_LOGIN[role], demoCode: get(DEMO_CODE_KEY) ?? undefined }),
    });
    const json = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      if (json.code === 'DEMO_DISABLED') window.dispatchEvent(new CustomEvent(DEMO_CODE_REQUIRED_EVENT));
      throw new ApiError(res.status, json.code ?? 'LOGIN_FAILED', json.error ?? 'Could not sign in');
    }
    put(DEMO_TOKEN_KEY(role), json.token);
    return json.token as string;
  })().finally(() => inflight.delete(role));
  inflight.set(role, p);
  return p;
}

let demoRole: DemoRole = 'navigator';
export function setApiRole(role: DemoRole) {
  demoRole = role;
}

async function currentToken(forceRefresh = false): Promise<string> {
  const s = readSession();
  if (s) return s.token;
  if (!forceRefresh) {
    const cached = get(DEMO_TOKEN_KEY(demoRole));
    if (cached) return cached;
  }
  put(DEMO_TOKEN_KEY(demoRole), null);
  return demoLogin(demoRole);
}

/** Generic JSON call. `auth: false` for public endpoints. */
export async function apiFetch<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const doFetch = async (token?: string) =>
    fetch(`${API_BASE_URL}${path}`, {
      method: init.method ?? 'GET',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  const wantsAuth = init.auth !== false;
  let res = await doFetch(wantsAuth ? await currentToken() : undefined);
  if (res.status === 401 && wantsAuth) {
    if (readSession()) {
      writeSession(null);
      window.dispatchEvent(new CustomEvent('nexta:session-expired'));
    } else {
      res = await doFetch(await currentToken(true));
    }
  }
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new ApiError(res.status, json.code ?? 'ERROR', json.error ?? res.statusText, json);
  return json as T;
}

export const loopFetch = <T>(path: string, init: { method?: string; body?: unknown } = {}) => apiFetch<T>(`/api/v1/loop${path}`, init);
