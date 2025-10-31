'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { getFavoritesList } from '@/lib/movieApi';
import ProfileListPage from '@/components/profile/ProfileListPage';
import GridVideos from '@/components/movie/GridVideos';

export default function FavoritesListPage() {
  const { t } = useTranslation('common');

  return (
    // <ProfileListPage
    //   title={t('profile.Favorites', 'My Favorites')}
    //   emptyMessage={t('profile.noFavorites', 'No favorite videos yet')}
    //   fetchItems={getFavoritesList}
    //   showClearButton={false}
    // />
     <GridVideos
      title={t('profile.Favorites', 'My Favorites')}
      spesificApiUrl="/api-movie/v1/favorites/list"
      mobileListView={true}
    />
  );
}
