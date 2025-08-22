'use client';

import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';

export default function SettingsPage() {
  const { t, i18n } = useTranslation('common');

  const currentLang = i18n.language || 'en';

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{t('settings.title') || 'Settings'}</h1>

      <section className="bg-black/70 p-6 rounded-md max-w-xl">
        <h2 className="text-lg font-semibold mb-2">{t('settings.language') || 'Language'}</h2>
        <p className="text-sm text-gray-400 mb-4">{t('settings.current') ? `${t('settings.current')}: ${currentLang}` : `Current: ${currentLang}`}</p>

        <div className="mb-2">
          <LanguageSwitcher />
        </div>

        <p className="text-xs text-gray-500">{t('settings.hint') || 'Your language preference is saved locally.'}</p>
      </section>
    </div>
  );
}
