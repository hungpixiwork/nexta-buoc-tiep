/**
 * Campaign Hub — Discover, join and manage community campaigns.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, Users, Zap, ChevronRight, Clock, Target, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { errorText } from '../../app/errors';
import { apiFetch } from '../../lib/api';
import { Badge, Button, Card, EmptyState, ErrorBanner, PageHeader, Spinner, cx } from '../../design/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Campaign {
  id: string;
  title: string;
  description?: string;
  category: string;
  district: string;
  ward?: string;
  address?: string;
  startsAt: string;
  endsAt?: string;
  durationMinutes: number;
  status: string;
  orgName?: string;
  creatorName?: string;
  source?: string;
  capacity: { total: number; filled: number; available: number; percentage: number; isFull: boolean };
  match?: { score: number; reasons: string[]; eligible: boolean };
}

// ---------------------------------------------------------------------------
// API hooks
// ---------------------------------------------------------------------------
const fetchCampaigns = (status?: string, district?: string) =>
  apiFetch<{ campaigns: Campaign[] }>(`/api/v1/campaigns?${new URLSearchParams({ ...(status ? { status } : {}), ...(district ? { district } : {}) })}`).then(r => r.campaigns);

const fetchRecommended = () =>
  apiFetch<{ recommended: Campaign[] }>('/api/v1/campaigns/recommended').then(r => r.recommended);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CampaignHubPage() {
  const { tx, lang, role, s } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'discover' | 'my' | 'manage'>('discover');
  const [filterDistrict, setFilterDistrict] = useState('');

  const campaigns = useQuery({ queryKey: ['campaigns', tab, filterDistrict], queryFn: async (): Promise<Campaign[]> => {
    if (tab === 'my') {
      const response = await apiFetch<{ missions: any[] }>('/api/v1/missions');
      return (response.missions ?? []).map((mission: any) => ({
        id: mission.campaignId ?? mission.id,
        title: mission.campaign?.title ?? mission.title,
        description: mission.description,
        category: mission.campaign?.category ?? 'general',
        district: mission.campaign?.district ?? '',
        startsAt: mission.campaign?.startsAt ?? mission.createdAt,
        durationMinutes: mission.durationMinutes ?? 0,
        status: mission.status,
        capacity: { total: 0, filled: 0, available: 0, percentage: 0, isFull: false },
      })) as Campaign[];
    }
    return fetchCampaigns(tab === 'manage' ? undefined : 'PUBLISHED', filterDistrict || undefined);
  }});

  const recommended = useQuery({ queryKey: ['campaigns', 'recommended'], queryFn: fetchRecommended, enabled: tab === 'discover' });

  const joinMutation = useMutation({
    mutationFn: (campaignId: string) => apiFetch<{ slotId: string; missionId: string }>(`/api/v1/campaigns/${campaignId}/join`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  const isPartnerOrCoordinator = role === 'partner' || role === 'coordinator';

  const CATEGORY_LABELS: Record<string, { vi: string; en: string; emoji: string }> = {
    digital_help: { vi: 'Hỗ trợ số', en: 'Digital Help', emoji: '💻' },
    health_check: { vi: 'Sức khỏe', en: 'Health', emoji: '🏥' },
    food_drive: { vi: 'Lương thực', en: 'Food', emoji: '🍲' },
    legal_aid: { vi: 'Pháp lý', en: 'Legal', emoji: '⚖️' },
    education: { vi: 'Giáo dục', en: 'Education', emoji: '📚' },
    housing: { vi: 'Nhà ở', en: 'Housing', emoji: '🏠' },
    employment: { vi: 'Việc làm', en: 'Employment', emoji: '💼' },
    mental_health: { vi: 'Tâm lý', en: 'Mental Health', emoji: '🧠' },
    child_protection: { vi: 'Bảo vệ trẻ em', en: 'Child Protection', emoji: '🛡️' },
    general: { vi: 'Cộng đồng', en: 'Community', emoji: '🤝' },
  };

  const REASON_LABELS: Record<string, { vi: string; en: string }> = {
    skill_match: { vi: 'Kỹ năng phù hợp', en: 'Skill match' },
    same_area: { vi: 'Cùng khu vực', en: 'Same area' },
    available: { vi: 'Bạn đang rảnh', en: 'Available' },
    experience: { vi: 'Có kinh nghiệm', en: 'Experience' },
    filling_fast: { vi: 'Sắp hết chỗ', en: 'Filling fast' },
  };

  return (
    <>
      <PageHeader
        eyebrow={tx({ vi: 'Chiến dịch cộng đồng', en: 'Community Campaigns' })}
        title={tx({ vi: 'Tham gia hành động', en: 'Take Action' })}
        description={tx({
          vi: 'Tìm chiến dịch phù hợp, tham gia chỉ với một tap và tạo tác động thực sự.',
          en: 'Find a matching campaign, join with one tap and create real impact.',
        })}
        actions={
          isPartnerOrCoordinator ? (
            <Button variant="primary" icon={<Target className="size-4" />} onClick={() => navigate('/campaigns/new')}>
              {tx({ vi: 'Tạo chiến dịch', en: 'Create Campaign' })}
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-full bg-sunken p-1">
        {([
          { key: 'discover' as const, vi: 'Khám phá', en: 'Discover' },
          { key: 'my' as const, vi: 'Của tôi', en: 'My Missions' },
          ...(isPartnerOrCoordinator ? [{ key: 'manage' as const, vi: 'Quản lý', en: 'Manage' }] : []),
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              'flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors',
              tab === t.key ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            {tx(t)}
          </button>
        ))}
      </div>

      {/* Recommended campaigns section */}
      {tab === 'discover' && recommended.data && recommended.data.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
            <Sparkles className="size-5 text-step" />
            {tx({ vi: 'NEXTA đề xuất cho bạn', en: 'Recommended for you' })}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.data.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                lang={lang}
                tx={tx}
                categoryLabels={CATEGORY_LABELS}
                reasonLabels={REASON_LABELS}
                onJoin={() => joinMutation.mutate(campaign.id)}
                joining={joinMutation.isPending}
                showReasons
              />
            ))}
          </div>
        </section>
      )}

      {/* Campaign list */}
      <section>
        {tab === 'discover' && (
          <h2 className="mb-4 text-lg font-bold text-ink">
            {tx({ vi: 'Tất cả chiến dịch', en: 'All Campaigns' })}
          </h2>
        )}
        {campaigns.isLoading && <Spinner label={s.common.loading} />}
        {campaigns.error && <ErrorBanner title={s.common.errorTitle} message={errorText(campaigns.error, lang)} onRetry={() => campaigns.refetch()} retryLabel={s.common.retry} />}
        {campaigns.data && campaigns.data.length === 0 && (
          <EmptyState
            title={tx({ vi: 'Chưa có chiến dịch', en: 'No campaigns yet' })}
          >
            {tx({ vi: 'Chiến dịch cộng đồng sẽ xuất hiện ở đây.', en: 'Community campaigns will appear here.' })}
          </EmptyState>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(campaigns.data ?? []).map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              lang={lang}
              tx={tx}
              categoryLabels={CATEGORY_LABELS}
              reasonLabels={REASON_LABELS}
              onJoin={() => joinMutation.mutate(campaign.id)}
              joining={joinMutation.isPending}
            />
          ))}
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Campaign Card
// ---------------------------------------------------------------------------
function CampaignCard({
  campaign, lang, tx, categoryLabels, reasonLabels, onJoin, joining, showReasons,
}: {
  campaign: Campaign;
  lang: string;
  tx: (copy: { vi: string; en: string }) => string;
  categoryLabels: Record<string, { vi: string; en: string; emoji: string }>;
  reasonLabels: Record<string, { vi: string; en: string }>;
  onJoin: () => void;
  joining: boolean;
  showReasons?: boolean;
}) {
  const cat = categoryLabels[campaign.category] ?? categoryLabels.general;
  const dateStr = new Date(campaign.startsAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <Card className="flex flex-col p-5 press transition-colors hover:border-brand">
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-strong">
          {cat.emoji} {tx(cat)}
        </span>
        <CampaignStatusBadge status={campaign.status} tx={tx} />
      </div>

      <h3 className="mb-1 text-[17px] font-bold leading-snug text-ink">{campaign.title}</h3>
      {campaign.description && <p className="mb-3 line-clamp-2 text-sm text-muted">{campaign.description}</p>}

      <div className="mt-auto space-y-2 text-sm text-ink-2">
        <div className="flex items-center gap-2"><Calendar className="size-4 text-muted" />{dateStr}</div>
        <div className="flex items-center gap-2"><MapPin className="size-4 text-muted" />{campaign.district}{campaign.ward ? `, ${campaign.ward}` : ''}</div>
        <div className="flex items-center gap-2"><Clock className="size-4 text-muted" />{campaign.durationMinutes} {tx({ vi: 'phút', en: 'min' })}</div>

        {/* Capacity meter */}
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted" />
          <div className="flex-1">
            <div className="flex justify-between text-xs">
              <span>{campaign.capacity.filled}/{campaign.capacity.total}</span>
              <span className={campaign.capacity.available <= 3 ? 'font-bold text-warn' : ''}>
                {campaign.capacity.available} {tx({ vi: 'còn trống', en: 'available' })}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sunken">
              <div
                className={cx('h-full rounded-full transition-all', campaign.capacity.percentage >= 80 ? 'bg-warn' : 'bg-step')}
                style={{ width: `${campaign.capacity.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Why this? reasons */}
      {showReasons && campaign.match && campaign.match.reasons.length > 0 && (
        <details className="mt-3 rounded-xl border border-line bg-sunken p-3">
          <summary className="cursor-pointer text-xs font-semibold text-brand-strong">
            {tx({ vi: 'Vì sao bạn được đề xuất?', en: 'Why recommended?' })}
          </summary>
          <ul className="mt-2 space-y-1">
            {campaign.match.reasons.map(reason => (
              <li key={reason} className="flex items-center gap-1.5 text-xs text-ink-2">
                <Zap className="size-3 text-step" />
                {tx(reasonLabels[reason] ?? { vi: reason, en: reason })}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <Link to={`/campaigns/${campaign.id}`} className="flex-1">
          <Button variant="secondary" size="sm" block>
            {tx({ vi: 'Chi tiết', en: 'Details' })} <ChevronRight className="size-3" />
          </Button>
        </Link>
        {!campaign.capacity.isFull && (campaign.status === 'PUBLISHED' || campaign.status === 'ACTIVE') && (
          <Button variant="step" size="sm" loading={joining} onClick={(e) => { e.preventDefault(); onJoin(); }}>
            {tx({ vi: 'Tham gia', en: 'Join' })} <ArrowRight className="size-3" />
          </Button>
        )}
      </div>
    </Card>
  );
}

function CampaignStatusBadge({ status, tx }: { status: string; tx: (c: { vi: string; en: string }) => string }) {
  const map: Record<string, { tone: 'neutral' | 'brand' | 'step' | 'warn' | 'danger'; vi: string; en: string }> = {
    DRAFT: { tone: 'neutral', vi: 'Nháp', en: 'Draft' },
    PUBLISHED: { tone: 'brand', vi: 'Mở đăng ký', en: 'Open' },
    ACTIVE: { tone: 'step', vi: 'Đang diễn ra', en: 'Active' },
    COMPLETED: { tone: 'neutral', vi: 'Hoàn thành', en: 'Completed' },
    CANCELLED: { tone: 'danger', vi: 'Đã hủy', en: 'Cancelled' },
  };
  const item = map[status] ?? map.DRAFT;
  return <Badge tone={item.tone}>{tx(item)}</Badge>;
}
