import { useLocation, useNavigate } from 'react-router-dom';
import { BackIcon } from '../icons/back';
import HeaderShieldIcon from '../icons/header-shield';
import { useLang } from '../../lib/i18n';
import { useRouteHandle } from '../../lib/route';
import { useSession } from '../../lib/session';
import { useCustomTitle } from '../../lib/title';

/** Header kiểu zaui-doctor: trang chính có nền gradient + khiên; trang con có nút quay lại + tiêu đề. */
export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [handle] = useRouteHandle();
  const { tx } = useLang();
  const { session } = useSession();
  const custom = useCustomTitle();
  const main = !handle.back;
  const showBack = location.key !== 'default' || handle.back;
  const name = session?.account.fullName ?? session?.account.email ?? '';
  const initials = name.replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'N';
  const demo = session?.trial || session?.demo;

  return (
    <header className={`w-full flex-none space-x-2 px-4 pb-2 pr-[90px] pt-st ${main ? '' : 'bg-white'}`}>
      <div className="flex min-h-12 items-center">
        {main ? (
          <>
            <div className="fixed inset-0 z-0 h-[230px] bg-gradient-to-br from-highlight from-[1.36%] to-background to-[61.49%]" />
            <HeaderShieldIcon className="fixed right-0 top-0" />
            <div className="relative z-10 flex min-w-0 items-center gap-2">
              {handle.profile ? (
                <div className="flex items-center space-x-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-white bg-highlight text-base font-semibold text-primary">{initials}</span>
                  <div className="max-w-40 truncate font-medium text-fg">{name}</div>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 whitespace-nowrap text-primary">
                  <h1 className="text-xl font-bold">BƯỚC TIẾP</h1>
                  <span>|</span>
                  <span className="text-base">{tx({ vi: 'Chào bạn', en: 'Hello' })}</span>
                </div>
              )}
              {demo && <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-3xs font-semibold text-fg">Demo</span>}
            </div>
          </>
        ) : (
          <>
            {showBack && (
              <button type="button" className="cursor-pointer px-2 py-1" aria-label={tx({ vi: 'Quay lại', en: 'Back' })} onClick={() => navigate(-1)}>
                <BackIcon />
              </button>
            )}
            <div className="truncate text-xl font-medium text-fg">{handle.title === 'custom' ? custom : handle.title}</div>
          </>
        )}
      </div>
    </header>
  );
}
