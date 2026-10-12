import { Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Navigate, Outlet, RouterProvider, createBrowserRouter, useLocation } from 'react-router-dom';
import { App as ZApp, SnackbarProvider } from 'zmp-ui';
import { ApiError } from './lib/api';
import { LangProvider } from './lib/i18n';
import { SessionProvider, useSession } from './lib/session';
import { syncDrafts } from './lib/offline';
import { useRouteHandle } from './lib/route';
import Header from './components/zaui/header';
import Footer from './components/zaui/footer';
import { LoginPage } from './pages/login';
import { WelcomePage } from './pages/welcome';
import { JoinPage } from './pages/join';
import { TodayPage } from './pages/today';
import { NewPersonPage } from './pages/new-person';
import { JourneyPage } from './pages/journey';
import { CheckInsPage } from './pages/check-ins';
import { DirectoryPage } from './pages/directory';
import { MorePage } from './pages/more';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Lỗi quyền/không tìm thấy thì không thử lại vô ích.
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
    },
  },
});

/** Đường dẫn gốc khi chạy trong Zalo (`/zapps/<APP_ID>`) — như template zaui-doctor. */
function getBasePath() {
  const env = new URLSearchParams(window.location.search).get('env');
  const w = window as unknown as { APP_ID?: string; BASE_PATH?: string };
  if (import.meta.env.PROD || env === 'TESTING_LOCAL' || env === 'TESTING' || env === 'DEVELOPMENT') return `/zapps/${w.APP_ID}`;
  return w.BASE_PATH || '';
}

/** Khung chung kiểu zaui-doctor + phân luồng theo vai. */
function Layout() {
  const { session, role } = useSession();
  const location = useLocation();
  const [handle] = useRouteHandle();
  useDraftSync(session?.account.id ?? null);

  if (!session) return <LoginPage />;
  // Mini App chỉ dành cho người đồng hành (kể cả phiên dùng thử). Chưa có vai → Chào mừng / Đăng ký.
  if (role !== 'navigator' && location.pathname !== '/join') return <WelcomePage />;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-fg">
      <Header />
      <div key={location.pathname} className={`animate-enter z-10 flex flex-1 flex-col ${handle.noScroll ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <Suspense>
          <Outlet />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { path: '/', element: <TodayPage /> },
        { path: '/support', element: <DirectoryPage /> },
        { path: '/new', element: <NewPersonPage />, handle: { back: true, title: 'Gặp người mới' } },
        { path: '/check-ins', element: <CheckInsPage /> },
        { path: '/more', element: <MorePage />, handle: { profile: true } },
        { path: '/journey/:id', element: <JourneyPage />, handle: { back: true, title: 'custom' } },
        { path: '/join', element: <JoinPage />, handle: { back: true, title: 'Làm người đồng hành' } },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename: getBasePath() },
);

export default function App() {
  return (
    <ZApp>
      <QueryClientProvider client={queryClient}>
        <LangProvider>
          <SessionProvider>
            <SnackbarProvider>
              <RouterProvider router={router} />
            </SnackbarProvider>
          </SessionProvider>
        </LangProvider>
      </QueryClientProvider>
    </ZApp>
  );
}

/** Gửi lại bản nháp "Gặp người mới" khi mở app và mỗi khi có mạng trở lại. */
function useDraftSync(userId: string | null) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const run = () => {
      syncDrafts(userId).then((n) => {
        if (n > 0) qc.invalidateQueries();
      });
    };
    run();
    window.addEventListener('online', run);
    return () => window.removeEventListener('online', run);
  }, [userId, qc]);
}
