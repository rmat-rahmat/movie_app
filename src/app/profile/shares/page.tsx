'use client';

// ============================================================================
// SHARED VIDEOS PAGE
// ============================================================================
// Displays videos shared by the user
// Features:
// - Date grouping (today, yesterday, last week, etc.)
// - Mobile list view
// - Back button for navigation
// - Uses GridVideos component for consistent UI
// ============================================================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { getSharesList } from '@/lib/movieApi';
import ProfileListPage from '@/components/profile/ProfileListPage';
import GridVideos from '@/components/movie/GridVideos';

export default function SharedVideosPage() {
  const { t } = useTranslation('common');

  return (
    <GridVideos
      title={t('profile.Share', 'Shared Videos')}
      spesificApiUrl="/api-movie/v1/shares/list" // API endpoint for shared videos
      mobileListView={true}                       // Enable mobile-optimized list view
      backButton={true}                           // Show back navigation button
      groupBy="date"                              // Group videos by date (today, yesterday, etc.)
    />
  );
}
