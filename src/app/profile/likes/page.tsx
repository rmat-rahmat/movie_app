'use client';

// ============================================================================
// LIKED VIDEOS PAGE
// ============================================================================
// Displays user's liked videos in a grid layout
// Features:
// - Mobile list view with video details
// - Back button for navigation
// - Uses GridVideos component for consistent UI
// - Fetches data from /api-movie/v1/like/list endpoint
// ============================================================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { getVideoLikeList,toggleVideoLike } from '@/lib/movieApi';
import ProfileListPage from '@/components/profile/ProfileListPage';
import GridVideos from '@/components/movie/GridVideos';
import { FiTrash2 } from 'react-icons/fi';

export default function LikedVideosPage() {
  const { t } = useTranslation('common');
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleUnlike = async (videoId: string) => {
      if (!confirm(t('profile.confirmUnLiked', 'Are you sure you want to unlike this video?'))) {
        return;
      }
  
      try {
         const result = await toggleVideoLike(String(videoId));
        if (result.success) {
          // Refresh the grid by changing key
          setRefreshKey(prev => prev + 1);
          alert(t('profile.unLikedSuccess', 'Removed from favorites'));
        } else {
          alert(result.message || t('profile.unLikedFail', 'Failed to unlike the video'));
        }
      } catch (error) {
        console.error('Error unLikedFail:', error);
        alert(t('profile.unLikedFail', 'Failed to unlike the video'));
      }
    };
  return (
    <div className='container mx-auto px-4'>

    <GridVideos
      key={refreshKey}
      title={t('profile.LikedVideos', 'Liked Videos')}
      spesificApiUrl="/api-movie/v1/like/list"
      mobileListView={true}
      backButton={true}
      optionIcon={<FiTrash2 className="w-4 h-4" />} 
      onOptionClick={handleUnlike}
    />
    </div>
  );
}
