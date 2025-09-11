'use client';

import { useState, useEffect, useCallback } from 'react';
import { getGridVideos, getCachedCategories } from '@/lib/movieApi';
import type { VideosApiResponse, VideoVO, CategoryItem } from '@/types/Dashboard';
import LoadingPage from '@/components/ui/LoadingPage';
import DashboardItem from './DashboardItem';
import MovieModal from './MovieModal';

interface GridVideosProps {
  id: string;
  title?: string;
  src:string
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

  const pageSize = 20;

  // Fetch category name on component mount
  useEffect(() => {

  }, [id]);


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
      const response = await getGridVideos(src, page, pageSize);
      console.log(response)
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
      
      setPageInfo(response.pageInfo || null);
      console.log('pageinfo',response.pageInfo)
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
    setSelectedVideo(video);
    setIsModalOpen(true);
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
        <h1 className="text-2xl font-bold">{title}</h1>
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
      <h1 className="text-2xl font-bold">{title}</h1>
      
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

      {/* Render MovieModal */}
      {isModalOpen && selectedVideo && (
        <MovieModal video={selectedVideo} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default GridVideos;
