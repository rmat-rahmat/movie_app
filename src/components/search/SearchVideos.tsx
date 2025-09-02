'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchVideos, getCachedCategories } from '@/lib/movieApi';
import type { SearchApiResponse, VideoVO, CategoryItem } from '@/types/Dashboard';
import LoadingPage from '@/components/ui/LoadingPage';

interface SearchVideosProps {
  initialQuery?: string;
}

const SearchVideos: React.FC<SearchVideosProps> = ({ initialQuery = "" }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<VideoVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInfo, setPageInfo] = useState<SearchApiResponse['pageInfo'] | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

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

  // Initial search if query is provided
  useEffect(() => {
    // If parent provided an initialQuery, run search.
    if (initialQuery && initialQuery.trim()) {
      setSearchQuery(initialQuery);
      handleSearch();
      return;
    }

    // Also support direct page loads with a q query parameter (handles encoded values)
    const qParam = searchParams?.get('q') || '';
    if (qParam && qParam.trim()) {
      // URLSearchParams returns decoded values, so this handles encoded characters correctly
      setSearchQuery(qParam);
      performSearch(qParam, selectedCategory, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, searchParams?.toString()]);

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
      
      if (!response) {
        throw new Error('Failed to search videos');
      }

      if (!response.success) {
        throw new Error(response.message || 'Search request failed');
      }

      if (append) {
        setVideos(prev => [...prev, ...response.data]);
      } else {
        setVideos(response.data);
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
    if (!searchQuery.trim()) {
      setError("Please enter a search term");
      return;
    }
    
    // Update URL with search query
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('q', searchQuery.trim());
    if (selectedCategory) {
      params.set('category', selectedCategory);
    } else {
      params.delete('category');
    }
    router.push(`/search?${params.toString()}`);
    
    setCurrentPage(1);
    performSearch(searchQuery, selectedCategory, 1);
  };

  const handleLoadMore = () => {
    if (pageInfo?.hasNext && !loadingMore && searchQuery.trim()) {
      performSearch(searchQuery, selectedCategory, currentPage + 1, true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setVideos([]);
    setError(null);
    setHasSearched(false);
    setPageInfo(null);
    setCurrentPage(1);
    
    // Clear URL parameters
    router.push('/search');
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
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
                disabled={loading || !searchQuery.trim()}
                className="px-6 py-3 bg-[#fbb033] text-black font-semibold rounded-lg hover:bg-[#f69c05] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Clear Search */}
            {(searchQuery || hasSearched) && (
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
              {searchQuery && (
                <>
                  Search results for {"\""}<span className="text-[#fbb033]">{searchQuery}</span>{"\""}
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
                {videos.map((video, index) => {
                  const fallbackSrc1 = '/fallback_poster/sample_poster.png';
                  const fallbackSrc2 = '/fallback_poster/sample_poster1.png';
                  const imageSrc = video.coverUrl || (index % 2 === 0 ? fallbackSrc1 : fallbackSrc2);
                  
                  return (
                    <article key={`${video.id || index}`} className="bg-[#0b0b0b] rounded-md overflow-hidden hover:bg-[#1a1a1a] transition-colors">
                      <div className="aspect-[2/3] relative">
                        <img
                          src={imageSrc}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = index % 2 === 0 ? fallbackSrc2 : fallbackSrc1;
                          }}
                        />
                        {video.year && (
                          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {video.year}
                          </div>
                        )}
                        {video.rating && (
                          <div className="absolute bottom-2 left-2 bg-[#fbb033] text-black text-xs px-2 py-1 rounded font-bold">
                            ⭐ {video.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-white line-clamp-2 mb-1">{video.title}</h3>
                        {video.description && (
                          <p className="text-sm text-gray-400 line-clamp-3 mb-2">{video.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 text-xs">
                          {video.region && (
                            <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded">{video.region}</span>
                          )}
                          {video.language && (
                            <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded">{video.language}</span>
                          )}
                          {video.isSeries && (
                            <span className="bg-blue-600 text-white px-2 py-1 rounded">Series</span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
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
                No videos found for {"\""}{searchQuery}{"\""}
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
    </div>
  );
};

export default SearchVideos;
