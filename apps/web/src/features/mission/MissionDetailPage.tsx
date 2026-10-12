/**
 * Mission Detail Page — View mission info, progress, and take actions.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Camera, CheckCircle2, Clock, FileText, MapPin, QrCode, ArrowRight } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { errorText } from '../../app/errors';
import { apiFetch } from '../../lib/api';
import { Badge, Button, Card, ErrorBanner, Field, PageHeader, Spinner, TextArea, cx } from '../../design/ui';

interface MissionDetail {
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
  navigatorName?: string;
  createdAt: string;
  campaign?: {
    title: string;
    district: string;
    startsAt: string;
    category: string;
    address?: string;
  };
}

const STEPS = ['ASSIGNED', 'CHECKED_IN', 'EVIDENCE_SUBMITTED', 'VERIFIED', 'COMPLETED'] as const;

export function MissionDetailPage() {
  const { id = '' } = useParams();
  const { tx, lang, s } = useApp();
  const queryClient = useQueryClient();
  const [evidenceNotes, setEvidenceNotes] = useState('');

  const mission = useQuery({
    queryKey: ['mission', id],
    queryFn: () => apiFetch<{ mission: MissionDetail }>(`/api/v1/missions/${id}`).then(response => response.mission),
    enabled: Boolean(id),
  });

  const checkinMutation = useMutation({
    mutationFn: () => apiFetch(`/api/v1/missions/${id}/check-in`, { method: 'PATCH', body: {} }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mission', id] }),
  });

  const evidenceMutation = useMutation({
    mutationFn: (notes: string) => apiFetch(`/api/v1/missions/${id}/evidence`, { method: 'POST', body: { evidenceType: 'note', evidenceNotes: notes } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mission', id] }),
  });

  const completeMutation = useMutation({
    mutationFn: () => apiFetch(`/api/v1/missions/${id}/complete`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mission', id] }),
  });

  if (mission.isLoading) return <Spinner label={s.common.loading} />;
  if (mission.error || !mission.data) return <ErrorBanner title={s.common.errorTitle} message={errorText(mission.error, lang)} onRetry={() => mission.refetch()} retryLabel={s.common.retry} />;

  const missionData = mission.data;
  const currentIndex = STEPS.indexOf(missionData.status as typeof STEPS[number]);
  const isActive = missionData.status !== 'COMPLETED' && missionData.status !== 'VERIFIED';

  const stepLabels: Record<string, { vi: string; en: string; icon: React.ReactNode }> = {
    ASSIGNED: { vi: 'Đã nhận', en: 'Assigned', icon: <Clock className="size-5" /> },
    CHECKED_IN: { vi: 'Check-in', en: 'Checked in', icon: <QrCode className="size-5" /> },
    EVIDENCE_SUBMITTED: { vi: 'Nộp bằng chứng', en: 'Evidence', icon: <Camera className="size-5" /> },
    VERIFIED: { vi: 'Đã xác minh', en: 'Verified', icon: <CheckCircle2 className="size-5" /> },
    COMPLETED: { vi: 'Hoàn thành', en: 'Done', icon: <CheckCircle2 className="size-5" /> },
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/missions" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-strong hover:underline">
        <ArrowLeft className="size-4" /> {tx({ vi: 'Nhiệm vụ của tôi', en: 'My Missions' })}
      </Link>

      <PageHeader
        eyebrow={missionData.campaign?.title}
        title={missionData.title}
        description={missionData.description}
      />

      {/* Progress stepper */}
      <Card className="mb-6 p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">
          {tx({ vi: 'Tiến trình', en: 'Progress' })}
        </h2>
        <ol className="grid grid-cols-5 gap-1">
          {STEPS.map((step, stepIndex) => {
            const reached = stepIndex <= currentIndex;
            const isCurrent = stepIndex === currentIndex;
            const label = stepLabels[step];
            return (
              <li key={step} className="flex flex-col items-center gap-1.5">
                <span className={cx(
                  'grid size-10 place-items-center rounded-full border-2 transition-colors',
                  reached ? (isCurrent ? 'border-step bg-step text-white' : 'border-step bg-step-soft text-step') : 'border-line bg-surface text-muted',
                )}>
                  {label.icon}
                </span>
                <span className={cx('text-center text-xs font-semibold', reached ? 'text-ink' : 'text-muted')}>
                  {tx(label)}
                </span>
                {stepIndex < STEPS.length - 1 && (
                  <div className={cx('absolute h-0.5 w-full', reached ? 'bg-step' : 'bg-line')} />
                )}
              </li>
            );
          })}
        </ol>
        <div className="mt-3 flex gap-1">
          {STEPS.map((step, stepIndex) => (
            <div key={step} className="flex-1">
              <div className={cx('h-2 rounded-full', stepIndex <= currentIndex ? 'bg-step' : 'bg-sunken')} />
            </div>
          ))}
        </div>
      </Card>

      {/* Info */}
      {missionData.campaign && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <div className="mb-1 flex items-center gap-2 text-muted"><MapPin className="size-4" /><span className="text-xs font-semibold">{tx({ vi: 'Địa điểm', en: 'Location' })}</span></div>
            <p className="text-sm font-bold text-ink">{missionData.campaign.district}{missionData.campaign.address ? ` — ${missionData.campaign.address}` : ''}</p>
          </Card>
          <Card className="p-4">
            <div className="mb-1 flex items-center gap-2 text-muted"><Clock className="size-4" /><span className="text-xs font-semibold">{tx({ vi: 'Thời lượng', en: 'Duration' })}</span></div>
            <p className="text-sm font-bold text-ink">{missionData.durationMinutes} {tx({ vi: 'phút', en: 'min' })}</p>
          </Card>
          <Card className="p-4">
            <div className="mb-1 flex items-center gap-2 text-muted"><FileText className="size-4" /><span className="text-xs font-semibold">{tx({ vi: 'Trạng thái', en: 'Status' })}</span></div>
            <MissionStatusBadge status={missionData.status} tx={tx} />
          </Card>
        </div>
      )}

      {/* Actions */}
      {isActive && (
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold text-ink">
            {tx({ vi: 'Bước tiếp theo', en: 'Next action' })}
          </h2>

          {missionData.status === 'ASSIGNED' && (
            <div className="space-y-3">
              <p className="text-[15px] text-muted">
                {tx({ vi: 'Đến địa điểm chiến dịch và scan QR hoặc nhấn check-in.', en: 'Go to the campaign location and scan the QR code or tap check-in.' })}
              </p>
              <Button
                variant="step"
                size="lg"
                icon={<QrCode className="size-5" />}
                loading={checkinMutation.isPending}
                onClick={() => checkinMutation.mutate()}
              >
                {tx({ vi: 'Check-in ngay', en: 'Check in now' })}
              </Button>
              {checkinMutation.error && <ErrorBanner title={s.common.errorTitle} message={errorText(checkinMutation.error, lang)} />}
            </div>
          )}

          {(missionData.status === 'CHECKED_IN' || missionData.status === 'IN_PROGRESS') && (
            <div className="space-y-3">
              <p className="text-[15px] text-muted">
                {tx({ vi: 'Mô tả ngắn gọn công việc bạn đã làm hoặc hỗ trợ đã cung cấp.', en: 'Briefly describe the work you did or support provided.' })}
              </p>
              <Field label={tx({ vi: 'Ghi chú bằng chứng', en: 'Evidence notes' })} htmlFor="evidence-notes">
                <TextArea
                  id="evidence-notes"
                  value={evidenceNotes}
                  onChange={(event) => setEvidenceNotes(event.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder={tx({ vi: 'Ví dụ: Đã hướng dẫn 3 người đăng ký BHYT...', en: 'E.g.: Helped 3 people register for health insurance...' })}
                />
              </Field>
              <Button
                variant="step"
                size="lg"
                icon={<Camera className="size-5" />}
                loading={evidenceMutation.isPending}
                disabled={evidenceNotes.trim().length < 5}
                onClick={() => evidenceMutation.mutate(evidenceNotes.trim())}
              >
                {tx({ vi: 'Nộp bằng chứng', en: 'Submit evidence' })}
              </Button>
              {evidenceMutation.error && <ErrorBanner title={s.common.errorTitle} message={errorText(evidenceMutation.error, lang)} />}
            </div>
          )}

          {missionData.status === 'EVIDENCE_SUBMITTED' && (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-[15px] text-brand-strong">
                <Clock className="size-5" />
                {tx({ vi: 'Đang chờ Partner xác minh bằng chứng của bạn.', en: 'Waiting for the Partner to verify your evidence.' })}
              </p>
              {missionData.evidenceNotes && (
                <div className="rounded-xl border border-line bg-sunken p-3">
                  <p className="text-xs font-semibold text-muted">{tx({ vi: 'Bạn đã ghi', en: 'You wrote' })}:</p>
                  <p className="mt-1 text-sm text-ink">{missionData.evidenceNotes}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Completed state */}
      {(missionData.status === 'VERIFIED' || missionData.status === 'COMPLETED') && (
        <Card className="border-2 border-step-line bg-step-soft p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-8 text-step" />
            <div>
              <h2 className="text-lg font-bold text-step">{tx({ vi: 'Nhiệm vụ hoàn thành!', en: 'Mission completed!' })}</h2>
              <p className="text-sm text-step">{tx({ vi: 'Cảm ơn bạn đã đóng góp cho cộng đồng.', en: 'Thank you for your contribution to the community.' })}</p>
            </div>
          </div>
          {missionData.verifierName && (
            <p className="mt-3 text-sm text-ink-2">
              {tx({ vi: 'Xác minh bởi', en: 'Verified by' })}: <strong>{missionData.verifierName}</strong>
            </p>
          )}
        </Card>
      )}

      {/* Back to campaign */}
      <div className="mt-6">
        <Link to={`/campaigns/${missionData.campaignId}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-strong hover:underline">
          {tx({ vi: 'Xem chiến dịch', en: 'View campaign' })} <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function MissionStatusBadge({ status, tx }: { status: string; tx: (copy: { vi: string; en: string }) => string }) {
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
