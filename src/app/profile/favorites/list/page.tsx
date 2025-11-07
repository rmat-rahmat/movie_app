'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getFavoritesList, toggleFavorite } from '@/lib/movieApi';
import ProfileListPage from '@/components/profile/ProfileListPage';
import GridVideos from '@/components/movie/GridVideos';
import { FiTrash2 } from 'react-icons/fi';

export default function FavoritesListPage() {
  const { t } = useTranslation('common');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUnfavorite = async (videoId: string) => {
    if (!confirm(t('profile.confirmUnfavorite', 'Are you sure you want to remove this from favorites?'))) {
      return;
    }

    try {
      const result = await toggleFavorite(videoId);
      if (result.success) {
        // Refresh the grid by changing key
        setRefreshKey(prev => prev + 1);
        alert(t('profile.unfavoriteSuccess', 'Removed from favorites'));
      } else {
        alert(result.message || t('profile.unfavoriteFailed', 'Failed to remove from favorites'));
      }
    } catch (error) {
      console.error('Error unfavoriting:', error);
      alert(t('profile.unfavoriteFailed', 'Failed to remove from favorites'));
    }
  };

  return (
    <div className='container mx-auto px-4'>
      <GridVideos
        key={refreshKey}
        title={t('profile.Favorites', 'My Favorites')}
        spesificApiUrl="/api-movie/v1/favorites/list"
        mobileListView={true}
        backButton
        onOptionClick={handleUnfavorite}
        optionIcon={<FiTrash2 className="w-4 h-4" />} 
      />
    </div>
  );
}
