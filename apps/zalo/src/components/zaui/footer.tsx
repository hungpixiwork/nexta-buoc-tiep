import BigPlusIcon from '../icons/big-plus';
import ChatIcon from '../icons/cart';
import ExploreIcon from '../icons/explore';
import FooterWave from '../icons/footer-wave';
import HomeIcon from '../icons/home';
import ProfileIcon from '../icons/profile';
import { useLang, type Copy } from '../../lib/i18n';
import { useRouteHandle } from '../../lib/route';
import TransitionLink from './transition-link';

type NavItem = { name?: Copy; path: string; icon: (p: { active?: boolean }) => JSX.Element };

const NAV_ITEMS: NavItem[] = [
  { name: { vi: 'Hôm nay', en: 'Today' }, path: '/', icon: HomeIcon },
  { name: { vi: 'Nơi hỗ trợ', en: 'Support' }, path: '/support', icon: ExploreIcon },
  // Nút + ở giữa: gặp người mới — việc chính của người đồng hành.
  { path: '/new', icon: () => <BigPlusIcon className="-mt-4 rounded-full shadow-lg shadow-highlight" /> },
  { name: { vi: 'Hỏi thăm', en: 'Check-ins' }, path: '/check-ins', icon: ChatIcon },
  { name: { vi: 'Cá nhân', en: 'Profile' }, path: '/more', icon: ProfileIcon },
];

/** Thanh điều hướng sóng kiểu zaui-doctor; ẩn ở trang con (handle.back). */
export default function Footer() {
  const [handle] = useRouteHandle();
  const { tx } = useLang();
  if (handle.back) return null;
  return (
    <div className="relative w-full">
      <FooterWave className="absolute inset-x-0 bottom-sb z-10 -mb-6 h-24" style={{ filter: 'drop-shadow(0px 4px 20px rgba(0, 0, 0, 0.08))' }} />
      <nav className="relative z-20 grid w-full justify-center bg-white px-4 pb-sb pt-2 text-3xs" style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, 1fr)` }}>
        {NAV_ITEMS.map((item) => (
          <TransitionLink key={item.path} to={item.path} end={item.path === '/'} aria-label={item.name ? tx(item.name) : tx({ vi: 'Gặp người mới', en: 'New person' })} className="flex flex-col items-center space-y-0.5 p-1 active:scale-105">
            {({ isActive }) =>
              item.name ? (
                <>
                  <div className="flex h-6 w-6 items-center justify-center">
                    <item.icon active={isActive} />
                  </div>
                  <div className={`truncate text-2xs ${isActive ? 'text-primary' : 'text-disabled'}`}>{tx(item.name)}</div>
                </>
              ) : (
                <item.icon active={isActive} />
              )
            }
          </TransitionLink>
        ))}
      </nav>
    </div>
  );
}
