import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en } from './locales/en';
import { vi } from './locales/vi';

export const LANGUAGE_STORAGE_KEY = '@buoc_tiep_user_language';

export const defaultNS = 'translation';
export const resources = {
  en: { translation: en },
  vi: { translation: vi },
} as const;

export type SupportedLanguage = 'en' | 'vi';

// Synchronous initial initialization with 'vi' as canonical default
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    lng: 'vi',
    fallbackLng: 'vi',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  } as any);
}

/**
 * Initializes language preference from AsyncStorage.
 * Defaults to 'vi' (Vietnamese default) if no saved preference exists.
 */
export async function initAppLanguage(): Promise<SupportedLanguage> {
  try {
    const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLang === 'en' || savedLang === 'vi') {
      if (i18n.language !== savedLang) {
        await i18n.changeLanguage(savedLang);
      }
      return savedLang;
    }
  } catch (error) {
    console.warn('[i18n] Failed to load saved language preference:', error);
  }
  // Mặc định luôn là tiếng Việt chuẩn theo Mockup gốc
  if (i18n.language !== 'vi') {
    await i18n.changeLanguage('vi');
  }
  return 'vi';
}

/**
 * Switches the active app language and persists the choice to AsyncStorage.
 */
export async function setAppLanguage(lang: SupportedLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    await i18n.changeLanguage(lang);
  } catch (error) {
    console.warn('[i18n] Failed to save language preference:', error);
  }
}

/**
 * Gets the current active language code ('en' | 'vi').
 */
export function getCurrentLanguage(): SupportedLanguage {
  return (i18n.language === 'vi' ? 'vi' : 'en');
}

export default i18n;
