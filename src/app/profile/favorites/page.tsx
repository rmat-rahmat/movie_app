'use client';

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getFavoritesList, getVideoLikeList } from '@/lib/movieApi';
import ProfileWrapper from '../ProfileWrapper';
import { DashboardItem } from '@/types/Dashboard';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import DashboardSection from '@/components/movie/DashboardSection';

export default function FavoritesPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isloading, setIsLoading] = React.useState(true);
  const [favorites, setFavorites] = React.useState<DashboardItem[]>([]);
  const [likedVideos, setLikedVideos] = React.useState<DashboardItem[]>([]);


  const fallbackSrc2 = '/fallback_poster/sample_poster.png';
  const fallbackSrc1 = '/fallback_poster/sample_poster1.png';

  useEffect(() => {
    // ensure auth is loaded

    const fetchData = async () => {
      const favs = await getFavoritesList(1, 12, '480');
      setFavorites(favs || []);

      const likes = await getVideoLikeList(1, 12, '480');
      setLikedVideos(likes || []);

      setIsLoading(false);
    };
    fetchData();
  }, []);
  return (
    <ProfileWrapper title={t('profile.playlists', 'My Playlists')}>
      <div className="mb-6">
         <DashboardSection
          title={t('profile.LikedVideos', 'Liked Videos')}
          videos={likedVideos}
          onViewMore={()=>router.push('/profile/likes')}
          />
      </div>
        <DashboardSection
          title={t('profile.playlists', 'My Playlists')}
          videos={favorites}
          onViewMore={()=>router.push('/profile/favorites/list')}
        />
       
    </ProfileWrapper>
  )
  // return (
  //   <ProfileListPage
  //     title={t('profile.Favorites', 'My Favorites')}
  //     emptyMessage={t('profile.noFavorites', 'No favorite videos yet')}
  //     fetchItems={getFavoritesList}
  //     showClearButton={false}
  //   />
  // );


}
