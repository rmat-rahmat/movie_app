'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { getWatchHistoryList, clearWatchHistory } from '@/lib/movieApi';
import ProfileListPage from '@/components/profile/ProfileListPage';
import GridVideos from '@/components/movie/GridVideos';
import { FiTrash2 } from 'react-icons/fi';

export default function HistoryPage() {
  const { t } = useTranslation('common');
  const [loading, setLoading] = React.useState(false);


  const handleClear = async () => {
    if (!confirm(t('profile.confirmClearHistory', 'Clear watch history? This cannot be undone.'))) return;
    setLoading(true);
    const ok = await clearWatchHistory();
    setLoading(false);
  };
  if (loading) {
    return <div className="p-4">{t('profile.clearingHistory', 'Clearing watch history...')}</div>;
  }
  return (
    // <ProfileListPage
    //   title={t('profile.WatchHistory', 'Watch History')}
    //   emptyMessage={t('profile.noHistory', 'No watch history')}
    //   fetchItems={getWatchHistoryList}
    //   clearItems={clearWatchHistory}
    //   showClearButton={true}
    //   clearButtonText={t('profile.clearHistory', 'Clear History')}
    //   clearConfirmMessage={t('profile.confirmClearHistory', 'Clear watch history? This cannot be undone.')}
    // />
    <GridVideos
      title={t('profile.WatchHistory', 'Watch History')}
      spesificApiUrl="/api-movie/v1/watch-history/list"
      mobileListView={true}
      backButton={true}
      subHeaderRight={<button
        className="flex rounded-full items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
        onClick={handleClear}
      >
        <FiTrash2 /><span className="hidden md:inline">{t('profile.clearHistory', 'Clear History')}</span>
      </button>}
    />
  );
}

