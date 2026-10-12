/**
 * Campaign Detail — Full campaign info, participants, missions, QR generation.
 */
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, MapPin, Users, QrCode, CheckCircle2, XCircle, ArrowRight, FileText } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { errorText } from '../../app/errors';
import { apiFetch } from '../../lib/api';
import { Badge, Button, Card, Spinner, ErrorBanner, PageHeader, cx } from '../../design/ui';

interface CampaignDetail {
  campaign: any;
  capacity: { total: number; filled: number; available: number; percentage: number; isFull: boolean };
  slots: any[];
  participants: any[];
  missions: any[];
}

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tx, lang, s, role } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const detail = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => apiFetch<CampaignDetail>(`/api/v1/campaigns/${id}`),
    enabled: Boolean(id),
  });

  const joinMutation = useMutation({
    mutationFn: () => apiFetch<{ slotId: string; missionId: string }>(`/api/v1/campaigns/${id}/join`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign', id] }),
  });

  const publishMutation = useMutation({
    mutationFn: () => apiFetch(`/api/v1/campaigns/${id}/publish`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign', id] }),
  });

  const completeMutation = useMutation({
    mutationFn: () => apiFetch(`/api/v1/campaigns/${id}/complete`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign', id] }),
  });

  if (detail.isLoading) return <Spinner label={s.common.loading} />;
  if (detail.error) return <ErrorBanner title={s.common.errorTitle} message={errorText(detail.error, lang)} onRetry={() => detail.refetch()} retryLabel={s.common.retry} />;
  if (!detail.data) return null;

  const { campaign, capacity, slots, participants, missions } = detail.data;
  const isPartner = role === 'partner' || role === 'coordinator';
  const dateStr = new Date(campaign.startsAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <>
      <Link to="/campaigns" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
        <ArrowLeft className="size-4" /> {tx({ vi: 'Quay lại', en: 'Back' })}
      </Link>

      <PageHeader
        eyebrow={campaign.orgName ?? campaign.category}
        title={campaign.title}
        description={campaign.description}
        actions={
          <div className="flex flex-wrap gap-2">
            {campaign.status === 'DRAFT' && isPartner && (
              <Button variant="primary" loading={publishMutation.isPending} onClick={() => publishMutation.mutate()}>
                {tx({ vi: 'Công bố', en: 'Publish' })}
              </Button>
            )}
            {campaign.status === 'ACTIVE' && isPartner && (
              <Button variant="step" loading={completeMutation.isPending} onClick={() => completeMutation.mutate()}>
                {tx({ vi: 'Hoàn thành', en: 'Complete' })}
              </Button>
            )}
            {!capacity.isFull && (campaign.status === 'PUBLISHED' || campaign.status === 'ACTIVE') && (
              <Button variant="step" icon={<ArrowRight className="size-4" />} loading={joinMutation.isPending} onClick={() => joinMutation.mutate()}>
                {tx({ vi: 'Tham gia', en: 'Join' })}
              </Button>
            )}
          </div>
        }
      />

      {/* Info cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard icon={<Calendar className="size-5" />} label={tx({ vi: 'Thời gian', en: 'Date' })} value={dateStr} />
        <InfoCard icon={<MapPin className="size-5" />} label={tx({ vi: 'Địa điểm', en: 'Location' })} value={`${campaign.district}${campaign.ward ? `, ${campaign.ward}` : ''}${campaign.address ? ` — ${campaign.address}` : ''}`} />
        <InfoCard icon={<Clock className="size-5" />} label={tx({ vi: 'Thời lượng', en: 'Duration' })} value={`${campaign.durationMinutes} ${tx({ vi: 'phút', en: 'min' })}`} />
        <InfoCard icon={<Users className="size-5" />} label={tx({ vi: 'Sức chứa', en: 'Capacity' })}>
          <div className="mt-1">
            <span className="text-xl font-extrabold text-ink">{capacity.filled}</span>
            <span className="text-muted">/{capacity.total}</span>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-sunken">
              <div className={cx('h-full rounded-full', capacity.percentage >= 80 ? 'bg-warn' : 'bg-step')} style={{ width: `${capacity.percentage}%` }} />
            </div>
          </div>
        </InfoCard>
      </div>

      {/* Navigators (slots) */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold text-ink">{tx({ vi: 'Tình nguyện viên', en: 'Navigators' })} ({slots.filter((s: any) => s.status !== 'AVAILABLE' && s.status !== 'CANCELLED').length})</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {slots.filter((s: any) => s.userId).map((slot: any) => (
            <Card key={slot.id} className="flex items-center gap-3 p-3">
              <div className="grid size-10 place-items-center rounded-full bg-step-soft text-step font-bold text-sm">
                {(slot.userName ?? '?')[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{slot.userName ?? 'Navigator'}</p>
                <p className="text-xs text-muted">{slot.status}</p>
              </div>
              {slot.status === 'COMPLETED' && <CheckCircle2 className="size-5 text-step" />}
            </Card>
          ))}
        </div>
      </section>

      {/* Participants (beneficiaries) */}
      {participants.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-bold text-ink">{tx({ vi: 'Người thụ hưởng', en: 'Participants' })} ({participants.length})</h2>
          <div className="divide-y divide-line rounded-xl border border-line bg-surface">
            {participants.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{p.beneficiaryAlias}</p>
                  {p.referredByName && <p className="text-xs text-muted">{tx({ vi: 'Giới thiệu bởi', en: 'Referred by' })} {p.referredByName}</p>}
                </div>
                {p.outcomeStatus && (
                  <Badge tone={p.outcomeStatus === 'BETTER' ? 'step' : p.outcomeStatus === 'HARDER' ? 'danger' : 'warn'}>
                    {p.outcomeStatus}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Missions */}
      {missions.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-ink">{tx({ vi: 'Nhiệm vụ', en: 'Missions' })} ({missions.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {missions.map((m: any) => (
              <Link to={`/missions/${m.id}`} key={m.id}>
                <Card className="p-4 hover:border-brand transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-ink">{m.navigatorName ?? 'Navigator'}</p>
                      <p className="text-xs text-muted">{m.status}</p>
                    </div>
                    <MissionStatusIcon status={m.status} />
                  </div>
                  {m.evidenceNotes && <p className="mt-2 text-sm text-ink-2">{m.evidenceNotes}</p>}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function InfoCard({ icon, label, value, children }: { icon: React.ReactNode; label: string; value?: string; children?: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="mb-1 flex items-center gap-2 text-muted">{icon}<span className="text-xs font-semibold">{label}</span></div>
      {value && <p className="text-sm font-bold text-ink">{value}</p>}
      {children}
    </Card>
  );
}

function MissionStatusIcon({ status }: { status: string }) {
  if (status === 'COMPLETED' || status === 'VERIFIED') return <CheckCircle2 className="size-5 text-step" />;
  if (status === 'EVIDENCE_SUBMITTED') return <FileText className="size-5 text-brand" />;
  if (status === 'CHECKED_IN') return <QrCode className="size-5 text-brand" />;
  return <Clock className="size-5 text-muted" />;
}
