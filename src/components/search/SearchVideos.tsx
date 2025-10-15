'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchVideos, getCachedCategories } from '@/lib/movieApi';
import { getHotKeywords } from '@/lib/movieApi';
import type { SearchApiResponse, VideoVO, CategoryItem, VideosApiResponse } from '@/types/Dashboard';
import LoadingPage from '@/components/ui/LoadingPage';
import DashboardItem from '../movie/DashboardItem';
import MovieModal from '../movie/MovieModal';
import SearchInput from './SearchInput';

interface SearchVideosProps {
  initialQuery?: string;
}

const SearchVideos: React.FC<SearchVideosProps> = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<VideoVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState<SearchApiResponse['pageInfo'] | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [hotKeywords, setHotKeywords] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoVO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 21;

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
    if (isDesktop || !pageInfo?.hasNext || loading) return;

    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
        handleLoadMore();
      } else if (!target.isIntersecting) {
        setHasIntersected(false);
      }
    }, {
      threshold: 0.1,
      rootMargin: '100px',
    });

    const sentinel = document.getElementById('search-scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [isDesktop, pageInfo?.hasNext, loading, hasIntersected]);

  // Load categories on component mount
  useEffect(() => {
    const cachedCategories = getCachedCategories();
    if (cachedCategories) {
      setCategories(cachedCategories);
    }
  }, []);

  // Perform search based on URL query
  useEffect(() => {
    const query = searchParams?.get('q')?.trim() || '';
    const category = searchParams?.get('category') || '';

    if (query) {
      performSearch(query, category, 1);
    }
  }, [searchParams]);

  // Load hot keywords when no query present
  useEffect(() => {
    const query = searchParams?.get('q')?.trim() || '';
    if (!query) {
      (async () => {
        try {
          const list = await getHotKeywords(12);
          if (Array.isArray(list)) setHotKeywords(list);
        } catch (_e) {
          // ignore
        }
      })();
    }
  }, [searchParams]);

  const performSearch = async (query: string, categoryId: string, page: number, append: boolean = false) => {
    if (append) {
      setLoading(true);
    } else {
      setLoading(true);
      setError(null);
    }
      let normalizedPageInfo: VideosApiResponse['pageInfo'] | null = null;

    try {
      const response = await searchVideos(query, categoryId, page, pageSize);

      if (!response?.success) {
        throw new Error(response?.message || 'Search request failed');
      }

      setVideos((prev) => (append ? [...prev, ...response.data.contents] : response.data.contents));

      normalizedPageInfo = {
        page: response.data.page,
        size: response.data.size,
        total: response.data.total || (response.data.contents.length + (append ? videos.length : 0)),
        totalPages: response.data.getTotalPages || (response.data.contents.length < pageSize ? page : page + 1),
        hasNext: response.data.page < response.data.getTotalPages,
        hasPrevious:page > 1,
      };
      setPageInfo(normalizedPageInfo);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      if (!append) {
        setVideos([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (pageInfo?.hasNext && !loading) {
      const query = searchParams?.get('q')?.trim() || '';
      const category = searchParams?.get('category') || '';
      performSearch(query, category, currentPage + 1, true);
    }
  };

  const handleDashboardItemClick = (video: VideoVO) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedVideo(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Search Videos</h1>
      <SearchInput className='md:hidden mx-2 mb-6'/>
      {/* Loading State */}
      {loading && <LoadingPage />}

      {/* Error State */}
      {error && (
        <div className="mb-6">
          <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Search Results */}
      {!loading && videos.length > 0 && (
        <>
          <div className="grid grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-1 md:gap-4 gap-y-2 px-2 mb-8">
            {videos.map((video, index) => (
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
          {pageInfo?.hasNext && (
            <>
              {/* Mobile Infinite Scroll Sentinel */}
              {!isDesktop && (
                <div 
                  id="search-scroll-sentinel"
                  className="h-20 flex items-center justify-center"
                >
                  {loading && (
                    <div className="animate-pulse text-gray-400">Loading more videos...</div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Desktop Pagination */}
          {isDesktop && pageInfo && pageInfo.totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2">
              <button
                onClick={() => {
                  const query = searchParams?.get('q')?.trim() || '';
                  const category = searchParams?.get('category') || '';
                  performSearch(query, category, currentPage - 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={!pageInfo.hasPrevious || loading}
                className="px-3 py-2 cursor-pointer rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
              >
                Previous
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pageInfo.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pageInfo.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage < 4) {
                    pageNum = i + 1;
                  } else if (currentPage > pageInfo.totalPages - 3) {
                    pageNum = pageInfo.totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        const query = searchParams?.get('q')?.trim() || '';
                        const category = searchParams?.get('category') || '';
                        performSearch(query, category, pageNum);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
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
                onClick={() => {
                  const query = searchParams?.get('q')?.trim() || '';
                  const category = searchParams?.get('category') || '';
                  performSearch(query, category, currentPage + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={!pageInfo.hasNext || loading}
                className="px-3 py-2 cursor-pointer rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
              >
                Next
              </button>
            </div>
          )}

          {/* Page Info - Desktop Only */}
          {isDesktop && pageInfo && (
            <div className="mt-4 text-center text-sm text-gray-400">
              Page {currentPage} of {pageInfo.totalPages} • Total: {pageInfo.total} videos
            </div>
          )}
        </>
      )}

      {/* No Results Found */}
      {!loading && videos.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-4">No videos found</div>
          <p className="text-gray-500 text-sm">Try different keywords or check your spelling</p>
          {hotKeywords.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-400 mb-2">热门搜索</p>
              <div className="flex flex-wrap justify-center gap-2">
                {hotKeywords.map((k) => (
                  <button
                    key={k}
                    onClick={() => router.push(`/search?q=${encodeURIComponent(k)}`)}
                    className="px-3 py-1 bg-gray-800 text-sm text-white rounded-full hover:bg-gray-700"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Video Modal */}
      {isModalOpen && selectedVideo && (
        <MovieModal
          video={selectedVideo}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default SearchVideos;
