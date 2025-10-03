'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchVideos, getCachedCategories } from '@/lib/movieApi';
import { getHotKeywords } from '@/lib/movieApi';
import type { SearchApiResponse, VideoVO, CategoryItem } from '@/types/Dashboard';
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

  const pageSize = 10;

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

  const performSearch = async (query: string, categoryId: string, page: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await searchVideos(query, categoryId, page, pageSize);

      if (!response?.success) {
        throw new Error(response?.message || 'Search request failed');
      }

      setVideos((prev) => (page === 1 ? response.data.contents : [...prev, ...response.data.contents]));
      setPageInfo(response.pageInfo || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (pageInfo?.hasNext && !loading) {
      const query = searchParams?.get('q')?.trim() || '';
      const category = searchParams?.get('category') || '';
      performSearch(query, category, (pageInfo.page || 1) + 1);
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

          {/* Load More Button */}
          {pageInfo?.hasNext && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                className="px-6 py-3 bg-[#fbb033] text-black font-semibold rounded-lg hover:bg-[#f69c05] transition-colors"
              >
                Load More
              </button>
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
