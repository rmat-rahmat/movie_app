'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCategoryVideos, getCachedCategories } from '@/lib/movieApi';
import type { VideosApiResponse, VideoVO, CategoryItem } from '@/types/Dashboard';
import LoadingPage from '@/components/ui/LoadingPage';

interface CategoryVideosProps {
  categoryId: string;
  categoryName?: string;
}

const CategoryVideos: React.FC<CategoryVideosProps> = ({ categoryId, categoryName }) => {
  const [videos, setVideos] = useState<VideoVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1); // API uses 1-based pages
  const [pageInfo, setPageInfo] = useState<VideosApiResponse['pageInfo'] | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actualCategoryName, setActualCategoryName] = useState<string | null>(null);

  const pageSize = 20;

  // Helper function to find category name from cached categories
  const findCategoryName = useCallback((categoryId: string): string | null => {
    const categories = getCachedCategories();
    if (!categories) return null;

    // Recursive function to search through category tree
    const searchCategory = (items: (CategoryItem & { children?: CategoryItem[] })[]): string | null => {
      for (const item of items) {
        if (item.id === categoryId) {
          return item.categoryName || item.categoryAlias || null;
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

  // Fetch category name on component mount
  useEffect(() => {
    const foundName = findCategoryName(categoryId);
    setActualCategoryName(foundName);
  }, [categoryId, findCategoryName]);

  const displayName = actualCategoryName || categoryName || `Category ${categoryId}`;

  const fetchVideos = useCallback(async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      // Convert 1-based page to 0-based for API call
      console.log(page)
      const response = await getCategoryVideos(categoryId, page, pageSize);
      console.log(response)
      if (!response) {
        throw new Error('Failed to fetch videos');
      }

      if (!response.success) {
        throw new Error(response.message || 'API request failed');
      }

      if (append) {
        setVideos(prev => [...prev, ...response.data]);
      } else {
        setVideos(response.data);
      }
      
      setPageInfo(response.pageInfo || null);
      setCurrentPage(page);
      
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
  }, [categoryId, pageSize]);

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
            onClick={() => fetchVideos(1)} // Reset to first page (1-based)
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
      
      {pageInfo && (
        <div className="mt-2 text-sm text-gray-400">
          Showing {videos?.length} of {pageInfo.total} videos
        </div>
      )}

      <section className="mt-6">
        {videos?.length === 0 ? (
          <p className="text-gray-400">No videos found in this category.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {videos?.map((video, index) => {
                const fallbackSrc1 = '/fallback_poster/sample_poster.png';
                const fallbackSrc2 = '/fallback_poster/sample_poster1.png';
                const imageSrc = video.coverUrl || video.coverUrl || (index % 2 === 0 ? fallbackSrc1 : fallbackSrc2);
                
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
              <div className="mt-8 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="bg-[#fbb033] text-black px-6 py-3 rounded-lg hover:bg-[#f69c05] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}

            {/* Pagination */}
            {pageInfo && pageInfo.totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pageInfo.hasPrevious}
                  className="px-3 py-2 rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pageInfo.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pageInfo.totalPages <= 5) {
                      pageNum = i + 1; // 1-based for display
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
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded transition-colors ${
                          pageNum === currentPage
                            ? 'bg-[#fbb033] text-black'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                      >
                        {pageNum} {/* Display 1-based page numbers */}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pageInfo.hasNext}
                  className="px-3 py-2 rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  Next
                </button>
              </div>
            )}

            {/* Page Info */}
            {pageInfo && (
              <div className="mt-4 text-center text-sm text-gray-400">
                Page {currentPage} of {pageInfo.totalPages} • Total: {pageInfo.total} videos
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default CategoryVideos;
