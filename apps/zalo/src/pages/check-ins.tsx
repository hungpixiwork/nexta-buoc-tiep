/**
 * A4 Hỏi thăm. Người dùng: người đồng hành. Việc chính: ghi kết quả hỏi thăm.
 * Lần tới hẹn lên đầu; chạm để ghi ngay tại chỗ. Không chữ đỏ "Quá hạn" — chỉ nhắc nhẹ "đã tới hẹn".
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarHeart, ChevronDown } from 'lucide-react';
import { byCaseId } from '@web/lib/caseSignals';
import { fmtRelative, isOverdue } from '@web/lib/format';
import { useCases, useFollowUps } from '../lib/hooks';
import { useLang } from '../lib/i18n';
import { errorText, needLabel } from '../lib/labels';
import { Alert, Badge, Button, EmptyState, Loading, PageBody, PageHeader, cx } from '../components/ui';
import { RecordCheckIn } from '../components/RecordCheckIn';

export function CheckInsPage() {
  const { tx, lang } = useLang();
  const navigate = useNavigate();
  const followUps = useFollowUps();
  const cases = useCases('OPEN');
  const [open, setOpen] = useState<string | null>(null);
  const caseMap = byCaseId(cases.data);
  const list = [...(followUps.data ?? [])].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const due = list.filter((f) => isOverdue(f.dueAt)).length;

  return (
    <>
      <PageHeader variant="logo" title={tx({ vi: 'Hỏi thăm', en: 'Check-ins' })} subtitle={tx({ vi: 'Họ có thật sự được giúp không?', en: 'Were they really helped?' })} />
      <PageBody>
        {followUps.isLoading ? (
          <Loading />
        ) : followUps.error ? (
          <Alert tone="danger" title={tx({ vi: 'Chưa tải được lịch hỏi thăm', en: "Couldn't load check-ins" })} onRetry={() => followUps.refetch()}>
            {errorText(followUps.error, lang)}
          </Alert>
        ) : list.length === 0 ? (
          <EmptyState icon={<CalendarHeart className="size-7" strokeWidth={1.75} aria-hidden />} title={tx({ vi: 'Chưa tới hẹn hỏi thăm ai', en: 'No check-ins due' })}>
            {tx({ vi: 'Lịch hỏi thăm tự tạo sau khi chốt bước tiếp với một người.', en: 'Check-ins are scheduled once you agree a next step with someone.' })}
          </EmptyState>
        ) : (
          <>
            <ul className="space-y-2">
              {list.map((f) => {
                const c = caseMap.get(f.caseId);
                const overdue = isOverdue(f.dueAt);
                const expanded = open === f.id;
                return (
                  <li key={f.id} className="rounded-xl bg-white">
                    <button type="button" className="flex min-h-[64px] w-full items-center gap-3 p-4 text-left" onClick={() => setOpen(expanded ? null : f.id)} aria-expanded={expanded}>
                      <span className={cx('grid size-10 shrink-0 place-items-center rounded-xl', overdue ? 'bg-accent-soft text-accent-ink' : 'bg-highlight text-primary')}>
                        <CalendarHeart className="size-5" strokeWidth={1.75} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="text-base font-medium text-fg">{f.alias ?? c?.alias ?? '—'}</span>
                          {f.need && <Badge>{needLabel(f.need, lang)}</Badge>}
                        </span>
                        {f.action && <span className="mt-0.5 line-clamp-2 block text-small text-fg-2">{f.action}</span>}
                        <span className={cx('mt-0.5 block text-caption', overdue ? 'font-medium text-accent-ink' : 'text-fg-2')}>
                          {overdue ? tx({ vi: 'Đã tới hẹn', en: 'Due' }) : tx({ vi: 'Hẹn', en: 'Scheduled' })} · {fmtRelative(f.dueAt, lang)}
                        </span>
                      </span>
                      <ChevronDown className={cx('size-5 shrink-0 text-fg-2 transition-transform duration-200', expanded && 'rotate-180')} strokeWidth={1.75} aria-hidden />
                    </button>
                    {expanded && (
                      <div className="animate-enter border-t border-line p-4">
                        <RecordCheckIn followUpId={f.id} need={f.need} person={c ?? { alias: f.alias }} onDone={() => setOpen(null)} />
                        <Button full variant="ghost" className="mt-2" onClick={() => navigate(`/journey/${f.caseId}`)}>
                          {tx({ vi: 'Mở hành trình', en: 'Open journey' })}
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </PageBody>
    </>
  );
}
