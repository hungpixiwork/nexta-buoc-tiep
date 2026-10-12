import { useMemo } from 'react';
import { useApp } from '../../app/AppContext';
import { useDirectory, useReferrals } from '../../lib/hooks';
import type { DirectoryResource, InboxReferral } from '../../lib/types';

export type PartnerReferral = InboxReferral & {
  ageBand?: 'under_18' | '18_59' | '60_plus' | null;
  district?: string | null;
  goal?: string | null;
  lastQuestion?: { note: string; at: string; by: string } | null;
};

/**
 * "Your services" for the signed-in partner: directory entries owned by the partner's organisation.
 * In demo mode (no organisation) we fall back to the services your referrals point to, so the
 * screens show the same organisation the inbox is working with.
 */
export function usePartnerScope() {
  const { session } = useApp();
  const refs = useReferrals();
  const directory = useDirectory();
  const orgId = session?.account.orgId ?? null;

  const referrals = (refs.data ?? []) as PartnerReferral[];
  const resources: DirectoryResource[] = useMemo(() => {
    const all = directory.data ?? [];
    if (orgId) return all.filter((d) => d.partnerOrgId === orgId);
    const ids = new Set(referrals.map((r) => r.resourceId).filter(Boolean));
    return all.filter((d) => ids.has(d.id));
  }, [directory.data, orgId, referrals]);

  return { referrals, resources, refs, directory, isLoading: refs.isLoading || directory.isLoading, error: refs.error ?? directory.error };
}

export function slotsTotalOf(d: DirectoryResource) {
  return d.availability?.slotsTotal ?? Math.max(d.slotsAvailable ?? 0, 0);
}

export function isAccepting(d: DirectoryResource) {
  return !d.availability?.paused && d.capacityStatus !== 'FULL';
}
