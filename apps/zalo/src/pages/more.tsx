/** A7 Cá nhân — bố cục profile của zaui-doctor: số liệu thật của tôi · công cụ · khác. */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useCases, useFollowUps } from '../lib/hooks';
import { useLang } from '../lib/i18n';
import { listDrafts, syncDrafts } from '../lib/offline';
import { openExternal } from '../lib/platform';
import { useSession } from '../lib/session';
import { SupportCall } from '../components/SupportCall';
import Section from '../components/zaui/section';
import ArrowRightIcon from '../components/icons/arrow-right';
import hospital from '../static/services/hospital.svg';
import calendar from '../static/services/calendar.svg';
import chatOa from '../static/services/chat-oa.svg';
import heart from '../static/services/heart.svg';

const WEB_URL = (import.meta.env.VITE_WEB_URL as string | undefined) ?? 'https://buoc-tiep-web.pages.dev';

export function MorePage() {
  const { tx, lang, setLang } = useLang();
  const { session, signOut } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const open = useCases('OPEN');
  const closed = useCases('CLOSED');
  const fus = useFollowUps();
  const userId = session?.account.id ?? '';
  const [drafts, setDrafts] = useState(() => listDrafts(userId).length);
  const [syncing, setSyncing] = useState(false);
  const n = (v: number | undefined) => (v === undefined ? '—' : String(v));

  const sync = async () => {
    setSyncing(true);
    const sent = await syncDrafts(userId);
    setDrafts(listDrafts(userId).length);
    if (sent > 0) await qc.invalidateQueries();
    setSyncing(false);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="grid grid-cols-3 pb-5 pt-4">
        {[
          [tx({ vi: 'Đang đồng hành', en: 'Active' }), n(open.data?.length)],
          [tx({ vi: 'Tới hẹn hỏi thăm', en: 'Check-ins due' }), n(fus.data?.length)],
          [tx({ vi: 'Đã khép lại', en: 'Closed' }), n(closed.data?.length)],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col space-y-1.5 text-center">
            <div className="text-xl font-bold text-primary-gradient">{v}</div>
            <div className="text-2xs text-disabled">{k}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col space-y-9 overflow-y-auto bg-white py-8">
        <Section title={tx({ vi: 'Công cụ', en: 'Tools' })}>
          <div className="grid grid-cols-4 gap-2 pt-6 text-center text-xs">
            <Tool icon={hospital} label={tx({ vi: 'Nơi hỗ trợ', en: 'Support' })} onClick={() => navigate('/support')} />
            <Tool icon={calendar} label={tx({ vi: 'Lịch hẹn', en: 'Schedule' })} onClick={() => navigate('/check-ins')} />
            <SupportCall trigger={(o) => <Tool icon={chatOa} label={tx({ vi: 'Tổng đài', en: 'Hotlines' })} onClick={o} />} />
            <Tool icon={heart} label={session?.trial ? tx({ vi: 'Đăng ký', en: 'Apply' }) : tx({ vi: 'Bản web', en: 'Web' })} onClick={() => (session?.trial ? navigate('/join') : openExternal(WEB_URL))} />
          </div>
        </Section>

        <Section title={tx({ vi: 'Khác', en: 'Other' })}>
          <div className="pt-2">
            {drafts > 0 && (
              <Row label={tx({ vi: `Gửi ${drafts} bản nháp đã lưu trên máy`, en: `Send ${drafts} saved drafts` })} badge={drafts} onClick={sync} right={syncing ? <span className="text-xs text-disabled">…</span> : undefined} />
            )}
            <Row
              label={tx({ vi: 'Ngôn ngữ', en: 'Language' })}
              onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
              right={<span className="rounded-md bg-highlight px-2 py-1 text-xs text-primary">{lang === 'vi' ? 'Tiếng Việt' : 'English'}</span>}
            />
            <Row label={tx({ vi: 'Mở bản web (Mẫu 07, báo cáo)', en: 'Open the web app (Form 07, reports)' })} onClick={() => openExternal(WEB_URL)} />
            <Row label={tx({ vi: 'Đăng xuất', en: 'Sign out' })} onClick={signOut} />
          </div>
          <p className="pt-4 text-center text-2xs text-disabled">{session?.account.email}</p>
        </Section>
      </div>
    </div>
  );
}

function Tool({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2 active:scale-95">
      <img src={icon} alt="" className="h-8 w-8" />
      <div className="text-center text-fg">{label}</div>
    </button>
  );
}

function Row({ label, badge, onClick, right }: { label: string; badge?: number; onClick: () => void; right?: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between py-4 text-left">
      <div className="flex items-center gap-1 text-sm text-fg">
        <div>{label}</div>
        {badge ? <div className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-3xs text-fg">{badge}</div> : null}
      </div>
      {right ?? <ArrowRightIcon className="h-3.5 w-3.5" />}
    </button>
  );
}

