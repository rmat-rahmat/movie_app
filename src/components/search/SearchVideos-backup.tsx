'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchVideos, getCachedCategories } from '@/lib/movieApi';
import type { SearchApiResponse, VideoVO, CategoryItem } from '@/types/Dashboard';
import LoadingPage from '@/components/ui/LoadingPage';
import DashboardItem from '../movie/DashboardItem';
import MovieModal from '../movie/MovieModal';

interface SearchVideosProps {
  initialQuery?: string;
}

const SearchVideos: React.FC<SearchVideosProps> = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<VideoVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInfo, setPageInfo] = useState<SearchApiResponse['pageInfo'] | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoVO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pageSize = 10;

  // Load categories on component mount
  useEffect(() => {
    const cachedCategories = getCachedCategories();
    if (cachedCategories) {
      setCategories(cachedCategories);
    }
    // Initialize category from URL params
    const categoryParam = searchParams?.get('category') || '';
    setSelectedCategory(categoryParam);
  }, [searchParams]);

  // Perform search based on URL query
  useEffect(() => {
    const qParam = searchParams?.get('q') || '';
    if (qParam.trim()) {
      console.log("sini",qParam,selectedCategory);
      performSearch(qParam, selectedCategory, 1);
    }
  }, [searchParams?.get('q'), selectedCategory]);

  const performSearch = useCallback(async (query: string, categoryId: string, page: number, append: boolean = false) => {
    if (!query.trim()) {
      setError("Please enter a search term");
      return;
    }

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const response = await searchVideos(query, categoryId, page, pageSize);
      console.log('Search response:', response);
      if (!response) {
        throw new Error('Failed to search videos');
      }

      if (!response.success) {
        throw new Error(response.message || 'Search request failed');
      }

      if (append) {
        setVideos(prev => [...prev, ...response.data.contents]);
      } else {
        setVideos(response.data.contents);
        setHasSearched(true);
      }

      setPageInfo(response.pageInfo || null);
      setCurrentPage(page);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      if (!append) {
        setVideos([]);
        setHasSearched(true);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const handleSearch = () => {
    const qParam = searchParams?.get('q') || '';
    if (!qParam.trim()) {
      setError("Please enter a search term");
      return;
    }

    // Update URL with search query
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (selectedCategory) {
      params.set('category', selectedCategory);
    } else {
      params.delete('category');
    }
    router.push(`/search?${params.toString()}`);

    setCurrentPage(1);
    performSearch(qParam, selectedCategory, 1);
  };

  const handleLoadMore = () => {
    const qParam = searchParams?.get('q') || '';
    if (pageInfo?.hasNext && !loadingMore && qParam.trim()) {
      performSearch(qParam, selectedCategory, currentPage + 1, true);
    }
  };

  const handleClearSearch = () => {
    setVideos([]);
    setError(null);
    setHasSearched(false);
    setPageInfo(null);
    setCurrentPage(1);

    // Clear URL parameters
    router.push('/search');
  };

  const handleDashboardItemClick = (video: VideoVO) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedVideo(null);
    setIsModalOpen(false);
  };

  // Flatten categories for dropdown
  const flattenCategories = (categories: CategoryItem[]): CategoryItem[] => {
    const result: CategoryItem[] = [];

    const flatten = (items: CategoryItem[], depth = 0) => {
      items.forEach(item => {
        result.push({ ...item, depth });
        if (item.children && item.children.length > 0) {
          flatten(item.children, depth + 1);
        }
      });
    };

    flatten(categories);
    return result;
  };

  const flatCategories = flattenCategories(categories);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Search Videos</h1>

      {/* hide Search Form */}
      {false && (
        <>
          {/* Search Form */}
          <div className="max-w-4xl mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              {/* Search Input */}
              <div className="flex-1">
                <input
                  type="text"
                  value={searchParams?.get('q') || ''}
                  onChange={(e) => router.push(`/search?q=${encodeURIComponent(e.target.value)}`)}
                  placeholder="Search for movies, TV shows..."
                  className="w-full px-4 py-3 bg-[#0b0b0b] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#fbb033] focus:ring-1 focus:ring-[#fbb033]"
                />
              </div>

              {/* Category Filter */}
              <div className="md:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0b0b0b] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#fbb033] focus:ring-1 focus:ring-[#fbb033]"
                >
                  <option value="">All Categories</option>
                  {flatCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {'  '.repeat(category.depth || 0)}{category.categoryName || category.categoryAlias || category.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={loading || !(searchParams?.get('q') || '').trim()}
                className="px-6 py-3 bg-[#fbb033] text-black font-semibold rounded-lg hover:bg-[#f69c05] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Clear Search */}
            {(searchParams?.get('q') || hasSearched) && (
              <button
                onClick={handleClearSearch}
                className="text-sm text-gray-400 hover:text-white underline"
              >
                Clear search
              </button>
            )}
          </div>
        </>
      )}

      {/* Loading State */}
      {loading && !loadingMore && <LoadingPage />}

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
      {hasSearched && !loading && (
        <>
          {/* Results Count */}
          {pageInfo && (
            <div className="mb-4 text-sm text-gray-400">
              {searchParams?.get('q') && (
                <>
                  Search results for {"\""}<span className="text-[#fbb033]">{searchParams?.get('q')}</span>{"\""}
                  {selectedCategory && (
                    <> in category <span className="text-[#fbb033]">{
                      flatCategories.find(cat => cat.id === selectedCategory)?.categoryName || 
                      flatCategories.find(cat => cat.id === selectedCategory)?.categoryAlias || 
                      selectedCategory
                    }</span></>
                  )}
                </>
              )}
              <br />
              Showing {videos.length} of {pageInfo.total} results
            </div>
          )}

          {/* Results Grid */}
          {videos.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
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
                    disabled={loadingMore}
                    className="px-6 py-3 bg-[#fbb033] text-black font-semibold rounded-lg hover:bg-[#f69c05] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">
                No videos found for {"\""}{searchParams?.get('q')}{"\""}
                {selectedCategory && (
                  <> in category {"\""}{
                    flatCategories.find(cat => cat.id === selectedCategory)?.categoryName || 
                    flatCategories.find(cat => cat.id === selectedCategory)?.categoryAlias || 
                    selectedCategory
                  }{"\""}</>
                )}
              </div>
              <p className="text-gray-500 text-sm">Try different keywords or check your spelling</p>
            </div>
          )}
        </>
      )}

      {/* No Search Performed */}
      {!hasSearched && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-4">Enter a search term to find videos</div>
          <p className="text-gray-500 text-sm">Search for movies, TV shows, documentaries and more</p>
        </div>
      )}

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
