'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { getWatchHistoryList, clearWatchHistory } from '@/lib/movieApi';
import ProfileListPage from '@/components/profile/ProfileListPage';

export default function HistoryPage() {
  const { t } = useTranslation('common');

  return (
    <ProfileListPage
      title={t('profile.WatchHistory', 'Watch History')}
      emptyMessage={t('profile.noHistory', 'No watch history')}
      fetchItems={getWatchHistoryList}
      clearItems={clearWatchHistory}
      showClearButton={true}
      clearButtonText={t('profile.clearHistory', 'Clear History')}
      clearConfirmMessage={t('profile.confirmClearHistory', 'Clear watch history? This cannot be undone.')}
    />
  );
}

