'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { getUserUploadedVideos } from '@/lib/movieApi';
import ProfileListPage from '@/components/profile/ProfileListPage';

export default function YourVideosPage() {
  const { t } = useTranslation('common');

  return (
    <ProfileListPage
      title={t('profile.YourVideos', 'Your Videos')}
      emptyMessage={t('profile.noVideos', 'No uploaded videos yet')}
      fetchItems={getUserUploadedVideos}
      showClearButton={false}
    />
  );
}
