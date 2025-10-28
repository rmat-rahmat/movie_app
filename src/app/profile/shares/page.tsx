'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { getSharesList } from '@/lib/movieApi';
import ProfileListPage from '@/components/profile/ProfileListPage';

export default function LikedVideosPage() {
  const { t } = useTranslation('common');

  return (
    <ProfileListPage
      title={t('profile.Share', 'Shared Videos')}
      emptyMessage={t('profile.noShares', 'No shared videos yet')}
      fetchItems={getSharesList}
      showClearButton={false}
    />
  );
}
