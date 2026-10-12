import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { BadgeCheck, BarChart3, HeartHandshake, ShieldAlert, BookOpen, CalendarDays, Users, Building2, ChevronDown, ClipboardCheck, ClipboardList, Compass, FileCheck2, FlaskConical, GraduationCap, Home, Inbox, LayoutDashboard, LogIn, LogOut, PhoneCall, Plus, Scale, ShieldCheck, UserCircle2, UserPlus, Wallet } from 'lucide-react';
import { useApp } from './AppContext';
import { Button, Dialog, Field, TextInput, cx } from '../design/ui';
import { DEMO_CODE_REQUIRED_EVENT, setDemoCode, type DemoRole } from '../lib/api';
import { useFollowUps, useReferrals, useEscalations } from '../lib/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { SupportCallMenu } from './SupportCallMenu';
import { STEP_META } from '../design/dashboard';

export function Wordmark({ compact, to = '/' }: { compact?: boolean; to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded-lg py-1" aria-label="NEXTA">
      <img src="/nexta-logo.svg" alt="NEXTA - Bước tiếp • Safe Next Step" className={compact ? 'h-8 w-auto' : 'h-11 w-auto'} />
    </Link>
  );
}

type NavItem = { to: string; label: string; icon: ReactNode; count?: number; mobile: boolean };

interface RoleNavConfig {
  primary: NavItem[];
  secondary: NavItem[];
  action?: { to: string; label: string; icon: ReactNode };
}

/** Landing route for each role inside the workspace. */
export function roleHome(role: string): string {
  switch (role) {
    case 'partner':
      return '/partner';
    case 'coordinator':
    case 'host':
    case 'observer':
      return '/coordinator';
    case 'applicant':
      return '/join/status';
    default:
      return '/navigator';
  }
}

/**
 * Menus follow the mockups: at most five primary jobs per role. Everything else moves under
 * "Thêm & tiện ích" so no existing feature disappears.
 */
function useRoleNav(): RoleNavConfig {
  const { s, role, tx } = useApp();
  const canLoop = role === 'navigator' || role === 'coordinator' || role === 'host';
  const followUps = useFollowUps(canLoop);
  const referrals = useReferrals(role === 'partner' || role === 'coordinator');
  const escalations = useEscalations('OPEN', role === 'coordinator' || role === 'host');
  const inboxCount = (referrals.data ?? []).filter((r) => r.stage === 'CREATED' || r.stage === 'RECEIVED').length;
  const escalationCount = escalations.data?.length ?? 0;
  const dueFollowUps = (followUps.data ?? []).filter((f) => !f.completedAt && new Date(f.dueAt).getTime() < Date.now() + 86_400_000).length;

  const ic = 'size-5 shrink-0';
  const I = {
    today: { to: '/navigator', label: s.nav.today, icon: <Home className={ic} />, mobile: true },
    journeys: { to: '/journeys', label: s.nav.journeys, icon: <ClipboardList className={ic} />, mobile: true },
    followUps: { to: '/navigator/follow-ups', label: tx({ vi: 'Hỏi thăm', en: 'Check-ins' }), icon: <PhoneCall className={ic} />, count: dueFollowUps, mobile: true },
    directory: { to: '/directory', label: tx({ vi: 'Nguồn lực', en: 'Resources' }), icon: <BookOpen className={ic} />, mobile: true },
    privacy: { to: '/privacy', label: tx({ vi: 'Quyền dữ liệu', en: 'Data rights' }), icon: <ShieldCheck className={ic} />, mobile: false },
    campaigns: { to: '/campaigns', label: s.nav.campaigns ?? 'Chiến dịch', icon: <Compass className={ic} />, mobile: false },
    missions: { to: '/missions', label: s.nav.missions ?? 'Nhiệm vụ', icon: <ClipboardCheck className={ic} />, mobile: false },
    training: { to: '/training', label: s.nav.training, icon: <GraduationCap className={ic} />, mobile: false },
    lab: { to: '/living-lab', label: s.nav.livingLab, icon: <FlaskConical className={ic} />, mobile: false },
    partner: { to: '/partner', label: tx({ vi: 'Yêu cầu cần xử lý', en: 'Requests' }), icon: <Inbox className={ic} />, count: inboxCount, mobile: true },
    partnerSchedule: { to: '/partner/schedule', label: tx({ vi: 'Lịch tiếp nhận', en: 'Appointments' }), icon: <CalendarDays className={ic} />, mobile: true },
    partnerResources: { to: '/partner/resources', label: tx({ vi: 'Nguồn lực của bạn', en: 'Your resources' }), icon: <Users className={ic} />, mobile: true },
    partnerResults: { to: '/partner/results', label: tx({ vi: 'Kết quả hỗ trợ', en: 'Outcomes' }), icon: <BarChart3 className={ic} />, mobile: false },
    transparency: { to: '/transparency', label: tx({ vi: 'Minh bạch', en: 'Transparency' }), icon: <Scale className={ic} />, mobile: false },
    coordinator: { to: '/coordinator', label: tx({ vi: 'Tổng quan', en: 'Overview' }), icon: <LayoutDashboard className={ic} />, mobile: true },
    match: { to: '/coordinator/match', label: tx({ vi: 'Điều phối ca', en: 'Allocate' }), icon: <HeartHandshake className={ic} />, mobile: true },
    safety: { to: '/coordinator/safety', label: tx({ vi: 'An toàn', en: 'Safety' }), icon: <ShieldAlert className={ic} />, count: escalationCount, mobile: true },
    reports: { to: '/coordinator/reports', label: tx({ vi: 'Báo cáo', en: 'Reports' }), icon: <BarChart3 className={ic} />, mobile: false },
    partners: { to: '/directory', label: tx({ vi: 'Đối tác', en: 'Partners' }), icon: <Building2 className={ic} />, mobile: true },
    approvals: { to: '/admin/approvals', label: s.nav.approvals, icon: <ClipboardCheck className={ic} />, mobile: false },
    finance: { to: '/admin/finance', label: s.nav.finance, icon: <Wallet className={ic} />, mobile: false },
    status: { to: '/join/status', label: s.nav.myApplication, icon: <FileCheck2 className={ic} />, mobile: true },
    join: { to: '/join', label: s.nav.join, icon: <UserPlus className={ic} />, mobile: true },
  } satisfies Record<string, NavItem>;
  const start = { to: '/journeys/new', label: tx({ vi: 'Bắt đầu hành trình', en: 'Start a journey' }), icon: <Plus className="size-5" aria-hidden /> };

  switch (role) {
    case 'navigator':
      return { primary: [I.today, I.journeys, I.followUps, I.directory, I.privacy], secondary: [I.campaigns, I.missions, I.training, I.lab], action: start };
    case 'partner':
      return { primary: [I.partner, I.partnerSchedule, I.partnerResources, I.partnerResults, I.transparency], secondary: [I.directory, I.campaigns, I.lab, I.privacy] };
    case 'coordinator':
    case 'host':
      return { primary: [I.coordinator, I.match, I.partners, I.safety, I.reports], secondary: [I.journeys, I.approvals, I.finance, I.campaigns, I.lab, I.privacy], action: start };
    case 'observer':
      return { primary: [I.coordinator, I.reports, I.transparency], secondary: [I.lab, I.privacy] };
    case 'applicant':
      return { primary: [I.status, I.join], secondary: [I.lab, I.privacy] };
    default:
      return { primary: [I.today, I.journeys, I.directory], secondary: [I.training, I.lab, I.privacy] };
  }
}

function RoleSwitcher({ vertical, onPicked }: { vertical?: boolean; onPicked?: () => void }) {
  const { s, role, setRole } = useApp();
  const navigate = useNavigate();
  const roles: Array<{ r: DemoRole; home: string; label: string; icon: string }> = [
    { r: 'navigator', home: '/navigator', label: 'Youth Navigator', icon: '👤' },
    { r: 'partner', home: '/partner', label: 'Đối tác', icon: '👥' },
    { r: 'coordinator', home: '/coordinator', label: 'Điều phối viên', icon: '📋' },
  ];
  return (
    <div role="radiogroup" aria-label={s.nav.actingAs} className={cx('rounded-2xl border border-line/80 bg-slate-50 p-1.5', vertical ? 'grid gap-1.5' : 'flex gap-1.5')}>
      {roles.map(({ r, home, label, icon }) => (
        <button
          key={r}
          type="button"
          role="radio"
          aria-checked={role === r}
          onClick={() => {
            setRole(r);
            navigate(home);
            onPicked?.();
          }}
          className={cx(
            'flex min-h-[40px] items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all',
            vertical ? 'text-left w-full' : 'flex-1 justify-center whitespace-normal',
            role === r
              ? 'bg-[#E0F2FE] text-[#0369A1] shadow-xs font-bold border border-sky-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
          )}
        >
          <span className="text-sm shrink-0">{icon}</span>
          <span className="whitespace-nowrap font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}

function AccountBox({ compact }: { compact?: boolean }) {
  const { s, session, signOut, role } = useApp();
  const navigate = useNavigate();
  if (!session) return null;
  return (
    <div className={cx('flex items-center gap-2', compact ? '' : 'rounded-2xl border border-line/80 bg-slate-50 p-2.5')}>
      <BadgeCheck className="size-5 shrink-0 text-emerald-600" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{session.account.fullName || session.account.email}</p>
        <p className="truncate text-xs text-muted">{s.roles[role]}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          signOut();
          navigate('/login');
        }}
        aria-label={s.nav.signOut}
        className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-red-600 transition-colors"
      >
        <LogOut className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export function LangToggle() {
  const { lang, setLang, s } = useApp();
  return (
    <div role="radiogroup" aria-label={s.nav.language} className="flex rounded-xl border border-line bg-surface p-0.5">
      {(['vi', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={lang === l}
          onClick={() => setLang(l)}
          className={cx('min-h-[32px] min-w-[36px] rounded-lg px-2 text-xs font-bold uppercase transition-colors', lang === l ? 'bg-[#0284C7] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900')}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/** Which of the 6 loop steps a screen mainly works on — highlighted in the top stepper. */
function activeStepFor(path: string): number | null {
  if (path.startsWith('/journeys/new')) return 1;
  if (path.startsWith('/journeys/')) return 2;
  if (path.startsWith('/coordinator/match')) return 4;
  if (path === '/partner') return 5;
  if (path.startsWith('/navigator/follow-ups') || path.startsWith('/partner/schedule') || path.startsWith('/partner/results')) return 6;
  return null;
}

/** The 6-step loop, always visible so every role sees where their work sits in the journey. */
export function MiniStepLoop() {
  const { tx } = useApp();
  const { pathname } = useLocation();
  const active = activeStepFor(pathname);
  return (
    <nav aria-label={tx({ vi: 'Hành trình 6 bước', en: '6-step journey' })}>
      <ol className="flex items-center gap-1">
        {STEP_META.map((st, i) => (
          <li key={st.n} className="inline-flex items-center gap-1" aria-current={active === st.n ? 'step' : undefined}>
            <span
              title={tx(st)}
              className={cx(
                'inline-flex select-none items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-semibold xl:px-2.5',
                st.cls,
                active === st.n && 'ring-2 ring-brand ring-offset-1',
              )}
            >
              <span className="tabular font-black">{st.n}</span>
              <span className="hidden whitespace-nowrap xl:inline">{tx(st)}</span>
            </span>
            {i < STEP_META.length - 1 && (
              <span className="text-xs font-bold text-slate-400" aria-hidden>
                –
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Mobile-only: one compact chip in the header opens role / account / language in a bottom sheet. */
function MobileAccountSheet() {
  const { s, role, isDemo, session } = useApp();
  const [open, setOpen] = useState(false);
  const who = session ? session.account.fullName || session.account.email : s.roles[role];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="press inline-flex min-h-[44px] max-w-[46vw] items-center gap-1.5 rounded-full border border-line bg-sunken pl-2 pr-2.5 text-sm font-semibold text-ink"
      >
        <UserCircle2 className="size-5 shrink-0 text-brand" aria-hidden />
        <span className="max-w-[120px] truncate">{who}</span>
        <ChevronDown className="size-4 shrink-0 text-muted" aria-hidden />
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={isDemo ? `${s.nav.demoMode} · ${s.nav.actingAs}` : who} closeLabel={s.common.cancel}>
        <div className="space-y-4">
          {isDemo ? (
            <>
              <RoleSwitcher vertical onPicked={() => setOpen(false)} />
              <Link to="/login" onClick={() => setOpen(false)} className="press flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-line-strong font-semibold text-brand-strong hover:bg-sunken">
                <LogIn className="size-4" aria-hidden />
                {s.nav.signIn}
              </Link>
            </>
          ) : (
            <AccountBox />
          )}
          <div className="flex items-center justify-between">
            <LangToggle />
            <Link to="/privacy" onClick={() => setOpen(false)} className="text-sm font-medium text-muted underline-offset-2 hover:underline">
              {s.nav.privacy}
            </Link>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function DemoCodeDialog() {
  const { tx, s } = useApp();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(DEMO_CODE_REQUIRED_EVENT, show);
    return () => window.removeEventListener(DEMO_CODE_REQUIRED_EVENT, show);
  }, []);
  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      title={tx({ vi: 'Mã truy cập demo', en: 'Demo access code' })}
      closeLabel={s.common.cancel}
      footer={
        <>
          <Link to="/login" onClick={() => setOpen(false)}>
            <Button variant="secondary">{s.nav.signIn}</Button>
          </Link>
          <Button
            disabled={code.trim().length < 4}
            onClick={() => {
              setDemoCode(code.trim());
              setOpen(false);
              qc.invalidateQueries();
            }}
          >
            {s.common.confirm}
          </Button>
        </>
      }
    >
      <p className="mb-3 text-[15px] text-muted">
        {tx({ vi: 'Chế độ demo trên bản chính thức cần mã do nhóm NEXTA cung cấp. Người dùng thật hãy đăng nhập bằng email.', en: 'Demo mode on the live site needs a code from the NEXTA team. Real users should sign in with email.' })}
      </p>
      <Field label={tx({ vi: 'Mã demo', en: 'Demo code' })} htmlFor="democode">
        <TextInput id="democode" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
      </Field>
    </Dialog>
  );
}

/** Paths whose NavLink must match exactly (they have child routes with their own menu entry). */
const EXACT = new Set(['/navigator', '/partner', '/coordinator', '/journeys']);

export function AppShell() {
  const { s, role, isDemo, tx } = useApp();
  const { primary, secondary, action } = useRoleNav();
  const home = roleHome(role);
  // Bottom bar on phones: the role's mobile-first items, with the start action in the middle.
  const mobileItems = primary.filter((it) => it.mobile).slice(0, 4);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[236px_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3">
        {tx({ vi: 'Tới nội dung chính', en: 'Skip to content' })}
      </a>

      <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto border-r border-line bg-surface px-3.5 py-4 lg:flex">
        <Wordmark to={home} />

        {action && (
          <Link to={action.to} className="press mt-5 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-brand px-4 text-[15px] font-bold text-white shadow-xs hover:bg-brand-strong">
            {action.icon}
            <span className="whitespace-nowrap">{action.label}</span>
          </Link>
        )}

        <nav className="mt-5 flex flex-col gap-1" aria-label={tx({ vi: 'Điều hướng chính', en: 'Main navigation' })}>
          {primary.map((it) => (
            <NavLink
              key={it.to + it.label}
              to={it.to}
              end={EXACT.has(it.to)}
              className={({ isActive }) =>
                cx(
                  'flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-[15px] transition-colors',
                  isActive ? 'bg-brand-soft font-bold text-brand-strong' : 'font-medium text-ink-2 hover:bg-sunken',
                )
              }
            >
              <span className="shrink-0">{it.icon}</span>
              <span className="flex-1 whitespace-nowrap">{it.label}</span>
              {Boolean(it.count) && <span className="tabular rounded-full bg-danger px-1.5 text-[11px] font-bold leading-5 text-white">{it.count}</span>}
            </NavLink>
          ))}
        </nav>

        {secondary.length > 0 && (
          <div className="mt-4 border-t border-line pt-3">
            <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted">{tx({ vi: 'Thêm & tiện ích', en: 'More' })}</p>
            <nav className="flex flex-col gap-0.5" aria-label={tx({ vi: 'Tiện ích', en: 'More tools' })}>
              {secondary.map((it) => (
                <NavLink
                  key={it.to + it.label}
                  to={it.to}
                  className={({ isActive }) =>
                    cx('flex min-h-[38px] items-center gap-3 rounded-lg px-3 text-[14px] transition-colors', isActive ? 'bg-sunken font-semibold text-brand-strong' : 'text-muted hover:bg-sunken hover:text-ink')
                  }
                >
                  <span className="shrink-0 [&>svg]:size-4">{it.icon}</span>
                  <span className="flex-1 whitespace-nowrap">{it.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        <div className="mt-auto space-y-2.5 border-t border-line pt-3">
          {isDemo ? (
            <>
              <p className="px-1 text-[10.5px] font-bold uppercase leading-snug tracking-wider text-muted">
                {tx({ vi: 'Chế độ demo · đang dùng với vai trò', en: 'Demo mode · using as' })}
              </p>
              <RoleSwitcher vertical />
              <Link to="/login" className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-line-strong text-sm font-semibold text-brand-strong hover:bg-sunken">
                <LogIn className="size-4" aria-hidden />
                {s.nav.signIn}
              </Link>
            </>
          ) : (
            <AccountBox />
          )}
          <div className="flex items-center justify-between px-1">
            <LangToggle />
            <Link to="/privacy" className="text-xs font-medium text-muted hover:text-brand-strong hover:underline">
              {s.nav.privacy}
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-surface">
          <div className="mx-auto flex w-full max-w-[1440px] items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
            <div className="lg:hidden">
              <Wordmark compact to={home} />
            </div>
            <div className="hidden md:block">
              <MiniStepLoop />
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <div className="lg:hidden">
                <MobileAccountSheet />
              </div>
              <SupportCallMenu />
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto w-full min-w-0 max-w-[1440px] flex-1 overflow-x-clip px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-12">
          <Outlet />
        </main>

        <nav aria-label={tx({ vi: 'Điều hướng', en: 'Navigation' })} className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface shadow-[var(--shadow-float)] lg:hidden">
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${mobileItems.length + (action ? 1 : 0)}, minmax(0, 1fr))` }}>
            {mobileItems.slice(0, 2).map((it) => (
              <MobileTab key={it.to + it.label} item={it} />
            ))}
            {action && (
              <li>
                <NavLink to={action.to} className="press flex min-h-[60px] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold text-brand-strong">
                  <span className="-mt-3 grid size-10 place-items-center rounded-full bg-brand text-white shadow-xs">{action.icon}</span>
                  <span className="max-w-full truncate">{tx({ vi: 'Bắt đầu', en: 'Start' })}</span>
                </NavLink>
              </li>
            )}
            {mobileItems.slice(2).map((it) => (
              <MobileTab key={it.to + it.label} item={it} />
            ))}
          </ul>
        </nav>
      </div>
      <DemoCodeDialog />
    </div>
  );
}

function MobileTab({ item }: { item: NavItem }) {
  return (
    <li>
      <NavLink
        to={item.to}
        end={EXACT.has(item.to)}
        className={({ isActive }) => cx('press relative flex min-h-[60px] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium', isActive ? 'font-bold text-brand-strong' : 'text-muted')}
      >
        {({ isActive }) => (
          <>
            <span className={cx('relative grid h-7 w-12 place-items-center rounded-full', isActive && 'bg-brand-soft')}>
              {item.icon}
              {Boolean(item.count) && (
                <span className="tabular absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full border border-surface bg-danger px-1 text-center text-[10px] font-bold leading-3 text-white">{item.count}</span>
              )}
            </span>
            <span className="max-w-full truncate">{item.label}</span>
          </>
        )}
      </NavLink>
    </li>
  );
}

