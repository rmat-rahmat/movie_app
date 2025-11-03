'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { getSharesList } from '@/lib/movieApi';
import ProfileListPage from '@/components/profile/ProfileListPage';
import GridVideos from '@/components/movie/GridVideos';

export default function LikedVideosPage() {
  const { t } = useTranslation('common');

  return (
    <GridVideos
      title={t('profile.Share', 'Shared Videos')}
      spesificApiUrl="/api-movie/v1/shares/list"
      mobileListView={true}
      backButton={true}
      groupBy="date"
    />
  );
}
