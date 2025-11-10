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
import { FiMoreVertical, FiTrash2 } from 'react-icons/fi';
import OptionDropdown, { OptionItem } from '@/components/ui/OptionDropdown';

export default function LikedVideosPage() {
  const { t } = useTranslation('common');
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [dropdownState, setDropdownState] = React.useState<{
    videoId: string;
    position: { x: number; y: number };
  } | null>(null);

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

  const handleOptionClick = (videoId: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownState({
      videoId,
      position: {
        x: rect.right - 192, // 192px = w-48 (dropdown width)
        y: rect.bottom + 4,
      },
    });
  };

  const getOptionsForVideo = (videoId: string): OptionItem[] => [
    {
      id: 'unlike',
      label: t('profile.unlike', 'Remove from Liked'),
      icon: <FiTrash2 className="w-4 h-4" />,
      onClick: () => handleUnlike(videoId),
      danger: true,
    },
  ];

  return (
    <div className='container mx-auto px-4'>
      <GridVideos
        key={refreshKey}
        title={t('profile.LikedVideos', 'Liked Videos')}
        spesificApiUrl="/api-movie/v1/like/list"
        mobileListView={true}
        backButton={true}
        optionIcon={<FiMoreVertical className="w-4 h-4" />} 
        onOptionClick={handleOptionClick}
      />

      {dropdownState && (
        <OptionDropdown
          options={getOptionsForVideo(dropdownState.videoId)}
          position={dropdownState.position}
          onClose={() => setDropdownState(null)}
        />
      )}
    </div>
  );
}
