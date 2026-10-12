/**
 * API client cho Zalo Mini App — cùng backend `/api/v1` với web.
 * Đăng nhập: Zalo (đã gắn) → phiên ngay; chưa gắn → mã email kèm link_token để gắn.
 * Phiên lưu trong nativeStorage của Zalo.
 */
import { storage } from './platform';

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'https://buoc-tiep-api.ppnh10092002.workers.dev';

export type Role = 'navigator' | 'partner' | 'coordinator' | 'host' | 'observer' | 'applicant';

/** Vai trò backend → vai trò giao diện (giống web). */
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
    case 'navigator':
      return 'navigator';
    default:
      return 'applicant';
  }
}

export interface Session {
  token: string;
  account: { id: string; email: string; fullName: string | null; role: string; orgId: string | null };
  /** Phiên demo (mã demo) — hiện nhãn "Dùng thử" để không nhầm với dữ liệu thật. */
  demo?: boolean;
  /** Phiên dùng thử: sandbox riêng, dữ liệu chỉ mình người này thấy, không gửi tới đơn vị hỗ trợ thật. */
  trial?: boolean;
}

const SESSION_KEY = 'nexta_zalo_session_v1';
export const SESSION_EXPIRED_EVENT = 'nexta:session-expired';

export function readSession(): Session | null {
  const raw = storage.get(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function writeSession(s: Session | null) {
  storage.set(SESSION_KEY, s ? JSON.stringify(s) : null);
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

/** Gọi JSON. `auth: false` cho endpoint công khai (đăng nhập). */
export async function apiFetch<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean; idempotencyKey?: string } = {}): Promise<T> {
  const session = init.auth === false ? null : readSession();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(init.idempotencyKey ? { 'Idempotency-Key': init.idempotencyKey } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (res.status === 401 && session) {
    writeSession(null);
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new ApiError(res.status, json.code ?? 'ERROR', json.error ?? res.statusText, json);
  return json as T;
}

export const loopFetch = <T>(path: string, init: { method?: string; body?: unknown; idempotencyKey?: string } = {}) =>
  apiFetch<T>(`/api/v1/loop${path}`, init);

// ---------------------------------------------------------------------------
// Đăng nhập
// ---------------------------------------------------------------------------

interface AccountSessionResponse {
  token: string;
  account: Session['account'];
}

export type ZaloSignIn = { linked: true; session: Session } | { linked: false; linkToken: string; zaloName: string | null };

export async function signInWithZalo(accessToken: string): Promise<ZaloSignIn> {
  const r = await apiFetch<
    ({ linked: true } & AccountSessionResponse) | { linked: false; link_token: string; zalo?: { name?: string } }
  >('/api/v1/auth/zalo', { method: 'POST', body: { access_token: accessToken }, auth: false });
  if (r.linked) return { linked: true, session: { token: r.token, account: r.account } };
  return { linked: false, linkToken: r.link_token, zaloName: r.zalo?.name ?? null };
}

export function requestEmailCode(email: string, lang: 'vi' | 'en') {
  return apiFetch<{ sent: boolean; expiresInMinutes: number; devCode?: string }>('/api/v1/auth/otp/request', {
    method: 'POST',
    body: { email, lang },
    auth: false,
  });
}

export async function verifyEmailCode(email: string, code: string, zaloLinkToken?: string | null): Promise<Session & { zaloLinked: boolean }> {
  const r = await apiFetch<AccountSessionResponse & { zaloLinked?: boolean }>('/api/v1/auth/otp/verify', {
    method: 'POST',
    body: { email, code, ...(zaloLinkToken ? { zalo_link_token: zaloLinkToken } : {}) },
    auth: false,
  });
  return { token: r.token, account: r.account, zaloLinked: Boolean(r.zaloLinked) };
}


/** 1 chạm dùng thử: đổi phiên đã đăng nhập sang phiên người đồng hành trong sandbox riêng. */
export async function startTrial(): Promise<Session> {
  const r = await apiFetch<AccountSessionResponse & { trial: true }>('/api/v1/auth/trial', { method: 'POST' });
  return { token: r.token, account: r.account, trial: true };
}

/** Lấy lại phiên theo vai đã được duyệt (sau khi điều phối viên duyệt và học xong bài). */
export async function refreshSession(): Promise<Session> {
  const r = await apiFetch<AccountSessionResponse>('/api/v1/onboarding/session', { method: 'POST' });
  return { token: r.token, account: r.account };
}

// ---------------------------------------------------------------------------
// Đăng ký làm người đồng hành (duyệt trên web W11) + bài học bắt buộc
// ---------------------------------------------------------------------------

export interface Agreement {
  code: string;
  version: string;
  title: { vi: string; en: string };
  summary: { vi: string; en: string };
  sha256: string;
}
export interface Application {
  id: string;
  code: string;
  kind: string;
  status: 'SUBMITTED' | 'SCREENED' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | string;
  decisionNote: string | null;
  slaDueAt: string | null;
  createdAt: string;
}
export interface TrainingModule {
  code: string;
  title: { vi: string; en: string };
  minutes: number;
  points: Array<{ vi: string; en: string }>;
  quiz: Array<{ id: string; prompt: { vi: string; en: string }; options: Array<{ vi: string; en: string }> }>;
}
export interface OnboardingMe {
  account: { role: string };
  volunteer: { status: string; hostOrgId: string | null } | null;
  trainingPassed: string[];
}

export const onboarding = {
  hosts: () => apiFetch<{ hosts: Array<{ id: string; name: string; district: string | null }> }>('/api/v1/onboarding/hosts', { auth: false }).then((r) => r.hosts),
  agreements: () => apiFetch<{ agreements: Agreement[] }>('/api/v1/onboarding/agreements', { auth: false }).then((r) => r.agreements),
  agreementBody: (code: string) => apiFetch<{ agreement: { body: string } }>(`/api/v1/onboarding/agreements/${code}`, { auth: false }).then((r) => r.agreement.body),
  myApplications: () => apiFetch<{ applications: Application[] }>('/api/v1/onboarding/applications/me').then((r) => r.applications),
  me: () => apiFetch<OnboardingMe>('/api/v1/onboarding/me'),
  submit: (body: unknown) => apiFetch<{ application: Application }>('/api/v1/onboarding/applications', { method: 'POST', body }),
  training: () => apiFetch<{ modules: TrainingModule[] }>('/api/v1/onboarding/training', { auth: false }).then((r) => r.modules),
  answer: (code: string, answers: number[]) => apiFetch<{ passed: boolean; score: number; activated: boolean }>(`/api/v1/onboarding/training/${code}`, { method: 'POST', body: { answers } }),
};
