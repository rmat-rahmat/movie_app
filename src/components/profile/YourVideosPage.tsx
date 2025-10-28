'use client';

import React, { useEffect, useState } from 'react';
import LoadingPage from '@/components/ui/LoadingPage';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { DashboardItem } from '@/types/Dashboard';
import { EpisodeVO } from '@/types/Dashboard';
import DashboardSection from '@/components/movie/DashboardSection';
import { FiChevronLeft, FiChevronDown, FiChevronUp, FiEdit, FiTrash2 } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import { getUserUploadedVideos, getSeriesEpisodes } from '@/lib/movieApi';

interface SeriesWithEpisodes extends DashboardItem {
  episodesLoaded?: boolean;
  episodesData?: EpisodeVO[];
  episodesExpanded?: boolean;
  loadingEpisodes?: boolean;
}

export default function YourVideosPage() {
  const { t } = useTranslation('common');
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.isLoading);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SeriesWithEpisodes[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const load = async () => {
      const list = await getUserUploadedVideos(1, 24, '720');
      setItems((list || []) as SeriesWithEpisodes[]);
      setPage(1);
      setHasMore((list && list.length === 24) || false);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleLoadMore = async () => {
    const next = page + 1;
    const list = await getUserUploadedVideos(next, 24, '720');
    if (list && list.length > 0) {
      setItems((s) => [...s, ...(list as SeriesWithEpisodes[])]);
      setPage(next);
      setHasMore(list.length === 24);
    } else {
      setHasMore(false);
    }
  };

  const toggleEpisodes = async (seriesId: string) => {
    const itemIndex = items.findIndex((item) => item.seriesId === seriesId || item.id === seriesId);
    if (itemIndex === -1) return;

    const item = items[itemIndex];
    
    // If already expanded, just collapse
    if (item.episodesExpanded) {
      const updated = [...items];
      updated[itemIndex] = { ...item, episodesExpanded: false };
      setItems(updated);
      return;
    }

    // If episodes not loaded, fetch them
    if (!item.episodesLoaded && !item.loadingEpisodes) {
      const updated = [...items];
      updated[itemIndex] = { ...item, loadingEpisodes: true };
      setItems(updated);

      const result = await getSeriesEpisodes(seriesId, 1, 50, '720');
      
      const updatedAfterLoad = [...items];
      updatedAfterLoad[itemIndex] = {
        ...item,
        episodesLoaded: true,
        episodesData: result?.episodes || [],
        episodesExpanded: true,
        loadingEpisodes: false,
      };
      setItems(updatedAfterLoad);
    } else {
      // Episodes already loaded, just expand
      const updated = [...items];
      updated[itemIndex] = { ...item, episodesExpanded: true };
      setItems(updated);
    }
  };

  if (loading || authLoading || !user) return <LoadingPage />;

  // Separate movies and series
  const movies = items.filter((item) => !item.isSeries);
  const series = items.filter((item) => item.isSeries);

  return (
    <div className="min-h-screen text-white">
      {/* Profile Header */}
      <div className="bg-black flex items-end md:pl-20 overflow-visible py-6">
        <div className="flex items-center gap-4 p-4 z-1">
          <Image 
            src={user?.avatar || '/fallback_poster/sample_poster.png'} 
            alt={user?.nickname || "avatar"} 
            width={50} 
            height={50} 
            className="w-12 h-12 lg:w-16 lg:h-16 rounded-full object-cover" 
          />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">{user?.name || user?.nickname || 'User'}</h1>
            <p className="text-gray-400 text-sm">
              {t('profile.welcome', { name: user?.name || user?.nickname || 'User' })}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-gray-300 hover:text-white flex items-center gap-2">
              <FiChevronLeft /> {t('profile.backToProfile', 'Back to Profile')}
            </Link>
            <h1 className="text-3xl font-bold">{t('profile.YourVideos', 'Your Videos')}</h1>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">{t('profile.noVideos', 'No uploaded videos yet')}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Movies Section */}
            {movies.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">{t('profile.movies', 'Movies')}</h2>
                <DashboardSection
                  title=""
                  videos={movies}
                  onViewMore={undefined}
                />
              </div>
            )}

            {/* Series Section */}
            {series.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">{t('profile.series', 'Series')}</h2>
                <div className="space-y-4">
                  {series.map((seriesItem) => (
                    <div key={seriesItem.id} className="bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Image
                            src={seriesItem.imageQuality?.customCoverUrl || seriesItem.coverUrl || '/fallback_poster/sample_poster.png'}
                            alt={seriesItem.title}
                            width={100}
                            height={150}
                            className="w-24 h-36 object-cover rounded"
                          />
                          <div>
                            <h3 className="text-xl font-semibold">{seriesItem.title}</h3>
                            <p className="text-gray-400 text-sm mt-1">
                              {seriesItem.totalEpisodes ? `${seriesItem.totalEpisodes} ${t('common.episodes', 'episodes')}` : t('common.series', 'Series')}
                              {seriesItem.isCompleted && <span className="ml-2 text-green-500">• {t('common.completed', 'Completed')}</span>}
                            </p>
                            {seriesItem.description && (
                              <p className="text-gray-300 text-sm mt-2 line-clamp-2">{seriesItem.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/upload/series?edit=${seriesItem.seriesId || seriesItem.id}`}
                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded transition"
                            title={t('common.edit', 'Edit')}
                          >
                            <FiEdit className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => toggleEpisodes(seriesItem.seriesId || seriesItem.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#fbb033] hover:bg-[#f69c05] text-black rounded transition font-medium"
                            disabled={seriesItem.loadingEpisodes}
                          >
                            {seriesItem.loadingEpisodes ? (
                              <span>{t('common.loading', 'Loading...')}</span>
                            ) : seriesItem.episodesExpanded ? (
                              <>
                                <FiChevronUp /> {t('common.hideEpisodes', 'Hide Episodes')}
                              </>
                            ) : (
                              <>
                                <FiChevronDown /> {t('common.showEpisodes', 'Show Episodes')}
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Episodes List */}
                      {seriesItem.episodesExpanded && seriesItem.episodesData && (
                        <div className="mt-4 pl-4 border-l-2 border-gray-700">
                          <h4 className="text-lg font-semibold mb-3">{t('common.episodes', 'Episodes')}</h4>
                          {seriesItem.episodesData.length === 0 ? (
                            <p className="text-gray-400">{t('profile.noEpisodesYet', 'No episodes uploaded yet')}</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {seriesItem.episodesData.map((episode) => (
                                <div
                                  key={episode.id}
                                  className="bg-gray-800 rounded p-3 hover:bg-gray-750 transition"
                                >
                                  <div className="flex items-center gap-3">
                                    <Image
                                      src={episode.imageQuality?.customCoverUrl || episode.coverUrl || '/fallback_poster/sample_poster.png'}
                                      alt={episode.title || `Episode ${episode.episodeNumber}`}
                                      width={60}
                                      height={90}
                                      className="w-16 h-24 object-cover rounded"
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold">
                                        {t('common.episode', 'Episode')} {episode.episodeNumber}
                                      </p>
                                      {episode.title && (
                                        <p className="text-sm text-gray-300 mt-1 line-clamp-2">{episode.title}</p>
                                      )}
                                      {episode.duration && (
                                        <p className="text-xs text-gray-400 mt-1">
                                          {Math.floor(episode.duration / 60)} {t('common.min', 'min')}
                                        </p>
                                      )}
                                      <p className="text-xs text-gray-500 mt-1">{episode.status}</p>
                                    </div>
                                    <Link
                                      href={`/upload/series/episode?edit=${episode.id}`}
                                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition"
                                      title={t('common.edit', 'Edit')}
                                    >
                                      <FiEdit className="w-4 h-4" />
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center">
                <button 
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded transition font-medium" 
                  onClick={handleLoadMore}
                >
                  {t('common.loadMore', 'Load More')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
