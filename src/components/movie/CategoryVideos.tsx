'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCategoryVideos, getCachedCategories } from '@/lib/movieApi';
import type { VideosApiResponse, VideoVO, CategoryItem } from '@/types/Dashboard';
import LoadingPage from '@/components/ui/LoadingPage';
import DashboardItem from './DashboardItem';
import MovieModal from './MovieModal';

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

  const pageSize = 20;

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
      console.log(page);
      const response = await getCategoryVideos(categoryId, page, pageSize);
      console.log(response);
      if (!response) {
        throw new Error('Failed to fetch videos');
      }

      // Some endpoints return { success, data: [...] , pageInfo } (legacy)
      // while the API you pasted returns { data: { page, size, contents: [...] } }
      // Normalize both shapes into `responseData` array and `normalizedPageInfo` object.
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
    fetchVideos(1); // Start with page 1 (converted to 0-based in fetchVideos)
  }, [fetchVideos]);

  const handleLoadMore = () => {
    if (pageInfo && safePageInfo.hasNext && !loadingMore) {
      fetchVideos(currentPage + 1, true);
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= safePageInfo.totalPages) {
      fetchVideos(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
          Showing {safeVideos.length} of {safePageInfo.total} videos
        </div>
      )}

      <section className="mt-6">
        {safeVideos.length === 0 ? (
          <p className="text-gray-400">No videos found in this category.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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

            {/* Load More Button */}
            {safePageInfo.hasNext && pageInfo && (
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
            {pageInfo && safePageInfo.totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!safePageInfo.hasPrevious}
                  className="px-3 py-2 rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, safePageInfo.totalPages) }, (_, i) => {
                    let pageNum;
                    if (safePageInfo.totalPages <= 5) {
                      pageNum = i + 1; // 1-based for display
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
                  disabled={!safePageInfo.hasNext}
                  className="px-3 py-2 rounded bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  Next
                </button>
              </div>
            )}

            {/* Page Info */}
            {pageInfo && (
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
