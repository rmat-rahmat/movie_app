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
      {/* <div className="mb-6">
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
        /> */}
      <div className="mb-6">

        {/* Favorites Section */}
        <div
          className="flex flex-row mb-6 items-center cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push('/profile/favorites/list')}
        >
          <div className="relative">
            <Image
              src={favorites[0]?.imageQuality?.url || fallbackSrc1}
              alt={favorites[0]?.title || "Favorites"}
              width={240}
              height={135}
              className="w-30 md:w-60 h-30 border border-gray-300 rounded-xl lg:min-w-50 lg:min-h-50 mr-2 object-cover
"
            />

            {favorites.length > 0 && (
              <span
                aria-label={`${favorites.length} favorites`}
                className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs font-medium px-2 py-1 r
ounded-full"
              >
                {`${favorites.length} ${t('common.videos', 'Videos')}`}
              </span>
            )}
          </div>
          <h1 className="text-lg font-semibold hover:text-[#fbb033] transition-colors">
            {t('profile.Favorites', 'My Favorites')}
          </h1>
        </div>

        {/* Liked Videos Section */}
        {likedVideos.length > 0 && (
          <div
            className="flex flex-row items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push('/profile/likes')}
          >
            <div className="relative">
              <Image
                src={likedVideos[0]?.imageQuality?.url || ""}
                alt={likedVideos[0]?.title || "Liked Videos"}
                width={240}
                height={135}
                className="w-30 md:w-60 h-30 border border-gray-300 rounded-xl lg:min-w-50 lg:min-h-50 mr-2 object-cov
er"
              />

              {likedVideos.length > 0 && (
                <span
                  aria-label={`${likedVideos.length} liked videos`}
                  className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs font-medium px-2 py-1
 rounded-full"
                >
                  {`${likedVideos.length} ${t('common.videos', 'Videos')}`}
                </span>
              )}
            </div>
            <h1 className="text-lg font-semibold hover:text-[#fbb033] transition-colors">
              {t('profile.LikedVideos', 'Liked Videos')}
            </h1>
          </div>
        )}
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
