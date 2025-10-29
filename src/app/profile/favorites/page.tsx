'use client';

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getFavoritesList, getVideoLikeList } from '@/lib/movieApi';
import ProfileListPage from '@/components/profile/ProfileListPage';
import ProfileWrapper from '../ProfileWrapper';
import { DashboardItem } from '@/types/Dashboard';
import Image from 'next/image';

export default function FavoritesPage() {
  const { t } = useTranslation('common');
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

        <div className="flex flex-row mb-6 items-center">
          <div className="relative">
            <Image src={favorites[0]?.imageQuality?.url || fallbackSrc1} alt={favorites[0]?.title || ""} width={60} height={30} className="w-60 h-30 border-1 border-gray-300 rounded-xl cursor-pointer lg:min-w-50 lg:min-h-50 rounded mr-2 object-cover" />

            {favorites.length > 0 && (
              <span
                aria-label={`${favorites.length} favorites`}
                className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs font-medium px-2 py-1 rounded-full"
              >
                {`${favorites.length} ${t('common.videos', 'Videos')}`}
              </span>
            )}
          </div>
          <h1 className="text-lg font-semibold">{t('profile.favorites', 'My Favorites')}</h1>
        </div>
        {likedVideos.length > 0 &&
          <div className=" flex flex-row items-center  ">
            <div className="relative  ">
              <Image src={likedVideos[0]?.imageQuality?.url || ""} alt={likedVideos[0]?.title || ""} width={60} height={30} className="w-60 h-30 lg:min-w-50 lg:min-h-50 rounded mr-2 object-cover" />

              {likedVideos.length > 0 && (
                <span
                  aria-label={`${likedVideos.length} liked videos`}
                  className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs font-medium px-2 py-1 rounded-full"
                >
                  {likedVideos.length}
                </span>
              )}
            </div>
            <h1 className="text-lg font-semibold">{t('profile.likedVideos', 'My Liked Videos')}</h1>
          </div>
        }

      </div>
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
