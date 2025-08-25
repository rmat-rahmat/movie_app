'use client';

import { ReactNode, useEffect } from 'react';
import i18next from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';

// Import translation files
import enCommon from '../../../public/locales/en/common.json';
import msCommon from '../../../public/locales/ms/common.json';
import zhCommon from '../../../public/locales/zh/common.json';
import deCommon from '../../../public/locales/de/common.json';
import frCommon from '../../../public/locales/fr/common.json';
import ruCommon from '../../../public/locales/ru/common.json';
import arCommon from '../../../public/locales/ar/common.json';

interface I18nProviderProps {
  children: ReactNode;
}

const resources = {
  en: { common: enCommon },
  ms: { common: msCommon },
  zh: { common: zhCommon },
  de: { common: deCommon },
  fr: { common: frCommon },
  ru: { common: ruCommon },
  ar: { common: arCommon },
};

if (!i18next.isInitialized) {
  i18next
    .use(initReactI18next)
    .init({
      resources,
      lng: 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      defaultNS: 'common',
    });
}

export default function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    // Determine preferred language: saved preference -> system/browser locale -> default 'en'
    if (typeof window === 'undefined') return;

    const supported = ['en', 'ms', 'zh', 'de', 'fr', 'ru', 'ar'];
    const savedLang = localStorage.getItem('OTalk-language');
    let chosen = 'en';

    if (savedLang && supported.includes(savedLang)) {
      chosen = savedLang;
    } else {
      const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
      const normalized = nav.toLowerCase();
      const primary = normalized.split('-')[0];

      if (supported.includes(primary)) {
        chosen = primary;
      } else if (normalized.startsWith('zh')) {
        // map any zh-* to simplified chinese 'zh'
        chosen = 'zh';
      } else if (normalized.startsWith('ms')) {
        chosen = 'ms';
      } else {
        chosen = 'en';
      }

      // Persist the detected preference for subsequent visits
      try {
        localStorage.setItem('OTalk-language', chosen);
      } catch (e) {
        // ignore localStorage errors (e.g., in private mode)
      }
    }

    i18next.changeLanguage(chosen);
  }, []);

  return (
    <I18nextProvider i18n={i18next}>
      {children}
    </I18nextProvider>
  );
}
