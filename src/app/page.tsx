'use client';

import { getHomeSections, getSectionsContent, getBannerList } from "@/lib/movieApi";
import { useEffect, useState, useRef, useCallback } from "react";
import LoadingPage from "@/components/ui/LoadingPage";
import type { DashboardItem, BannerVO, VideoVO, HomeSectionVO, SectionContentRequest } from '@/types/Dashboard';
import SubscriptionSection from "@/components/subscription/SubscriptionSection";
import { useAuthStore } from "@/store/authStore";
import DashboardSection from "@/components/movie/DashboardSection";
import BannerSlider from "@/components/movie/BannerSlider";
import { getCategoryTree, type CategoryItem } from "@/lib/movieApi";
import { getLocalizedCategoryName } from '@/utils/categoryUtils';

// Extended section with pagination state
interface ExtendedSection extends HomeSectionVO {
  currentPage: number;
  isLoadingMore: boolean;
  allVideos: VideoVO[];
}

export default function Home() {
  const [banners, setBanners] = useState<BannerVO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryList, setCategoryList] = useState<CategoryItem[]>([
    { id: "All", categoryLangLabel: { "en": "All", "zh": "所有", "ms": "Semua", "de": "Alle", "fr": "Tous", "ru": "Все" } }
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sections, setSections] = useState<ExtendedSection[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  
  const { user } = useAuthStore();
  const observerRefs = useRef<Map<string, IntersectionObserver>>(new Map());

  useEffect(() => {
    initializePage();
  }, []);

  // Fetch initial data
  const initializePage = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchCategories(),
        fetchBanners(),
        fetchHomeSections()
      ]);
    } catch (error) {
      console.error("Error initializing page:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch banners from API
  const fetchBanners = async () => {
    try {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const bannerType = isMobile ? 2 : 1;
      
      const fetchedBanners = await getBannerList(bannerType, '720');
      if (fetchedBanners && Array.isArray(fetchedBanners)) {
        setBanners(fetchedBanners);
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const fetchedCategories = await getCategoryTree();
      if (fetchedCategories && Array.isArray(fetchedCategories)) {
        setCategoryList([
          { id: "All", categoryLangLabel: { "en": "All", "zh": "所有", "ms": "Semua", "de": "Alle", "fr": "Tous", "ru": "Все" } },
          ...fetchedCategories
        ]);
        
        // Map category IDs to names
        const idToNameMap: Record<string, string> = {};
        fetchedCategories.forEach(cat => {
          if (cat.id) {
            idToNameMap[cat.id] = getLocalizedCategoryName(cat);
          }
        });
        setCategoryMap(idToNameMap);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Fetch home sections using new API
  const fetchHomeSections = async (categoryId?: string) => {
    try {
      const homeSections = await getHomeSections(
        categoryId && categoryId !== "All" ? categoryId : undefined,
        'p720',
        5
      );

      if (homeSections && Array.isArray(homeSections)) {
        const extendedSections: ExtendedSection[] = homeSections.map(section => ({
          ...section,
          currentPage: 1,
          isLoadingMore: false,
          allVideos: [...section.contents]
        }));
        setSections(extendedSections);
      }
    } catch (error) {
      console.error("Error fetching home sections:", error);
    }
  };

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setIsLoading(true);
    fetchHomeSections(categoryId).finally(() => setIsLoading(false));
  };

  // Load more content for a specific section
  const loadMoreSectionContent = useCallback(async (sectionId: string) => {
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;

    const section = sections[sectionIndex];
    if (section.isLoadingMore || !section.hasMore) return;

    // Update loading state
    const updatedSections = [...sections];
    updatedSections[sectionIndex] = { ...section, isLoadingMore: true };
    setSections(updatedSections);

    try {
      const nextPage = section.currentPage + 1;
      const request: SectionContentRequest = {
        categoryId: selectedCategory !== "All" ? selectedCategory : "movie", // Use first category or selected
        sectionId: sectionId,
        type: 'p720',
        page: nextPage,
        size: 10
      };

      const contentResults = await getSectionsContent([request], nextPage, 10);
      
      if (contentResults && contentResults.length > 0) {
        const content = contentResults[0];
        const newSections = [...sections];
        newSections[sectionIndex] = {
          ...section,
          currentPage: nextPage,
          isLoadingMore: false,
          allVideos: [...section.allVideos, ...content.videos],
          hasMore: content.hasNext
        };
        setSections(newSections);
      } else {
        // No more content
        const newSections = [...sections];
        newSections[sectionIndex] = {
          ...section,
          isLoadingMore: false,
          hasMore: false
        };
        setSections(newSections);
      }
    } catch (error) {
      console.error(`Error loading more content for section ${sectionId}:`, error);
      const newSections = [...sections];
      newSections[sectionIndex] = { ...section, isLoadingMore: false };
      setSections(newSections);
    }
  }, [sections, selectedCategory]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    // Clean up old observers
    observerRefs.current.forEach(observer => observer.disconnect());
    observerRefs.current.clear();

    sections.forEach(section => {
      if (!section.hasMore) return;

      const sentinel = document.getElementById(`section-sentinel-${section.id}`);
      if (!sentinel) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && section.hasMore && !section.isLoadingMore) {
              loadMoreSectionContent(section.id);
            }
          });
        },
        { threshold: 0.1, rootMargin: '100px' }
      );

      observer.observe(sentinel);
      observerRefs.current.set(section.id, observer);
    });

    return () => {
      observerRefs.current.forEach(observer => observer.disconnect());
      observerRefs.current.clear();
    };
  }, [sections, loadMoreSectionContent]);

  // Convert VideoVO to DashboardItem
  const convertToDashboardItem = (video: VideoVO): DashboardItem => ({
    id: video.id,
    title: video.title,
    description: video.description,
    fileName: video.fileName,
    coverUrl: video.coverUrl,
    imageQuality: video.imageQuality,
    status: video.status,
    isSeries: video.isSeries,
    seriesId: video.seriesId,
    seasonNumber: video.seasonNumber,
    episodeNumber: video.episodeNumber,
    totalEpisodes: video.totalEpisodes,
    isCompleted: video.isCompleted,
    categoryId: video.categoryId,
    year: video.year,
    region: video.region,
    language: video.language,
    director: video.director,
    actors: video.actors,
    rating: video.rating,
    tags: video.tags,
    createBy: video.createBy,
    createTime: video.createTime,
    views: video.views,
  });

  const MovieCategoryFilter: React.FC<{ display?: string }> = ({ display }) => {
    return (
      <>
        <div
          className={`
            flex flex-row items-center flex-nowrap overflow-x-auto w-[90vw] mx-auto mt-2 mb-5 justify-center
            ${display === 'mobile' ? "overflow-x-auto mt-2 mb-5 md:hidden" : "hidden md:flex"}
          `}
          style={{ scrollbarWidth: "none" }}
        >
          {categoryList.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`md:text-xl mx-1 px-3 py-1 md:px-4 md:py-2 whitespace-nowrap rounded-full hover:scale-105 transition-transform duration-300 cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-gradient-to-b from-[#fbb033] to-[#f69c05] text-white"
                  : "text-gray-300 inset-shadow-[0px_0px_5px_1px] inset-shadow-[#fbb033] hover:text-white transition-colors duration-300"
              }`}
            >
              {getLocalizedCategoryName(cat)}
            </button>
          ))}
        </div>
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </>
    );
  };

  return (
    <>
      {isLoading ? <LoadingPage /> : (
        <>
          <MovieCategoryFilter display="mobile" />
          <BannerSlider banners={banners} />
          
          {/* Fallback UI when no content */}
          {!isLoading && banners.length === 0 && sections.length === 0 && (
            <div className="py-12 px-4 text-center w-full">
              <p className="text-gray-300 text-lg mb-4">No content available right now. We may be updating the catalogue.</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => initializePage()}
                  className="px-4 py-2 bg-[#fbb033] text-black rounded-lg hover:bg-[#f69c05] transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          <div className="flex relative flex-col md:px-20 px-0 w-[100%] mt-4">
            <MovieCategoryFilter />
            <hr className="h-1 rounded-full bg-gradient-to-r from-[#fbb033] via-[#f69c05] to-[#fbb033] border-0" />
            
            {/* Show selected category indicator */}
            {selectedCategory && selectedCategory !== "All" && (
              <div className="py-4 px-4 flex flex-row justify-between items-center width-full">
                <p className="text-gray-300 text-sm">
                  Showing content for: <span className="text-[#fbb033] font-semibold">
                    {categoryMap[selectedCategory] || selectedCategory}
                  </span>
                  <button 
                    onClick={() => handleCategoryChange("All")}
                    className="ml-2 text-xs text-gray-400 hover:text-white underline"
                  >
                    Clear filter
                  </button>
                </p>
              </div>
            )}
            
            {/* Render sections with infinite scroll */}
            {sections.length > 0 ? (
              sections.map((section) => (
                <div key={section.id}>
                  <DashboardSection
                    title={section.title || ""}
                    videos={section.allVideos.map(convertToDashboardItem)}
                    onViewMore={undefined}
                  />
                  
                  {/* Loading indicator for this section */}
                  {section.isLoadingMore && (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fbb033]"></div>
                    </div>
                  )}
                  
                  {/* Intersection observer sentinel */}
                  {section.hasMore && !section.isLoadingMore && (
                    <div 
                      id={`section-sentinel-${section.id}`}
                      className="h-4 w-full"
                      style={{ minHeight: '1px' }}
                    />
                  )}
                </div>
              ))
            ) : selectedCategory && selectedCategory !== "All" ? (
              <div className="py-8 px-4 text-center">
                <p className="text-gray-400 text-lg">
                  No content found for &quot;{categoryMap[selectedCategory] || selectedCategory}&quot;
                </p>
              </div>
            ) : null}
            
            {!user && <SubscriptionSection />}
          </div>
        </>
      )}
    </>
  );
}
