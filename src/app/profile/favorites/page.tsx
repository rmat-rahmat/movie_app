'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { getFavoritesList } from '@/lib/movieApi';
import ProfileListPage from '@/components/profile/ProfileListPage';

export default function FavoritesPage() {
  const { t } = useTranslation('common');

  return (
    <ProfileListPage
      title={t('profile.Favorites', 'My Favorites')}
      emptyMessage={t('profile.noFavorites', 'No favorite videos yet')}
      fetchItems={getFavoritesList}
      showClearButton={false}
    />
  );
}
