import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en } from './locales/en';
import { vi } from './locales/vi';
import { enXA } from './locales/en-XA';

export type Locale = 'en' | 'vi' | 'en-XA';

interface I18nContextType {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const dictionaries: Record<Locale, any> = {
  en,
  vi,
  'en-XA': enXA,
};

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (path) => path,
});

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem('buoc_tiep_web_locale');
      if (saved === 'vi' || saved === 'en' || saved === 'en-XA') return saved;
    } catch {
      // ignore
    }
    return 'en'; // Default canonical language per spec
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem('buoc_tiep_web_locale', newLocale);
    } catch {
      // ignore
    }
  };

  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current = dictionaries[locale];
    let fallback = dictionaries.en;

    // Traverse selected locale
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        current = undefined;
        break;
      }
    }

    // Traverse fallback canonical EN if needed
    for (const key of keys) {
      if (fallback && typeof fallback === 'object' && key in fallback) {
        fallback = fallback[key];
      } else {
        fallback = undefined;
        break;
      }
    }

    let result = typeof current === 'string' ? current : typeof fallback === 'string' ? fallback : path;

    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }

    return result;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
