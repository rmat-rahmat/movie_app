'use client';
import React, { useState, useRef, useEffect } from 'react';
import { getVideoRecommendations } from '@/lib/movieApi';
import DashboardItem from './DashboardItem';
import MovieModal from './MovieModal';
import LoadingPage from '@/components/ui/LoadingPage';
import type { DashboardItem as DashboardItemType } from '@/types/Dashboard';
import { useTranslation } from 'react-i18next';

interface RecommendationGridProps {
  videoId: string;
  title: string;
  icon?: React.ReactNode;
}

const RecommendationGrid: React.FC<RecommendationGridProps> = ({ videoId, title, icon }) => {
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState<DashboardItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMovieIndex, setSelectedMovieIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calculate columns based on screen width
  const getColumnsPerRow = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width >= 1536) return 8; // 2xl
      if (width >= 1280) return 7; // xl
      if (width >= 1024) return 6; // lg
      if (width >= 768) return 5;  // md
      if (width >= 640) return 4;  // sm
      return 3; // base
    }
    return 6; // fallback
  };

  const [columnsPerRow, setColumnsPerRow] = useState(getColumnsPerRow);

  // Update columns on window resize
  useEffect(() => {
    const handleResize = () => {
      setColumnsPerRow(getColumnsPerRow());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch recommendations
  const fetchRecommendations = async (page: number = 1, append: boolean = false) => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const pageSize = columnsPerRow * 2; // 2 rows
      const response = await getVideoRecommendations(videoId, page, pageSize);
      
      if (response?.success && response?.data?.contents) {
        const transformedRecommendations: DashboardItemType[] = response.data.contents.map(video => ({
          id: video.id,
          title: video.title,
          description: video.description,
          fileName: video.fileName,
          coverUrl: video.coverUrl,
          imageQuality: video.imageQuality,
          fileSize: null,
          status: video.status,
          createBy: video.createBy,
          createTime: video.createTime,
          updateTime: null,
          categoryId: video.categoryId,
          region: video.region,
          language: video.language,
          year: video.year,
          director: video.director,
          actors: video.actors,
          rating: video.rating,
          tags: video.tags,
          isSeries: video.isSeries,
          seriesId: video.seriesId,
          seasonNumber: video.seasonNumber,
          totalEpisodes: video.totalEpisodes,
          isCompleted: video.isCompleted,
          popularity: null,
          views: video.views
        }));

        if (append) {
          setRecommendations(prev => [...prev, ...transformedRecommendations]);
        } else {
          setRecommendations(transformedRecommendations);
        }

        // Check if there are more pages
        const totalItems = response.pageInfo?.total || 0;
        const currentItems = append ? recommendations.length + transformedRecommendations.length : transformedRecommendations.length;
        setHasMore(currentItems < totalItems);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (videoId) {
      setRecommendations([]);
      setCurrentPage(1);
      setHasMore(true);
      fetchRecommendations(1, false);
    }
  }, [videoId, columnsPerRow]);

  // Handle horizontal scroll
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || loading || !hasMore) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;

    // Load more when scrolled 80% to the right
    if (scrollPercentage > 0.8) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchRecommendations(nextPage, true);
    }
  };

  // Arrange items in 2 rows
  const arrangeInTwoRows = (items: DashboardItemType[]) => {
    const row1: DashboardItemType[] = [];
    const row2: DashboardItemType[] = [];
    
    items.forEach((item, index) => {
      if (index % 2 === 0) {
        row1.push(item);
      } else {
        row2.push(item);
      }
    });

    return { row1, row2 };
  };

  const { row1, row2 } = arrangeInTwoRows(recommendations);

  if (recommendations.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      {/* Grid Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="overflow-x-auto overflow-y-hidden scroll-smooth"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="flex flex-col gap-4 pb-4" style={{ minWidth: 'fit-content' }}>
          {/* Row 1 */}
          <div className="flex gap-4">
            {row1.map((video, index) => (
              <div
                key={`${video.id}-row1`}
                className="flex-shrink-0"
                style={{ width: '200px' }}
              >
                <DashboardItem
                  video={video}
                  index={index * 2}
                  showRating={true}
                  showViewer={true}
                  onClick={() => setSelectedMovieIndex(index * 2)}
                />
              </div>
            ))}
            
            {/* Loading indicator for row 1 */}
            {loading && row1.length > 0 && (
              <div className="flex-shrink-0 flex items-center justify-center bg-gray-800 rounded-lg" style={{ width: '200px', height: '300px' }}>
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fbb033] mx-auto mb-2"></div>
                  <p className="text-sm text-gray-400">{t('common.loading')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Row 2 */}
          <div className="flex gap-4">
            {row2.map((video, index) => (
              <div
                key={`${video.id}-row2`}
                className="flex-shrink-0"
                style={{ width: '200px' }}
              >
                <DashboardItem
                  video={video}
                  index={index * 2 + 1}
                  showRating={true}
                  showViewer={true}
                  onClick={() => setSelectedMovieIndex(index * 2 + 1)}
                />
              </div>
            ))}
            
            {/* Loading indicator for row 2 */}
            {loading && row2.length > 0 && (
              <div className="flex-shrink-0 flex items-center justify-center bg-gray-800 rounded-lg" style={{ width: '200px', height: '300px' }}>
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fbb033] mx-auto mb-2"></div>
                  <p className="text-sm text-gray-400">{t('common.loading')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Initial loading state */}
      {loading && recommendations.length === 0 && (
        <div className="text-center py-8">
          <LoadingPage message={t('video.loadingRecommendations')} className="relative bg-gray-800/50 rounded-lg p-4" />
        </div>
      )}

      {/* End of content indicator */}
      {!hasMore && recommendations.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-400">{t('common.noMoreContent', 'No more content to load')}</p>
        </div>
      )}

      {/* Movie Modal */}
      {selectedMovieIndex !== null && recommendations[selectedMovieIndex] && (
        <MovieModal
          video={recommendations[selectedMovieIndex]}
          onClose={() => setSelectedMovieIndex(null)}
        />
      )}
    </div>
  );
};

export default RecommendationGrid;