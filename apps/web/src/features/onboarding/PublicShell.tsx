import { Link, NavLink, Outlet } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { LangToggle, Wordmark, roleHome } from '../../app/AppShell';
import { SupportCallMenu } from '../../app/SupportCallMenu';
import { cx } from '../../design/ui';

/** Lightweight shell for public pages: join, sign in, legal, transparency, data rights. */
export function PublicShell() {
  const { s, session, role } = useApp();
  const links = [
    { to: '/join', label: s.nav.join },
    { to: '/living-lab', label: s.nav.livingLab },
    { to: '/transparency', label: s.nav.transparency },
  ];
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
          <Wordmark />
          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Public">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => cx('min-h-[40px] rounded-lg px-3 py-2 text-sm font-semibold', isActive ? 'bg-brand-soft text-brand-strong' : 'text-ink-2 hover:bg-sunken')}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LangToggle />
            {session ? (
              <Link to={roleHome(role)} className="hidden min-h-[44px] items-center rounded-xl border border-line-strong px-3 font-semibold text-brand-strong hover:bg-sunken sm:inline-flex">
                NEXTA →
              </Link>
            ) : (
              <Link to="/login" className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-line-strong px-3 font-semibold text-brand-strong hover:bg-sunken">
                <LogIn className="size-4" aria-hidden />
                <span className="hidden sm:inline">{s.nav.signIn}</span>
              </Link>
            )}
            <SupportCallMenu />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-line px-4 py-1.5 md:hidden" aria-label="Public">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => cx('min-h-[40px] shrink-0 rounded-lg px-3 py-2 text-sm font-semibold', isActive ? 'bg-brand-soft text-brand-strong' : 'text-ink-2')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:py-10">
        <Outlet />
      </main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap gap-x-5 gap-y-2 px-4 py-5 text-sm text-muted">
          <Link to="/legal/TERMS" className="hover:underline">{s.nav.join === 'Join' ? 'Terms' : 'Điều khoản'}</Link>
          <Link to="/legal/PRIVACY_NOTICE" className="hover:underline">{s.nav.join === 'Join' ? 'Privacy notice' : 'Thông báo dữ liệu'}</Link>
          <Link to="/legal/SAFEGUARDING_POLICY" className="hover:underline">Safeguarding</Link>
          <Link to="/privacy" className="hover:underline">{s.nav.privacy}</Link>
          <span className="ml-auto">NEXTA · Living Lab Hóc Môn – Quận 12</span>
        </div>
      </footer>
    </div>
  );
}
