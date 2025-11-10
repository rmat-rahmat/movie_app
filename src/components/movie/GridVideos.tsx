'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getGridVideos, getCachedCategories, loadMoreSectionContent, loadMoreFromURL } from '@/lib/movieApi';
import type { VideosApiResponse, VideoVO, CategoryItem, SectionContentVO } from '@/types/Dashboard';
import LoadingPage from '@/components/ui/LoadingPage';
import DashboardItem from './DashboardItem';
import { useRouter } from 'next/navigation';
import MovieModal from './MovieModal';
import Link from 'next/link';
import { FiChevronLeft, FiChevronsLeft, FiMoreVertical } from 'react-icons/fi';

interface GridVideosProps {
  id?: string;
  title?: string;
  ctg?: string;
  spesificApiUrl?: string;
  backButton?: boolean;
  subHeaderRight?: React.ReactNode;
  mobileListView?: boolean;
  groupBy?: 'date' | 'alphabet' | 'none';
  hideIfEmpty?: boolean;
  onOptionClick?: (videoId: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  optionIcon?: React.ReactNode;
}
;
const GridVideos: React.FC<GridVideosProps> = ({ id, title, ctg, spesificApiUrl, backButton, subHeaderRight, mobileListView, groupBy = 'none', hideIfEmpty, onOptionClick, optionIcon }) => {
  const [videos, setVideos] = useState<VideoVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1); // API uses 1-based pages
  const [pageInfo, setPageInfo] = useState<VideosApiResponse['pageInfo'] | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actualtitle, setActualtitle] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoVO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const router = useRouter();

  const { t } = useTranslation('common');

  const pageSize = 21;

  // Fetch category name on component mount

  // Check if we're on desktop/tablet or mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768); // md breakpoint
    };

    // Initial check
    checkScreenSize();

    // Listen for resize events
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Set up intersection observer for infinite scroll on mobile (same behavior as CategoryVideos)
  useEffect(() => {
    if (isDesktop || !pageInfo?.hasNext || loadingMore) return;

    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
        handleLoadMore();
      } else if (!target.isIntersecting) {
        setHasIntersected(false);
      }
    }, {
      threshold: 0.1, // Trigger when 10% of the target is visible
      rootMargin: '100px', // Start loading before reaching the end
    });

    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [isDesktop, pageInfo?.hasNext, loadingMore, hasIntersected]);


  const fetchVideos = useCallback(async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }
      let response: SectionContentVO | undefined;

      // Convert 1-based page to 0-based for API call
      if (spesificApiUrl) {
        console.log("Using specific API URL:", spesificApiUrl);
        // TODO: Fetch from spesificApiUrl if needed, fallback to empty response for now
        // response = {
        //   videos: [],
        //   total: 0,
        //   totalPages: 1,
        // };
        const res = await loadMoreFromURL(
          spesificApiUrl,
          '720',
          page,
          pageSize
        );

        console.log("response getGridVideos", res);
        if (!res) {
          throw new Error('Failed to fetch videos');
        }
        response = res;
      }
      else {
        const res = await loadMoreSectionContent(
          id || "",
          ctg || 'movie',
          '720',
          page,
          pageSize
        );

        console.log("response getGridVideos", res);
        if (!res) {
          throw new Error('Failed to fetch videos');
        }
        response = res;
      }

      // if (!response.success) {
      //   throw new Error(response.message || 'API request failed');
      // }

      // Normalize contents whether API returns an array directly or an object with `contents` property
      const data: unknown = response?.videos || response?.contents || response?.records;
      console.log("data getGridVideos", data);
      let contents: VideoVO[] = [];
      if (Array.isArray(data)) {
        contents = data as VideoVO[];
      } else if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        if (Array.isArray(obj.contents)) {
          contents = obj.contents as VideoVO[];
        }
      }

      if (append) {
        setVideos(prev => [...prev, ...contents]);
      } else {
        setVideos(contents);
      }

      // Safely derive pagination values from the unknown `data`
      const raw: Record<string, unknown> = data as Record<string, unknown>;
      const total: number = response?.total || 0;
      const totalPages: number = response?.totalPages || 1;

      const hasNext = page < totalPages;
      const hasPrevious = page > 1;

      setPageInfo({
        page,
        size: pageSize,
        total,
        totalPages,
        getTotalPages: totalPages,
        hasNext,
        hasPrevious
      });
      setCurrentPage(page);
      // Update actual title from cached categories if available
      const cachedCategories = getCachedCategories();
      if (cachedCategories && Array.isArray(cachedCategories)) {
        const matched: CategoryItem | undefined = cachedCategories.find((c) =>
          String(c.id) === String(id) || c.categoryAlias === id || c.categoryName === id
        );

        if (matched) {
          setActualtitle(matched.categoryName || matched.categoryAlias || String(matched.id));
        } else {
          setActualtitle(null);
        }
      } else {
        setActualtitle(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      if (!append) {
        setVideos([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [id, pageSize]);

  useEffect(() => {
    fetchVideos(1); // Start with page 1 (converted to 0-based in fetchVideos)
  }, [fetchVideos]);

  const handleLoadMore = () => {
    if (pageInfo?.hasNext && !loadingMore) {
      fetchVideos(currentPage + 1, true);
    }
  };

  const handlePageChange = (page: number) => {
    fetchVideos(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVideoClick = (video: VideoVO) => {
    router.push(`/videoplayer?directid=${encodeURIComponent(video.id)}`);
    // setSelectedVideo(video);
    // setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedVideo(null);
    setIsModalOpen(false);
  };

  // Group videos by date if groupBy is 'date'
  const groupedVideos = useMemo(() => {
    if (groupBy !== 'date') {
      return { none: videos };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: Record<string, VideoVO[]> = {
      today: [],
      yesterday: [],
      day3: [],
      day4: [],
      day5: [],
      day6: [],
      day7: [],
      thisWeek: [],
      thisMonth: [],
      thisYear: [],
      older: []
    };

    videos.forEach(video => {
      const videoDate = video.createdAt ? new Date(video.createdAt) : null;
      if (!videoDate) {
        groups.older.push(video);
        return;
      }

      const videoDateOnly = new Date(videoDate.getFullYear(), videoDate.getMonth(), videoDate.getDate());
      const diffDays = Math.floor((today.getTime() - videoDateOnly.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        groups.today.push(video);
      } else if (diffDays === 1) {
        groups.yesterday.push(video);
      } else if (diffDays === 2) {
        groups.day3.push(video);
      } else if (diffDays === 3) {
        groups.day4.push(video);
      } else if (diffDays === 4) {
        groups.day5.push(video);
      } else if (diffDays === 5) {
        groups.day6.push(video);
      } else if (diffDays === 6) {
        groups.day7.push(video);
      } else if (diffDays <= 30) {
        groups.thisWeek.push(video);
      } else if (diffDays <= 365) {
        groups.thisMonth.push(video);
      } else if (videoDate.getFullYear() === now.getFullYear()) {
        groups.thisYear.push(video);
      } else {
        groups.older.push(video);
      }
    });

    // Remove empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([_, videos]) => videos.length > 0)
    );
  }, [videos, groupBy]);

  // Get label for date group
  const getGroupLabel = (groupKey: string): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (groupKey) {
      case 'today':
        return t('date.today', 'Today');
      case 'yesterday':
        return t('date.yesterday', 'Yesterday');
      case 'day3':
        const day3 = new Date(today);
        day3.setDate(day3.getDate() - 2);
        return day3.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      case 'day4':
        const day4 = new Date(today);
        day4.setDate(day4.getDate() - 3);
        return day4.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      case 'day5':
        const day5 = new Date(today);
        day5.setDate(day5.getDate() - 4);
        return day5.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      case 'day6':
        const day6 = new Date(today);
        day6.setDate(day6.getDate() - 5);
        return day6.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      case 'day7':
        const day7 = new Date(today);
        day7.setDate(day7.getDate() - 6);
        return day7.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      case 'thisWeek':
        return t('date.thisWeek', 'This Week');
      case 'thisMonth':
        return t('date.thisMonth', 'This Month');
      case 'thisYear':
        return t('date.thisYear', 'This Year');
      case 'older':
        return t('date.older', 'Older');
      default:
        return groupKey;
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (videos.length === 0 && hideIfEmpty) {
    return null;
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">{title || t('grid.title', 'Videos')}</h1>
        <div className="mt-6 text-center">
          <div className="text-red-500 mb-4">{t('grid.errorPrefix', 'Error')}: {error}</div>
          <button
            onClick={() => fetchVideos(1)} // Reset to first page (1-based)
            className="bg-[#fbb033] text-black px-4 py-2 rounded-lg hover:bg-[#f69c05] transition-colors"
          >
            {t('grid.tryAgain', 'Try Again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {title && <div className="flex items-center justify-between mb-6 p-1">
        <div className="flex items-center ">
          {backButton && <span onClick={() => router.back()} className="text-gray-300 hover:text-white flex items-center cursor-pointer">
            <FiChevronLeft size={26} /> <span className="hidden md:inline mr-2">{t('profile.back', 'Back')}</span>
          </span>}
          <h1 className="text-xl md:text-3xl font-bold">{title || t('grid.title', 'Videos')}</h1>
        </div>
        {subHeaderRight && <>{subHeaderRight}</>}
      </div>}
      {pageInfo && (
        <div className="mt-2 text-sm text-gray-400">
          {t('grid.showingVideos', 'Showing {{count}} of {{total}} videos', { count: videos?.length, total: pageInfo.total })}
        </div>
      )}

      <section className="mt-6">
        {videos?.length === 0 ? (
          <p className="text-gray-400">{t('grid.noVideos', 'No videos found in this category.')}</p>
        ) : (
          <>
            {groupBy === 'date' ? (
              // Grouped by date view
              <div className="space-y-8">
                {Object.entries(groupedVideos).map(([groupKey, groupVideos]) => (
                  <div key={groupKey}>
                    {/* Group header */}
                    <h2 className="text-xl font-semibold mb-4 text-[#fbb033]">
                      {getGroupLabel(groupKey)}
                    </h2>

                    {/* Desktop Grid View */}
                    <div className={`${mobileListView ? 'hidden md:grid' : 'grid'} grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-1 md:gap-4 gap-y-2`}>
                      {groupVideos.map((video, index) => (
                        <DashboardItem
                          key={video.id || index}
                          video={video}
                          index={index}
                          showRating={!!video.rating}
                          showViewer={!!video.views}
                          onClick={() => handleVideoClick(video)}
                          onOptionsClick={onOptionClick}
                          optionIcon={optionIcon}
                        />
                      ))}
                    </div>

                    {/* Mobile List View */}
                    {mobileListView && (
                      <div className="md:hidden flex flex-col gap-4">
                        {groupVideos.map((video, index) => (
                          <div
                            key={video.id || index}
                            onClick={() => handleVideoClick(video)}
                            className="flex gap-3 bg-gray-800/50 rounded-lg overflow-hidden hover:bg-gray-700/50 transition-colors cursor-pointer"
                          >
                            {/* Thumbnail */}
                            <div className="relative w-32 h-20 flex-shrink-0">
                              <img
                                src={video.imageQuality?.url || video.coverUrl || '/fallback_poster/sample_poster.png'}
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                              {video.isSeries && (
                                <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                                  {t('common.series', 'Series')}
                                </span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 py-2 pr-2 min-w-0">
                              <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                                {video.title}
                              </h3>

                              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                                {video.year && <span>{video.year}</span>}
                                {video.rating && (
                                  <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span>{video.rating.toFixed(1)}</span>
                                  </div>
                                )}
                                {video.views && (
                                  <div className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span>{video.views}</span>
                                  </div>
                                )}
                              </div>

                              {video.description && (
                                <p className="text-xs text-gray-400 line-clamp-2">
                                  {video.description}
                                </p>
                              )}
                            </div>
                            {onOptionClick && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOptionClick(video.id,e);
                                }}
                                className=" z-10 flex items-center justify-center w-8 h-8 bg-black/70 hover:bg-[#fbb033] text-white hover:text-black rounded-full transition-all duration-200 cursor-pointer"
                                title="Options"
                              >
                                {optionIcon || <FiMoreVertical className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Regular ungrouped view
              <>
                {/* Desktop Grid View */}
                <div className={`${mobileListView ? 'hidden md:grid' : 'grid'} grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-1 md:gap-4 gap-y-2`}>
                  {videos?.map((video, index) => (
                    <DashboardItem
                      key={video.id || index}
                      video={video}
                      index={index}
                      showRating={!!video.rating}
                      showViewer={!!video.views}
                      onClick={() => handleVideoClick(video)}
                      onOptionsClick={onOptionClick}
                      optionIcon={optionIcon}
                    />
                  ))}
                </div>

                {/* Mobile List View - Only shown when mobileListView is true */}
                {mobileListView && (
                  <div className="md:hidden flex flex-col gap-4">
                    {videos?.map((video, index) => (
                      <div
                        key={video.id || index}
                        onClick={() => handleVideoClick(video)}
                        className="flex gap-3 bg-gray-800/50 rounded-lg overflow-hidden hover:bg-gray-700/50 transition-colors cursor-pointer"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-32 h-20 flex-shrink-0">
                          <img
                            src={video.imageQuality?.url || video.coverUrl || '/fallback_poster/sample_poster.png'}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          {video.isSeries && (
                            <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                              {t('common.series', 'Series')}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 py-2 pr-2 min-w-0">
                          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                            {video.title}
                          </h3>

                          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                            {video.year && <span>{video.year}</span>}
                            {video.rating && (
                              <div className="flex items-center gap-1">
                                <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span>{video.rating.toFixed(1)}</span>
                              </div>
                            )}
                            {video.views && (
                              <div className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>{video.views}</span>
                              </div>
                            )}
                          </div>

                          {video.description && (
                            <p className="text-xs text-gray-400 line-clamp-2">
                              {video.description}
                            </p>
                          )}
                        </div>
                         {onOptionClick && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOptionClick(video.id, e);
                                }}
                                className=" z-10 flex self-center items-center justify-center w-8 h-8 bg-black/70 hover:bg-[#fbb033] text-white hover:text-black rounded-full transition-all duration-200 cursor-pointer"
                                title="Options"
                              >
                                {optionIcon || <FiMoreVertical className="w-4 h-4" />}
                              </button>
                            )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Mobile Infinite Scroll Sentinel */}
            {pageInfo?.hasNext && (
              !isDesktop && (
                <div
                  id="scroll-sentinel"
                  className="h-20 flex items-center justify-center"
                >
                  {loadingMore && (
                    <div className="animate-pulse text-gray-400">{t('grid.loadingMore', 'Loading more videos...')}</div>
                  )}
                </div>
              )
            )}

            {/* Pagination */}
            {isDesktop && pageInfo && pageInfo.totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pageInfo.hasPrevious}
                  className="px-3 py-2 rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  {t('grid.previous', 'Previous')}
                </button>

                <div className="flex items-center gap-1">
                  {/*
                  Compute visible page range (up to 5 pages) centered around currentPage
                  */}
                  {(() => {
                    const totalPages = pageInfo.totalPages;
                    const visible = Math.min(5, totalPages);
                    let start = 1;
                    if (totalPages <= 5) {
                      start = 1;
                    } else if (currentPage < 4) {
                      start = 1;
                    } else if (currentPage > totalPages - 3) {
                      start = totalPages - 4;
                    } else {
                      start = currentPage - 2;
                    }
                    const pages = Array.from({ length: visible }, (_, i) => start + i);

                    return (
                      <>
                        {/* First page button */}
                        <button
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                        >
                          {t('grid.first', 'First')}
                        </button>

                        {/* Ellipsis if there's a gap between first and shown pages */}
                        {start > 2 && (
                          <span className="px-2 py-2 text-gray-300">...</span>
                        )}

                        {/* Page number buttons */}
                        <div className="flex gap-1">
                          {pages.map((pageNum) => (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 rounded transition-colors ${pageNum === currentPage
                                ? 'bg-[#fbb033] text-black'
                                : 'bg-gray-700 text-white hover:bg-gray-600 cursor-pointer'
                                }`}
                            >
                              {pageNum}
                            </button>
                          ))}
                        </div>

                        {/* Ellipsis if there's a gap between shown pages and last */}
                        {start + visible - 1 < totalPages - 1 && (
                          <span className="px-2 py-2 text-gray-300">...</span>
                        )}

                        {/* Last page button */}
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors cursor-pointer"
                        >
                          {t('grid.last', 'Last')}
                        </button>
                      </>
                    );
                  })()}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pageInfo.hasNext}
                  className="px-3 py-2 rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors cursor-pointer"
                >
                  {t('grid.next', 'Next')}
                </button>
              </div>
            )}

            {/* Page Info */}
            {pageInfo && (
              <div className="mt-4 text-center text-sm text-gray-400 mb-10">
                {t('grid.pageInfo', 'Page {{current}} of {{totalPages}} • Total: {{total}} videos', { current: currentPage, totalPages: pageInfo.totalPages, total: pageInfo.total })}
              </div>
            )}
          </>
        )}
      </section>

      {/* Render MovieModal */}
      {isModalOpen && selectedVideo && (
        <MovieModal video={selectedVideo} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default GridVideos;
