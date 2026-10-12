import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loopFetch, apiFetch, ApiError } from './api';
import type { LoopReport } from '@buoc-tiep/shared';
import type { CaseListItem, DirectoryResource, Escalation, FollowUp, InboxReferral, Journey, LoopMetrics } from './types';

export const qk = {
  cases: (status: string) => ['cases', status] as const,
  journey: (id: string) => ['journey', id] as const,
  referrals: ['referrals'] as const,
  followUps: ['followUps'] as const,
  directory: ['directory'] as const,
  metrics: ['metrics'] as const,
  escalations: ['escalations'] as const,
};

export const useCases = (status: 'OPEN' | 'CLOSED' | 'ALL' = 'OPEN', enabled = true) =>
  useQuery({ queryKey: qk.cases(status), queryFn: () => loopFetch<{ cases: CaseListItem[] }>(`/cases?status=${status}`).then((r) => r.cases), enabled });

export const useJourney = (id: string) =>
  useQuery({ queryKey: qk.journey(id), queryFn: () => loopFetch<Journey>(`/cases/${id}`), enabled: Boolean(id) });

export const useReferrals = (enabled = true) =>
  useQuery({ queryKey: qk.referrals, queryFn: () => loopFetch<{ referrals: InboxReferral[] }>('/referrals').then((r) => r.referrals), refetchInterval: 15_000, enabled });

export const useFollowUps = (enabled = true) =>
  useQuery({ queryKey: qk.followUps, queryFn: () => loopFetch<{ followUps: FollowUp[] }>('/follow-ups').then((r) => r.followUps), enabled });

/** Pending check-ins due before `untilIso` (default: API's 2-day window). */
export const useFollowUpsUntil = (untilIso: string, enabled = true) =>
  useQuery({
    queryKey: [...qk.followUps, 'until', untilIso.slice(0, 13)],
    queryFn: () => loopFetch<{ followUps: FollowUp[] }>(`/follow-ups?until=${encodeURIComponent(untilIso)}`).then((r) => r.followUps),
    enabled,
  });

/** Completed check-ins since `sinceIso` — weekly counts and "last check-in". */
export const useDoneFollowUps = (sinceIso: string, enabled = true) =>
  useQuery({
    queryKey: [...qk.followUps, 'done', sinceIso.slice(0, 10)],
    queryFn: () => loopFetch<{ followUps: FollowUp[] }>(`/follow-ups?status=done&since=${encodeURIComponent(sinceIso)}`).then((r) => r.followUps),
    enabled,
  });

export const useReport = (range: 'week' | 'month', enabled = true) =>
  useQuery({
    queryKey: ['report', range],
    queryFn: () => loopFetch<{ range: string; report: LoopReport; previous: LoopReport; generatedAt: string }>(`/reports?range=${range}`),
    enabled,
  });

export const useDirectory = () =>
  useQuery({ queryKey: qk.directory, queryFn: () => loopFetch<{ resources: DirectoryResource[] }>('/directory').then((r) => r.resources) });

export const useMetrics = () =>
  useQuery({ queryKey: qk.metrics, queryFn: () => loopFetch<{ metrics: LoopMetrics; generatedAt: string }>('/metrics') });

export const useEscalations = (status: 'OPEN' | 'ALL' = 'OPEN', enabled = true) =>
  useQuery({ queryKey: [...qk.escalations, status], queryFn: () => loopFetch<{ escalations: Escalation[] }>(`/escalations?status=${status}`).then((r) => r.escalations), enabled });

/** Mutation against any API path (onboarding, admin…). */
export function useApiMutation<TBody, TResult = unknown>(path: string | ((body: TBody) => string), method: 'POST' | 'PUT' = 'POST', auth = true) {
  const qc = useQueryClient();
  return useMutation<TResult, ApiError, TBody>({
    mutationFn: (body) => apiFetch<TResult>(typeof path === 'function' ? path(body) : path, { method, body: stripPath(body), auth }),
    onSuccess: () => qc.invalidateQueries(),
  });
}

/** POST/PUT helper that refreshes every loop view on success. */
export function useLoopMutation<TBody, TResult = unknown>(path: string | ((body: TBody) => string), method: 'POST' | 'PUT' = 'POST') {
  const qc = useQueryClient();
  return useMutation<TResult, ApiError, TBody>({
    mutationFn: (body) => loopFetch<TResult>(typeof path === 'function' ? path(body) : path, { method, body: stripPath(body) }),
    onSuccess: () => qc.invalidateQueries(),
  });
}

/** Bodies may carry routing ids prefixed with "_" — never send them. */
function stripPath(body: unknown) {
  if (!body || typeof body !== 'object') return body;
  return Object.fromEntries(Object.entries(body as Record<string, unknown>).filter(([k]) => !k.startsWith('_')));
}

export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof TypeError) return fallback;
  return err instanceof Error ? err.message : fallback;
}
