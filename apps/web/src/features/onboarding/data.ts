import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';

export type AppKind = 'PARTNER' | 'VOLUNTEER' | 'HOST' | 'OBSERVER';
export type AppStatus = 'SUBMITTED' | 'SCREENED' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface AgreementMeta {
  code: string;
  version: string;
  title: { vi: string; en: string };
  summary: { vi: string; en: string };
  sha256: string;
}

export interface ScreeningCheck {
  code: string;
  result: 'PASS' | 'WARN' | 'FAIL';
  hard?: boolean;
  evidence?: string;
}

export interface Application {
  id: string;
  code: string;
  kind: AppKind;
  email: string;
  hostOrgId: string | null;
  status: AppStatus;
  screening: { checks: ScreeningCheck[]; score: number; recommendation: 'FAST_REVIEW' | 'REVIEW' | 'HIGH_RISK'; missingInfo: string[] } | null;
  score: number | null;
  recommendation: 'FAST_REVIEW' | 'REVIEW' | 'HIGH_RISK' | null;
  reviewerName: string | null;
  decisionNote: string | null;
  decidedAt: string | null;
  slaDueAt: string;
  createdAt: string;
  displayName?: string;
  payload?: Record<string, any>;
}

export interface TrainingModule {
  code: string;
  version: string;
  title: { vi: string; en: string };
  minutes: number;
  points: Array<{ vi: string; en: string }>;
  quiz: Array<{ id: string; prompt: { vi: string; en: string }; options: Array<{ vi: string; en: string }> }>;
}

export const REQUIRED: Record<AppKind, string[]> = {
  PARTNER: ['TERMS', 'PRIVACY_NOTICE', 'PARTNER_MOU', 'DATA_SHARING', 'SAFEGUARDING_POLICY'],
  VOLUNTEER: ['TERMS', 'PRIVACY_NOTICE', 'VOLUNTEER_AGREEMENT', 'CODE_OF_CONDUCT', 'SAFEGUARDING_POLICY'],
  HOST: ['TERMS', 'PRIVACY_NOTICE', 'HOST_DPA', 'SAFEGUARDING_POLICY'],
  OBSERVER: ['TERMS', 'PRIVACY_NOTICE', 'OBSERVER_TERMS'],
};

export const useAgreements = () =>
  useQuery({ queryKey: ['agreements'], queryFn: () => apiFetch<{ agreements: AgreementMeta[] }>('/api/v1/onboarding/agreements', { auth: false }).then((r) => r.agreements), staleTime: 3_600_000 });

export const useAgreement = (code: string) =>
  useQuery({
    queryKey: ['agreement', code],
    queryFn: () => apiFetch<{ agreement: AgreementMeta & { body: string } }>(`/api/v1/onboarding/agreements/${code}`, { auth: false }).then((r) => r.agreement),
    enabled: Boolean(code),
    staleTime: 3_600_000,
  });

export const useHosts = () =>
  useQuery({ queryKey: ['hosts'], queryFn: () => apiFetch<{ hosts: Array<{ id: string; name: string; district: string }> }>('/api/v1/onboarding/hosts', { auth: false }).then((r) => r.hosts) });

export const useTrainingModules = () =>
  useQuery({ queryKey: ['training'], queryFn: () => apiFetch<{ modules: TrainingModule[] }>('/api/v1/onboarding/training', { auth: false }).then((r) => r.modules), staleTime: 3_600_000 });

export interface Me {
  account: { id: string; email: string; fullName?: string | null; role: string; status?: string; demo?: boolean };
  org: { id: string; kind: string; name: string; status: string } | null;
  volunteer: { status: string; hostOrgId: string | null } | null;
  trainingPassed: string[];
}
export const useMe = (enabled = true) => useQuery({ queryKey: ['me'], queryFn: () => apiFetch<Me>('/api/v1/onboarding/me'), enabled });

export const useMyApplications = (enabled = true) =>
  useQuery({ queryKey: ['myApplications'], queryFn: () => apiFetch<{ applications: Application[] }>('/api/v1/onboarding/applications/me').then((r) => r.applications), enabled });

export const useAdminApplications = (kind?: string) =>
  useQuery({
    queryKey: ['adminApplications', kind ?? 'ALL'],
    queryFn: () => apiFetch<{ applications: Application[] }>(`/api/v1/admin/applications${kind ? `?kind=${kind}` : ''}`).then((r) => r.applications),
    refetchInterval: 30_000,
  });

export interface ApplicationDetail {
  application: Application;
  events: Array<{ fromStatus: string | null; toStatus: string; actorName: string | null; note: string | null; createdAt: string }>;
  acceptances: Array<{ code: string; version: string; signerName: string; signerTitle: string | null; acceptedAt: string }>;
}
export const useAdminApplication = (id: string | null) =>
  useQuery({ queryKey: ['adminApplication', id], queryFn: () => apiFetch<ApplicationDetail>(`/api/v1/admin/applications/${id}`), enabled: Boolean(id) });

export interface LedgerEntry {
  id: string;
  month: string;
  direction: 'IN' | 'OUT';
  category: string;
  amountVnd: number;
  counterparty: string | null;
  evidenceRef: string | null;
  note: string | null;
  recordedByName: string | null;
  createdAt: string;
}
export const useLedger = () => useQuery({ queryKey: ['ledger'], queryFn: () => apiFetch<{ entries: LedgerEntry[] }>('/api/v1/admin/ledger').then((r) => r.entries) });

export interface Transparency {
  ledger: Array<{ month: string; direction: 'IN' | 'OUT'; category: string; totalVnd: number }>;
  totals: { inVnd: number; outVnd: number; balanceVnd: number };
  costPerSafeNextStepVnd: number | null;
  journeysClosedLoop: number;
  safeNextStepRate: number;
  activeOrgs: Record<string, number>;
  activeNavigators: number;
  generatedAt: string;
}
export const useTransparency = () => useQuery({ queryKey: ['transparency'], queryFn: () => apiFetch<Transparency>('/api/v1/onboarding/transparency', { auth: false }) });

export interface PrivacyRequest {
  id: string;
  kind: string;
  email: string | null;
  caseAlias: string | null;
  details: string;
  status: 'OPEN' | 'RESOLVED';
  resolution: string | null;
  dueAt: string;
  resolvedAt: string | null;
  createdAt: string;
}
export const usePrivacyRequests = (enabled = true) =>
  useQuery({ queryKey: ['privacyRequests'], queryFn: () => apiFetch<{ requests: PrivacyRequest[] }>('/api/v1/admin/privacy/requests').then((r) => r.requests), enabled });

export const fmtVnd = (n: number, lang: 'vi' | 'en') => `${n.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB')} ₫`;
