/**
 * A2 Hôm nay — bố cục home của zaui-doctor: 2 thao tác nhanh · lưới dịch vụ · thẻ nổi bật "Bước tiếp theo"
 * · danh sách hành trình · thẻ gọi hỗ trợ. Việc chính: mở người cần làm tiếp.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { dueStatus, priorityOf } from '@web/lib/caseSignals';
import { fmtRelative } from '@web/lib/format';
import { displayName } from '@web/lib/pathway';
import type { FollowUp } from '@web/lib/types';
import { useCases, useFollowUps } from '../lib/hooks';
import { useLang } from '../lib/i18n';
import { errorText, needLabel } from '../lib/labels';
import { JOURNEY_STEPS, TASK_LABEL, stepNumber, taskOf, whyOf, type Task } from '../lib/nextStep';
import { listDrafts } from '../lib/offline';
import { useSession } from '../lib/session';
import { SupportCall } from '../components/SupportCall';
import { Alert, Loading } from '../components/ui';
import Section from '../components/zaui/section';
import TransitionLink from '../components/zaui/transition-link';
import ArrowRightIcon from '../components/icons/arrow-right';
import CallIcon from '../components/icons/call';
import ShipIcon from '../components/icons/ship';
import book from '../static/book.svg';
import history from '../static/history.svg';
import hospital from '../static/services/hospital.svg';
import calendar from '../static/services/calendar.svg';
import chatOa from '../static/services/chat-oa.svg';
import heart from '../static/services/heart.svg';
import all from '../static/services/all.svg';

const ORDER: Task[] = ['checkin', 'safety', 'connect', 'understand', 'waiting', 'following'];
const PRIO = { high: 0, medium: 1, low: 2 } as const;

export function TodayPage() {
  const { tx, lang } = useLang();
  const { session } = useSession();
  const navigate = useNavigate();
  const cases = useCases('OPEN');
  const followUps = useFollowUps();
  const drafts = session ? listDrafts(session.account.id).length : 0;

  const rows = useMemo(() => {
    const fuByCase = new Map<string, FollowUp>();
    for (const f of followUps.data ?? []) if (!fuByCase.has(f.caseId)) fuByCase.set(f.caseId, f);
    return (cases.data ?? [])
      .map((c) => {
        const fu = fuByCase.get(c.id);
        const task = taskOf(c, fu);
        const dueAt = task === 'checkin' ? fu!.dueAt : c.nextStep?.dueAt ?? fu?.dueAt ?? null;
        return { c, task, dueAt, priority: priorityOf(c, dueAt) };
      })
      .sort((a, b) => PRIO[a.priority] - PRIO[b.priority] || ORDER.indexOf(a.task) - ORDER.indexOf(b.task) || (a.dueAt ?? '9').localeCompare(b.dueAt ?? '9'));
  }, [cases.data, followUps.data]);

  const loading = cases.isLoading || followUps.isLoading;
  const failed = cases.error || followUps.error;
  const hero = rows.find((r) => r.task !== 'waiting' && r.task !== 'following');
  const checkinsDue = rows.filter((r) => r.task === 'checkin').length;

  return (
    <>
      {/* Thao tác nhanh */}
      <Section className="grid grid-cols-2 gap-3 pb-5 pt-4">
        <QuickAction to="/new" icon={book} title={tx({ vi: 'Người mới', en: 'New person' })} subtitle={tx({ vi: 'Bắt đầu hành trình', en: 'Start a journey' })} />
        <QuickAction
          to="/check-ins"
          icon={history}
          title={tx({ vi: 'Hỏi thăm', en: 'Check-ins' })}
          subtitle={checkinsDue > 0 ? tx({ vi: `${checkinsDue} người tới hẹn`, en: `${checkinsDue} due` }) : tx({ vi: 'Hỏi lại kết quả', en: 'Check back' })}
        />
      </Section>

      {/* Lưới dịch vụ */}
      <div className="grid grid-cols-5 items-start justify-center px-2 text-center text-xs">
        <ServiceItem to="/support" icon={hospital} label={tx({ vi: 'Nơi hỗ trợ', en: 'Support' })} />
        <ServiceItem to="/check-ins" icon={calendar} label={tx({ vi: 'Lịch hẹn', en: 'Schedule' })} />
        <SupportCall
          trigger={(open) => (
            <button type="button" onClick={open} className="flex flex-col items-center gap-2 px-1 py-1 active:scale-95">
              <img src={chatOa} alt="" className="h-9 w-9" />
              <span className="text-xs text-fg">{tx({ vi: 'Tổng đài', en: 'Hotlines' })}</span>
            </button>
          )}
        />
        <ServiceItem to={session?.trial ? '/join' : '/more'} icon={heart} label={session?.trial ? tx({ vi: 'Đăng ký', en: 'Apply' }) : tx({ vi: 'Hồ sơ', en: 'Profile' })} />
        <ServiceItem to="/more" icon={all} label={tx({ vi: 'Tất cả', en: 'All' })} />
      </div>

      {drafts > 0 && (
        <div className="px-4 pt-4">
          <p className="truncate rounded-lg bg-accent-soft px-3 py-2 text-xs text-accent-ink">{tx({ vi: `${drafts} người mới đã lưu trên máy, sẽ gửi khi có mạng`, en: `${drafts} saved on phone, will send when online` })}</p>
        </div>
      )}

      {/* Bước tiếp theo — thẻ nổi bật */}
      <Section className="pt-5" title={tx({ vi: 'Bước tiếp theo của bạn', en: 'Your next step' })} isCard>
        {loading ? (
          <Loading />
        ) : failed ? (
          <Alert tone="danger" onRetry={() => (cases.refetch(), followUps.refetch())}>{errorText(failed, lang)}</Alert>
        ) : hero ? (
          <TransitionLink to={`/journey/${hero.c.id}`} className="relative flex flex-col gap-1.5 rounded-xl rounded-br-none bg-[linear-gradient(132deg,_#F3F9FF_1.29%,_#E2EEFF_96.9%)] px-3 pb-4 pt-3">
            <img src={book} alt="" className="absolute bottom-0 right-0 w-16 opacity-90" />
            <div className="text-base font-medium text-primary">{displayName(hero.c)}</div>
            <div className="pr-16 text-xs text-disabled">
              {tx(TASK_LABEL[hero.task])} · {tx(whyOf(hero.task, hero.c))}
            </div>
            <StepDots stage={hero.c.stage} />
            <span className="mt-2 flex w-fit items-center justify-center gap-0.5 rounded-full bg-gradient-to-r from-primary to-primary-gradient px-2 py-0.5">
              <span className="text-4xs font-medium text-white">{tx({ vi: 'LÀM NGAY', en: 'DO IT' })}</span>
              <ArrowRightIcon width={10} height={10} color="white" />
            </span>
          </TransitionLink>
        ) : (
          <div className="rounded-xl bg-background p-4 text-center">
            <p className="text-base font-medium text-fg">{rows.length ? tx({ vi: 'Hôm nay không có việc gấp', en: 'Nothing urgent today' }) : tx({ vi: 'Chưa có hành trình nào', en: 'No journeys yet' })}</p>
            <p className="mt-1 text-xs text-disabled">{tx({ vi: 'Bấm nút + để gặp người mới.', en: 'Tap + to meet someone new.' })}</p>
          </div>
        )}
      </Section>

      {/* Hành trình đang theo */}
      {rows.length > 0 && (
        <Section className="pt-4" title={tx({ vi: 'Hành trình của bạn', en: 'Your journeys' })} isCard>
          <div className="-my-1 divide-y divide-black/5">
            {rows.map((r) => (
              <TransitionLink key={r.c.id} to={`/journey/${r.c.id}`} className="flex items-center gap-3 py-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-highlight text-sm font-semibold text-primary">{displayName(r.c).replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).slice(-1)[0]?.[0]?.toUpperCase() ?? 'N'}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-fg">{displayName(r.c)}</span>
                    {r.c.need && <span className="shrink-0 text-2xs text-disabled">· {needLabel(r.c.need, lang)}</span>}
                  </div>
                  <div className="truncate text-xs text-disabled">
                    {tx({ vi: `Bước ${Math.min(stepNumber(r.c.stage), 6)}/6`, en: `Step ${Math.min(stepNumber(r.c.stage), 6)}/6` })}
                    {r.task === 'checkin' && r.dueAt ? ` · ${dueStatus(r.dueAt) === 'overdue' ? tx({ vi: 'đã tới hẹn', en: 'due' }) : tx({ vi: 'hẹn', en: 'due' })} ${fmtRelative(r.dueAt, lang)}` : ''}
                  </div>
                </div>
                <span className={`shrink-0 rounded-md px-2 py-1 text-2xs ${r.task === 'checkin' ? 'bg-accent-soft text-accent-ink' : r.task === 'following' ? 'bg-success-soft text-success-ink' : 'bg-highlight text-primary'}`}>{tx(TASK_LABEL[r.task])}</span>
              </TransitionLink>
            ))}
          </div>
        </Section>
      )}

      {/* Hỗ trợ nhanh */}
      <Section className="pb-6 pt-4" title={tx({ vi: 'Cần hỗ trợ ngay', en: 'Need help now' })} isCard>
        <div className="grid grid-cols-2 gap-3 self-stretch">
          <SupportCall
            trigger={(open) => (
              <button type="button" onClick={open} className="flex items-center gap-2 rounded-lg bg-background p-3 text-left">
                <div className="h-10 w-10 shrink-0"><CallIcon /></div>
                <div className="min-w-0">
                  <div className="truncate text-base font-medium text-fg">{tx({ vi: 'Gọi hỗ trợ', en: 'Get help' })}</div>
                  <div className="truncate text-xs text-disabled">{tx({ vi: 'Theo tình huống', en: 'By situation' })}</div>
                </div>
              </button>
            )}
          />
          <TransitionLink to="/support" className="flex items-center gap-2 rounded-lg bg-background p-3">
            <div className="h-10 w-10 shrink-0"><ShipIcon /></div>
            <div className="min-w-0">
              <div className="truncate text-base font-medium text-fg">{tx({ vi: 'Nơi hỗ trợ', en: 'Support' })}</div>
              <div className="truncate text-xs text-disabled">{tx({ vi: 'Đã xác minh', en: 'Verified' })}</div>
            </div>
          </TransitionLink>
        </div>
      </Section>
    </>
  );
}

function QuickAction({ to, icon, title, subtitle }: { to: string; icon: string; title: string; subtitle: string }) {
  return (
    <TransitionLink to={to} className="flex items-center gap-2 rounded-xl bg-white p-3">
      <img src={icon} alt="" className="h-11 w-11" />
      <div className="flex min-w-0 flex-grow flex-col gap-1.5 self-stretch">
        <div className="text-base font-medium text-fg">{title}</div>
        <div className="truncate text-xs text-disabled">{subtitle}</div>
      </div>
    </TransitionLink>
  );
}

function ServiceItem({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <TransitionLink to={to} className="flex flex-col items-center gap-2 px-1 py-1 active:scale-95">
      <img src={icon} alt="" className="h-9 w-9" />
      <span className="text-xs text-fg">{label}</span>
    </TransitionLink>
  );
}

function StepDots({ stage }: { stage: string }) {
  const n = Math.min(stepNumber(stage), 6);
  return (
    <div className="mt-1 flex w-2/3 gap-1">
      {JOURNEY_STEPS.map((s, i) => (
        <span key={s.vi} className={`h-1 flex-1 rounded-full ${i < n - 1 ? 'bg-success' : i === n - 1 ? 'bg-primary' : 'bg-white'}`} />
      ))}
    </div>
  );
}
