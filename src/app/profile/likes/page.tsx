'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { getVideoLikeList } from '@/lib/movieApi';
import ProfileListPage from '@/components/profile/ProfileListPage';

export default function LikedVideosPage() {
  const { t } = useTranslation('common');

  return (
    <ProfileListPage
      title={t('profile.LikedVideos', 'Liked Videos')}
      emptyMessage={t('profile.noLikes', 'No liked videos yet')}
      fetchItems={getVideoLikeList}
      showClearButton={false}
    />
  );
}
