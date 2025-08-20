'use client';

import { ReactNode, useEffect } from 'react';
import i18next from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';

// Import translation files
import enCommon from '../../public/locales/en/common.json';
import msCommon from '../../public/locales/ms/common.json';
import zhCommon from '../../public/locales/zh/common.json';
import deCommon from '../../public/locales/de/common.json';
import frCommon from '../../public/locales/fr/common.json';
import ruCommon from '../../public/locales/ru/common.json';
import arCommon from '../../public/locales/ar/common.json';

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
    // Get saved language from localStorage
    const savedLang = localStorage.getItem('seefu-language') || 'en';
    i18next.changeLanguage(savedLang);
  }, []);

  return (
    <I18nextProvider i18n={i18next}>
      {children}
    </I18nextProvider>
  );
}
