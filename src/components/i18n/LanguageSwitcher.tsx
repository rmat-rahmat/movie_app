'use client';

import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const languageList = [
  { code: 'en', flag: '🇺🇸' },
  { code: 'ms', flag: '🇲🇾' },
  { code: 'zh', flag: '🇨🇳' },
  { code: 'de', flag: '🇩🇪' },
  { code: 'fr', flag: '🇫🇷' },
  { code: 'ru', flag: '🇷🇺' },
  { code: 'ar', flag: '🇸🇦' },
];

export default function LanguageSwitcher({ large }: { large?: boolean }) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguageCode = (i18n.language || 'en').split('-')[0];
  const currentLanguage = languageList.find(l => l.code === currentLanguageCode) || languageList[0];

  const handleLanguageChange = (locale: string) => {
    i18n.changeLanguage(locale);
    localStorage.setItem('seefu-language', locale);
    setIsOpen(false);
  };

  const btnBase = 'flex items-center space-x-2 rounded-md transition-colors';
  const btnSize = large ? 'px-4 py-3 text-lg sm:text-xl' : 'px-3 py-2 text-sm';
  const flagSize = large ? 'text-2xl sm:text-3xl' : 'text-lg';
  const labelVisibility = large ? 'block' : 'hidden sm:block';

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${btnBase} ${btnSize} text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`}
      >
        <span className={flagSize}>{currentLanguage.flag}</span>
        <span className={labelVisibility}>{t(`languages.${currentLanguage.code}`) || currentLanguage.code}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute ${large ? 'left-0 mt-3 w-56' : 'right-0 mt-2 w-48'} bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700`}>
          <div className="py-1">
            {languageList.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`flex items-center space-x-3 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  language.code === currentLanguageCode
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span className={large ? 'text-base' : ''}>{t(`languages.${language.code}`) || language.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
