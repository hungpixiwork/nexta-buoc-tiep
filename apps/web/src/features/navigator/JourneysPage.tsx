import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { errorText } from '../../app/errors';
import { Button, Chip, EmptyState, ErrorBanner, PageHeader, Spinner } from '../../design/ui';
import { useCases } from '../../lib/hooks';
import type { CaseListItem } from '../../lib/types';
import { CaseRow } from './CaseRow';

type Filter = 'all' | 'action' | 'held' | 'connected' | 'closed';

const match: Record<Filter, (c: CaseListItem) => boolean> = {
  all: () => true,
  action: (c) => ['CONSENT', 'UNDERSTAND', 'MATCH', 'NEXT_STEP'].includes(c.stage),
  held: (c) => c.stage === 'RISK' || c.stage === 'ESCALATED',
  connected: (c) => c.stage === 'CONNECTED' || c.stage === 'FOLLOW_UP',
  closed: (c) => c.status === 'CLOSED',
};

export function JourneysPage() {
  const { s, tx, lang, role } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const cases = useCases(filter === 'closed' ? 'CLOSED' : filter === 'all' ? 'ALL' : 'OPEN');
  const items = (cases.data ?? []).filter(match[filter]);

  const filters: Array<[Filter, string]> = [
    ['all', tx({ vi: 'Tất cả', en: 'All' })],
    ['action', tx({ vi: 'Cần làm tiếp', en: 'Needs action' })],
    ['held', tx({ vi: 'Đang tạm dừng', en: 'On hold' })],
    ['connected', tx({ vi: 'Đã kết nối', en: 'Connected' })],
    ['closed', tx({ vi: 'Đã khép lại', en: 'Closed' })],
  ];

  return (
    <>
      <PageHeader
        title={s.nav.journeys}
        description={tx({ vi: 'Mỗi hành trình chỉ lưu bí danh — không họ tên, không số giấy tờ.', en: 'Each journey stores an alias only — no full name, no ID number.' })}
        actions={
          role === 'navigator' && (
            <Link to="/journeys/new">
              <Button variant="step" icon={<Plus className="size-5" />}>
                {s.nav.newJourney}
              </Button>
            </Link>
          )
        }
      />
      <div className="mb-4 flex flex-wrap gap-2" role="toolbar">
        {filters.map(([f, label]) => (
          <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>
            {label}
          </Chip>
        ))}
      </div>
      {cases.isLoading && <Spinner label={s.common.loading} />}
      {cases.error && <ErrorBanner title={s.common.errorTitle} message={errorText(cases.error, lang)} onRetry={() => cases.refetch()} retryLabel={s.common.retry} />}
      {cases.data && items.length === 0 && <EmptyState imageSrc="/illustrations/field-preparation.webp" imageAlt={tx({ vi: 'Minh họa hai tình nguyện viên Việt Nam chuẩn bị cho chuyến đi thực địa', en: 'Illustration of two Vietnamese volunteers preparing for a field visit' })} icon={<ClipboardList className="size-6" />} title={tx({ vi: 'Chưa có hành trình nào ở đây', en: 'No journeys here yet' })} />}
      <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {items.map((c) => (
          <CaseRow key={c.id} c={c} />
        ))}
      </ul>
    </>
  );
}
