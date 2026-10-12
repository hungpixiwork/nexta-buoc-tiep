/**
 * Missions Page — View and manage my missions (Navigator).
 */
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, FileText, MapPin, QrCode, ArrowRight, Camera } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { errorText } from '../../app/errors';
import { apiFetch } from '../../lib/api';
import { Badge, Button, Card, EmptyState, ErrorBanner, PageHeader, Spinner, cx } from '../../design/ui';

interface Mission {
  id: string;
  campaignId: string;
  title: string;
  description?: string;
  durationMinutes: number;
  status: string;
  checkedInAt?: string;
  evidenceUrl?: string;
  evidenceType?: string;
  evidenceNotes?: string;
  verifiedBy?: string;
  verifierName?: string;
  verifiedAt?: string;
  completedAt?: string;
  createdAt: string;
  campaign?: {
    title: string;
    district: string;
    startsAt: string;
    category: string;
    address?: string;
  };
}

const STATUS_ORDER: Record<string, number> = {
  ASSIGNED: 0, CHECKED_IN: 1, IN_PROGRESS: 2, EVIDENCE_SUBMITTED: 3, VERIFIED: 4, COMPLETED: 5,
};

export function MissionsPage() {
  const { tx, lang, s } = useApp();
  const queryClient = useQueryClient();

  const missions = useQuery({
    queryKey: ['missions'],
    queryFn: () => apiFetch<{ missions: Mission[] }>('/api/v1/missions').then(r => r.missions),
  });

  const active = (missions.data ?? []).filter(m => m.status !== 'COMPLETED' && m.status !== 'VERIFIED').sort((a, b) => (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0));
  const completed = (missions.data ?? []).filter(m => m.status === 'COMPLETED' || m.status === 'VERIFIED');

  return (
    <>
      <PageHeader
        eyebrow={tx({ vi: 'Nhiệm vụ', en: 'Missions' })}
        title={tx({ vi: 'Nhiệm vụ của tôi', en: 'My Missions' })}
        description={tx({
          vi: 'Theo dõi tiến trình: check-in, nộp bằng chứng, và hoàn thành nhiệm vụ.',
          en: 'Track progress: check-in, submit evidence, and complete missions.',
        })}
      />

      {missions.isLoading && <Spinner label={s.common.loading} />}
      {missions.error && <ErrorBanner title={s.common.errorTitle} message={errorText(missions.error, lang)} onRetry={() => missions.refetch()} retryLabel={s.common.retry} />}

      {/* Active missions */}
      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-ink">
            {tx({ vi: 'Đang thực hiện', en: 'In Progress' })} ({active.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {active.map(mission => (
              <MissionCard key={mission.id} mission={mission} tx={tx} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* Completed missions */}
      {completed.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-ink">
            {tx({ vi: 'Đã hoàn thành', en: 'Completed' })} ({completed.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {completed.map(mission => (
              <MissionCard key={mission.id} mission={mission} tx={tx} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {missions.data && missions.data.length === 0 && (
        <EmptyState
          title={tx({ vi: 'Chưa có nhiệm vụ', en: 'No missions yet' })}
        >
          {tx({ vi: 'Tham gia chiến dịch để nhận nhiệm vụ đầu tiên.', en: 'Join a campaign to get your first mission.' })}
          <div className="mt-3">
            <Link to="/campaigns"><Button variant="step" size="sm">{tx({ vi: 'Khám phá chiến dịch', en: 'Explore campaigns' })}</Button></Link>
          </div>
        </EmptyState>
      )}
    </>
  );
}

function MissionCard({ mission, tx, lang }: { mission: Mission; tx: (c: { vi: string; en: string }) => string; lang: string }) {
  const isActive = mission.status !== 'COMPLETED' && mission.status !== 'VERIFIED';
  const steps = [
    { key: 'ASSIGNED', label: tx({ vi: 'Nhận nhiệm vụ', en: 'Assigned' }), icon: <Clock className="size-4" /> },
    { key: 'CHECKED_IN', label: tx({ vi: 'Đã check-in', en: 'Checked in' }), icon: <QrCode className="size-4" /> },
    { key: 'IN_PROGRESS', label: tx({ vi: 'Đang thực hiện', en: 'In progress' }), icon: <Clock className="size-4" /> },
    { key: 'EVIDENCE_SUBMITTED', label: tx({ vi: 'Đã nộp bằng chứng', en: 'Evidence submitted' }), icon: <Camera className="size-4" /> },
    { key: 'VERIFIED', label: tx({ vi: 'Đã xác minh', en: 'Verified' }), icon: <CheckCircle2 className="size-4" /> },
    { key: 'COMPLETED', label: tx({ vi: 'Hoàn thành', en: 'Completed' }), icon: <CheckCircle2 className="size-4" /> },
  ];

  const currentIndex = steps.findIndex(s => s.key === mission.status);

  return (
    <Link to={`/missions/${mission.id}`}>
      <Card className={cx('p-5 transition-colors hover:border-brand', isActive && 'border-l-4 border-l-step')}>
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-ink">{mission.title}</h3>
            {mission.campaign && (
              <p className="mt-0.5 text-xs text-muted">
                {mission.campaign.district} • {mission.durationMinutes} {tx({ vi: 'phút', en: 'min' })}
              </p>
            )}
          </div>
          <MissionStatusBadge status={mission.status} tx={tx} />
        </div>

        {/* Progress bar */}
        {isActive && (
          <div className="mt-3 flex gap-1">
            {steps.slice(0, 5).map((step, index) => (
              <div key={step.key} className="flex-1">
                <div className={cx('h-1.5 rounded-full', index <= currentIndex ? 'bg-step' : 'bg-sunken')} />
              </div>
            ))}
          </div>
        )}

        {/* Next action hint */}
        {isActive && (
          <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-step">
            {mission.status === 'ASSIGNED' && <>{tx({ vi: 'Tiếp: Scan QR check-in', en: 'Next: QR check-in' })} <ArrowRight className="size-3" /></>}
            {mission.status === 'CHECKED_IN' && <>{tx({ vi: 'Tiếp: Nộp bằng chứng', en: 'Next: Submit evidence' })} <ArrowRight className="size-3" /></>}
            {mission.status === 'EVIDENCE_SUBMITTED' && <>{tx({ vi: 'Đang chờ Partner xác minh', en: 'Waiting for verification' })}</>}
          </p>
        )}
      </Card>
    </Link>
  );
}

function MissionStatusBadge({ status, tx }: { status: string; tx: (c: { vi: string; en: string }) => string }) {
  const map: Record<string, { tone: 'neutral' | 'brand' | 'step' | 'warn'; vi: string; en: string }> = {
    ASSIGNED: { tone: 'brand', vi: 'Đã nhận', en: 'Assigned' },
    CHECKED_IN: { tone: 'brand', vi: 'Đã check-in', en: 'Checked-in' },
    IN_PROGRESS: { tone: 'brand', vi: 'Đang làm', en: 'In Progress' },
    EVIDENCE_SUBMITTED: { tone: 'warn', vi: 'Chờ xác minh', en: 'Pending' },
    VERIFIED: { tone: 'step', vi: 'Đã xác minh', en: 'Verified' },
    COMPLETED: { tone: 'step', vi: 'Hoàn thành', en: 'Completed' },
  };
  const item = map[status] ?? map.ASSIGNED;
  return <Badge tone={item.tone}>{tx(item)}</Badge>;
}
