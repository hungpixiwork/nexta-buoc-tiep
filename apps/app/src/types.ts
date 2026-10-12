import type { PriorityNeedKey, EncounterCase } from '@buoc-tiep/shared';

export type AppTab = 0 | 1 | 2 | 3 | 4 | 5;

export type AppStepTab1 = 'mindset' | 'priority';

export interface AppState {
  activeTab: AppTab;
  stepInTab1: AppStepTab1;
  selectedPriority: PriorityNeedKey;
  coLanCase: EncounterCase;
  toastMessage?: string | null;
}

export interface NavigationProps {
  onBack?: () => void;
  onNavigateTab?: (tab: AppTab) => void;
}

export interface BeneficiaryCase {
  id: string;
  aliases?: string[];
  name: string;
  genderTitle: string; // 'cô' | 'chú' | 'em'
  location: string;
  occupation: string;
  age?: number;
  currentStep: string;
  activeSegments: number;
  totalSegments: number;
  statusType: 'in_progress' | 'upcoming' | 'completed';
  statusLabel: string;
  avatarBg: string;
  updatedText: string;
  alertTitle: string;
  alertSub: string;
  thankYouText: string;
  isMinor: boolean;
  notes?: string;
}

export interface ScamQuizItem {
  id: string;
  scenario: string;
  isScam: boolean;
  explanation: string;
}
