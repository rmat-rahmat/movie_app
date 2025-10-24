'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getGridVideos, getCachedCategories } from '@/lib/movieApi';
import type { VideosApiResponse, VideoVO, CategoryItem } from '@/types/Dashboard';
import LoadingPage from '@/components/ui/LoadingPage';
import DashboardItem from './DashboardItem';
import { useRouter } from 'next/navigation';
import MovieModal from './MovieModal';

interface GridVideosProps {
  id: string;
  title?: string;
  src: string
}

const GridVideos: React.FC<GridVideosProps> = ({ id, title, src }) => {
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

      // Convert 1-based page to 0-based for API call
      const response = await getGridVideos(src, page, pageSize);
      console.log("response getGridVideos", response)
      if (!response) {
        throw new Error('Failed to fetch videos');
      }

      if (!response.success) {
        throw new Error(response.message || 'API request failed');
      }

      // Normalize contents whether API returns an array directly or an object with `contents` property
      const data: unknown = response.data;
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
      const total: number = typeof raw?.total === 'number' ? raw.total : (Array.isArray(data) ? contents.length : 0);
      const totalPages: number =
        typeof raw?.getTotalPages === 'number'
          ? raw.getTotalPages
          : typeof raw?.totalPages === 'number'
          ? raw.totalPages
          : Math.max(1, Math.ceil(total / pageSize));

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

  if (loading) {
    return <LoadingPage />;
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
      <h1 className="text-2xl font-bold">{title || t('grid.title', 'Videos')}</h1>

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
            <div className="grid grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-1 md:gap-4 gap-y-2">
              {videos?.map((video, index) => (
                <DashboardItem
                  key={video.id || index}
                  video={video}
                  index={index}
                  showRating={!!video.rating} // Show rating if available
                  showViewer={!!video.views} // Show viewer count if available
                  onClick={() => handleVideoClick(video)} // Open modal on click
                />
              ))}
            </div>


            {/* Load More Button (desktop) - kept commented out, using mobile sentinel for infinite scroll */}

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
              <div className="mt-4 text-center text-sm text-gray-400">
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
