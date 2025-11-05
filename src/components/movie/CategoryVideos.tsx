'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCategoryVideos, getCachedCategories } from '@/lib/movieApi';
import type { VideosApiResponse, VideoVO, CategoryItem } from '@/types/Dashboard';
import LoadingPage from '@/components/ui/LoadingPage';
import DashboardItem from './DashboardItem';
import MovieModal from './MovieModal';
import { getLocalizedCategoryName } from '@/utils/categoryUtils';
import { FiClock, FiStar } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

interface CategoryVideosProps {
  categoryId: string;
  categoryName?: string;
}

const CategoryVideos: React.FC<CategoryVideosProps> = ({ categoryId, categoryName }) => {
  // Ensure videos is always an array
  const [videos, setVideos] = useState<VideoVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1); // API uses 1-based pages
  const [pageInfo, setPageInfo] = useState<VideosApiResponse['pageInfo'] | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actualCategoryName, setActualCategoryName] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoVO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const [sort, setSort] = useState("0"); // 0: Upload Date, 1: Rating
  const {t}=useTranslation();
  const router = useRouter();

  const pageSize = 30;

  // Ensure pageInfo has default values to prevent null reference errors
  const safePageInfo = pageInfo || {
    page: 1,
    size: pageSize,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  };

  // Ensure videos is always an array - defensive programming
  const safeVideos = Array.isArray(videos) ? videos : [];

  // Safe setVideos function that ensures we always set an array
  const setSafeVideos = (newVideos: VideoVO[] | ((prev: VideoVO[]) => VideoVO[])) => {
    if (typeof newVideos === 'function') {
      setVideos(prev => {
        const result = newVideos(Array.isArray(prev) ? prev : []);
        return Array.isArray(result) ? result : [];
      });
    } else {
      setVideos(Array.isArray(newVideos) ? newVideos : []);
    }
  };

  // Helper function to find category name from cached categories
  const findCategoryName = useCallback(async (categoryId: string): Promise<string | null> => {
    const categories = await getCachedCategories();
    if (!categories) return null;

    // Recursive function to search through category tree
    const searchCategory = (items: (CategoryItem & { children?: CategoryItem[] })[]): string | null => {
      for (const item of items) {
        if (item.id === categoryId) {
          return getLocalizedCategoryName(item);
        }
        if (item.children && item.children.length > 0) {
          const found = searchCategory(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    return searchCategory(categories as (CategoryItem & { children?: CategoryItem[] })[]);
  }, []);

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

  // Set up intersection observer for infinite scroll on mobile
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

  // Fetch category name on component mount
  useEffect(() => {
    const fetchCategoryName = async () => {
      const foundName = await findCategoryName(categoryId);
      setActualCategoryName(foundName);
    };
    fetchCategoryName();
  }, [categoryId, findCategoryName]);

  const displayName = actualCategoryName || categoryName || `Category ${categoryId}`;

  const fetchVideos = useCallback(async (page: number, append: boolean = false, quicksort: string) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      // Convert 1-based page to 0-based for API call
      const response = await getCategoryVideos(categoryId, page, pageSize,undefined, quicksort||sort);
      // console.log(response);
      if (!response) {
        throw new Error('Failed to fetch videos');
      }

      // Some endpoints return { success, data: [...] , pageInfo } (legacy)
      // while the API you pasted returns { data: { page, size, contents: [...] } }
      // Normalize both shapes into `responseData` array and `normalizedPageInfo` object.
      console.log(response);
      const resTyped = response as { 
        success?: boolean; 
        message?: string; 
        data?: VideoVO[] | { 
          contents: VideoVO[]; 
          page?: number; 
          size?: number; 
          total?: number;
          hasNext?: boolean;
          hasPrevious?: boolean;
        }; 
        pageInfo?: VideosApiResponse['pageInfo'] 
      };

      if (typeof resTyped.success !== 'undefined' && !resTyped.success) {
        throw new Error(resTyped.message || 'API request failed');
      }

      let responseData: VideoVO[] = [];
      let normalizedPageInfo: VideosApiResponse['pageInfo'] | null = null;

      if (Array.isArray(resTyped.data)) {
        // legacy: data is the array
        responseData = resTyped.data;
        normalizedPageInfo = resTyped.pageInfo || {
          page,
          size: pageSize,
          total: responseData.length,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        };
      } else if (resTyped.data && Array.isArray(resTyped.data.contents)) {
        // new API shape provided in the attachment
        const contents = resTyped.data.contents as VideoVO[];
        // Map to a shape expected by this component (keep fields we need)
        responseData = contents.map((it: VideoVO) => ({
          id: it.id || '',
          title: it.title || '',
          description: it.description || '',
          coverUrl: it.coverUrl || '',
          imageQuality: it.imageQuality || { customCoverUrl:'', p144: '', p360: '', p720: '' },
          fileName: it.fileName || '',
          region: it.region || '',
          language: it.language || '',
          year: it.year || 0,
          rating: it.rating || 0,
          tags: it.tags || [],
          isSeries: !!it.isSeries,
        }));

        const pageNum = Number(resTyped.data.page) || page;
        const sizeNum = Number(resTyped.data.size) || pageSize;
        const totalCount = Number(resTyped.data.total || responseData.length) || responseData.length;
        const totalPages = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / sizeNum)) : 1;

        normalizedPageInfo = {
          page: pageNum,
          size: sizeNum,
          total: totalCount,
          totalPages,
          hasNext: Boolean(resTyped.data.hasNext) || pageNum < totalPages,
          hasPrevious: Boolean(resTyped.data.hasPrevious) || pageNum > 1,
        };
      } else {
        // unknown shape -> be defensive
        responseData = [];
        normalizedPageInfo = {
          page,
          size: pageSize,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        };
      }

      if (append) {
        setSafeVideos(prev => [...prev, ...responseData]);
      } else {
        setSafeVideos(responseData);
      }

      console.log('Normalized Page Info:', normalizedPageInfo);

      setPageInfo(normalizedPageInfo);
      setCurrentPage(page);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      if (!append) {
        setSafeVideos([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [categoryId, pageSize]);

  useEffect(() => {
    fetchVideos(1,false,sort); // Start with page 1 (converted to 0-based in fetchVideos)
  }, [fetchVideos]);

  const handleLoadMore = () => {
    if (pageInfo && safePageInfo.hasNext && !loadingMore) {
      fetchVideos(currentPage + 1, true,sort);
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= safePageInfo.totalPages) {
      fetchVideos(page,false,sort);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDashboardItemClick = (video: VideoVO) => {
    // setSelectedVideo(video);
    // setIsModalOpen(true);
    router.push(`/videoplayer?directid=${encodeURIComponent(video.id)}`);
  };

  const closeModal = () => {
    setSelectedVideo(null);
    setIsModalOpen(false);
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">{displayName}</h1>
        <div className="mt-6 text-center">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <button 
            onClick={() => fetchVideos(1,false,sort)} // Reset to first page (1-based)
            className="bg-[#fbb033] text-black px-4 py-2 rounded-lg hover:bg-[#f69c05] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{displayName}</h1>
      <div className="rounded-lg p-1 flex gap-6">

                    <div onClick={() => {setSort("0"),fetchVideos(1,false,"0")}}
                      className={`cursor-pointer relative group rounded-lg overflow-hidden flex flex-col items-start justify-end p-2 bg-gradient-to-br from-gray-800 to-black hover:scale-105 transform transition duration-300 ${sort === "0"   ? "ring-4 ring-[#fbb033]" : ""}`}
                    >
                      <div className="absolute inset-0 opacity-10 bg-[url('/images/hero-movie.jpg')] bg-cover bg-center"></div>
                      <div className="z-10">
                        <div className="flex items-center gap-3 ">
                          <FiClock className="text-[#fbb033] text-xl" />
                          <h2 className="text-xl font-bold">{t('movie.latest', 'Latest')}</h2>
                        </div>
                      </div>
                    </div>

                    <div onClick={() => {setSort("1"),fetchVideos(1,false,"1" )}}
                      className={`cursor-pointer relative group rounded-lg overflow-hidden flex flex-col items-start justify-end p-2 bg-gradient-to-br from-gray-800 to-black hover:scale-105 transform transition duration-300 ${sort === "1" ? "ring-4 ring-[#fbb033]" : ""}`}
                    >
                      <div className="absolute inset-0 opacity-10 bg-[url('/images/hero-series.jpg')] bg-cover bg-center"></div>
                      <div className="z-10">
                        <div className="flex items-center gap-3 ">
                          <FiStar className="text-[#fbb033] text-xl" />
                          <h2 className="text-xl font-bold">{t('movie.rating', 'Rating')}</h2>
                        </div>
                      </div>
                    </div>
                  </div>
      {pageInfo && (
        <div className="mt-2 text-sm text-gray-400">
          Showing {safeVideos.length} of {safePageInfo.total} videos
        </div>
      )}

      <section className="mt-6">
        {safeVideos.length === 0 ? (
          <p className="text-gray-400">No videos found in this category.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-7 xl:grid-cols-10 gap-1 md:gap-4 gap-y-2">
              {safeVideos.map((video, index) => (
                <DashboardItem
                  key={video.id || index}
                  video={video}
                  index={index}
                  showRating={!!video.rating} // Show rating if available
                  showViewer={!!video.views} // Show viewer count if available
                  onClick={() => handleDashboardItemClick(video)}
                />
              ))}
            </div>

            {/* Load More and Pagination Controls */}
            {safePageInfo.hasNext && pageInfo && (
              <>
                {/* Desktop Load More Button */}
                {/* {isDesktop && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="bg-[#fbb033] text-black px-6 py-3 rounded-lg hover:bg-[#f69c05] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )} */}

                {/* Mobile Infinite Scroll Sentinel */}
                {!isDesktop && (
                  <div 
                    id="scroll-sentinel"
                    className="h-20 flex items-center justify-center"
                  >
                    {loadingMore && (
                      <div className="animate-pulse text-gray-400">Loading more videos...</div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Desktop Pagination */}
            {isDesktop && pageInfo && safePageInfo.totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!safePageInfo.hasPrevious}
                  className="px-3 py-2 cursor-pointer rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, safePageInfo.totalPages) }, (_, i) => {
                    let pageNum;
                    if (safePageInfo.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage < 4) {
                      pageNum = i + 1;
                    } else if (currentPage > safePageInfo.totalPages - 3) {
                      pageNum = safePageInfo.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded transition-colors cursor-pointer ${
                          pageNum === currentPage
                            ? 'bg-[#fbb033] text-black'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!safePageInfo.hasNext}
                  className="px-3 py-2 cursor-pointer rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  Next
                </button>
              </div>
            )}

            {/* Page Info - Desktop Only */}
            {isDesktop && pageInfo && (
              <div className="mt-4 text-center text-sm text-gray-400">
                Page {currentPage} of {safePageInfo.totalPages} • Total: {safePageInfo.total} videos
              </div>
            )}
          </>
        )}
      </section>

      {isModalOpen && selectedVideo && (
        <MovieModal
          video={selectedVideo}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default CategoryVideos;
