import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles.css';
import { AppProvider } from './app/AppContext';
import { AppShell } from './app/AppShell';
import { LandingPage } from './features/landing/LandingPage';
import { TodayPage } from './features/navigator/TodayPage';
import { FollowUpsPage } from './features/navigator/FollowUpsPage';
import { JourneysPage } from './features/navigator/JourneysPage';
import { NewJourneyPage } from './features/navigator/NewJourneyPage';
import { JourneyPage } from './features/navigator/JourneyPage';
import { PartnerInboxPage } from './features/partner/PartnerInboxPage';
import { PartnerResourcesPage } from './features/partner/PartnerResourcesPage';
import { PartnerSchedulePage } from './features/partner/PartnerSchedulePage';
import { CoordinatorPage } from './features/coordinator/CoordinatorPage';
import { MatchPage } from './features/coordinator/MatchPage';
import { ReportsPage } from './features/coordinator/ReportsPage';
import { SafetyPage } from './features/coordinator/SafetyPage';
import { DirectoryPage } from './features/directory/DirectoryPage';
import { LivingLabPage } from './features/pilot/LivingLabPage';
import { PublicShell } from './features/onboarding/PublicShell';
import { JoinPage, LegalPage, LoginPage, PrivacyPage } from './features/onboarding/PublicPages';
import { JoinWizard } from './features/onboarding/JoinWizard';
import { StatusPage, TrainingPage } from './features/onboarding/MemberPages';
import { ApprovalsPage } from './features/onboarding/ApprovalsPage';
import { FinancePage, TransparencyPage } from './features/onboarding/FinancePages';
import { CampaignHubPage } from './features/campaign/CampaignHubPage';
import { CampaignDetailPage } from './features/campaign/CampaignDetailPage';
import { CreateCampaignPage } from './features/campaign/CreateCampaignPage';
import { MissionsPage } from './features/mission/MissionsPage';
import { MissionDetailPage } from './features/mission/MissionDetailPage';

const LegacyRoute = lazy(() => import('./LegacyRoute'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, retry: 1, refetchOnWindowFocus: true } },
});

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  {
    element: <AppShell />,
    children: [
      { path: '/navigator', element: <TodayPage /> },
      { path: '/navigator/follow-ups', element: <FollowUpsPage /> },
      { path: '/journeys', element: <JourneysPage /> },
      { path: '/journeys/new', element: <NewJourneyPage /> },
      { path: '/journeys/:id', element: <JourneyPage /> },
      { path: '/partner', element: <PartnerInboxPage /> },
      { path: '/partner/resources', element: <PartnerResourcesPage /> },
      { path: '/partner/schedule', element: <PartnerSchedulePage /> },
      { path: '/partner/results', element: <PartnerSchedulePage focus="results" /> },
      { path: '/campaigns', element: <CampaignHubPage /> },
      { path: '/campaigns/new', element: <CreateCampaignPage /> },
      { path: '/campaigns/:id', element: <CampaignDetailPage /> },
      { path: '/missions', element: <MissionsPage /> },
      { path: '/missions/:id', element: <MissionDetailPage /> },
      { path: '/coordinator', element: <CoordinatorPage /> },
      { path: '/coordinator/match', element: <MatchPage /> },
      { path: '/coordinator/match/:caseId', element: <MatchPage /> },
      { path: '/coordinator/safety', element: <SafetyPage /> },
      { path: '/coordinator/reports', element: <ReportsPage /> },
      { path: '/directory', element: <DirectoryPage /> },
      { path: '/living-lab', element: <LivingLabPage /> },
      { path: '/training', element: <TrainingPage /> },
      { path: '/admin/approvals', element: <ApprovalsPage /> },
      { path: '/admin/finance', element: <FinancePage /> },
    ],
  },
  {
    element: <PublicShell />,
    children: [
      { path: '/join', element: <JoinPage /> },
      { path: '/join/status', element: <StatusPage /> },
      { path: '/join/:kind', element: <JoinWizard /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/legal/:code', element: <LegalPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
      { path: '/transparency', element: <TransparencyPage /> },
    ],
  },
  {
    path: '/legacy/*',
    element: (
      <Suspense fallback={null}>
        <LegacyRoute />
      </Suspense>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
