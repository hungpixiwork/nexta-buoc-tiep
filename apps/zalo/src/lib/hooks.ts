import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CaseListItem, DirectoryResource, Escalation, FollowUp, Journey } from '@web/lib/types';
import { ApiError, loopFetch } from './api';

export const qk = {
  cases: (status: string) => ['cases', status] as const,
  journey: (id: string) => ['journey', id] as const,
  followUps: ['followUps'] as const,
  directory: ['directory'] as const,
  escalations: ['escalations'] as const,
};

export const useCases = (status: 'OPEN' | 'CLOSED' | 'ALL' = 'OPEN') =>
  useQuery({ queryKey: qk.cases(status), queryFn: () => loopFetch<{ cases: CaseListItem[] }>(`/cases?status=${status}`).then((r) => r.cases) });

export const useJourney = (id: string) =>
  useQuery({ queryKey: qk.journey(id), queryFn: () => loopFetch<Journey>(`/cases/${id}`), enabled: Boolean(id) });

/** Lần hỏi thăm chưa ghi, đến hạn trong 2 ngày tới (mặc định của API). */
export const useFollowUps = () =>
  useQuery({ queryKey: qk.followUps, queryFn: () => loopFetch<{ followUps: FollowUp[] }>('/follow-ups').then((r) => r.followUps) });

export const useDirectory = () =>
  useQuery({ queryKey: qk.directory, queryFn: () => loopFetch<{ resources: DirectoryResource[] }>('/directory').then((r) => r.resources) });

export const useEscalations = (enabled = true) =>
  useQuery({
    queryKey: qk.escalations,
    queryFn: () => loopFetch<{ escalations: Escalation[] }>('/escalations?status=OPEN').then((r) => r.escalations),
    enabled,
  });

/**
 * POST/PUT vào `/api/v1/loop…`, xong thì làm mới mọi danh sách.
 * `important`: gửi kèm Idempotency-Key giữ nguyên qua các lần bấm lại, đổi sau khi thành công
 * (chuyển gửi, chốt bước tiếp, khép hành trình…).
 */
export function useLoopMutation<TBody, TResult = unknown>(
  path: string | ((body: TBody) => string),
  opts: { method?: 'POST' | 'PUT'; important?: boolean } = {},
) {
  const qc = useQueryClient();
  const key = useRef<string>(crypto.randomUUID());
  return useMutation<TResult, ApiError, TBody>({
    mutationFn: (body) =>
      loopFetch<TResult>(typeof path === 'function' ? path(body) : path, {
        method: opts.method ?? 'POST',
        body: stripPath(body),
        idempotencyKey: opts.important ? key.current : undefined,
      }),
    onSuccess: () => {
      key.current = crypto.randomUUID();
      return qc.invalidateQueries();
    },
  });
}

/** Body có thể mang id định tuyến bắt đầu bằng "_" — không gửi lên server. */
function stripPath(body: unknown) {
  if (!body || typeof body !== 'object') return body;
  return Object.fromEntries(Object.entries(body as Record<string, unknown>).filter(([k]) => !k.startsWith('_')));
}
