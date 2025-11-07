'use client';

// ============================================================================
// HOME PAGE - Main landing page with banners, categories, and content sections
// ============================================================================
// This page displays:
// - Banner slider with promotional content
// - Category filters for content organization
// - Multiple content sections with infinite scroll
// - Subscription promotion for non-logged-in users
//
// Key Features:
// - Horizontal infinite scroll per section
// - Category-based filtering
// - Lazy loading with pagination
// - Multi-language support (i18n)
// ============================================================================

import { getHomeSections, loadMoreSectionContent, getBannerList } from "@/lib/movieApi";
import { useEffect, useState, useCallback } from "react";
import LoadingPage from "@/components/ui/LoadingPage";
import type { DashboardItem, BannerVO, VideoVO, HomeSectionVO } from '@/types/Dashboard';
import SubscriptionSection from "@/components/subscription/SubscriptionSection";
import { useAuthStore } from "@/store/authStore";
import DashboardSection from "@/components/movie/DashboardSection";
import BannerSlider from "@/components/movie/BannerSlider";
import { getCategoryTree, type CategoryItem } from "@/lib/movieApi";
import { getLocalizedCategoryName } from '@/utils/categoryUtils';
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Extended section type that includes pagination state
 * Extends HomeSectionVO from API with client-side state management
 */
interface ExtendedSection extends HomeSectionVO {
  currentPage: number;      // Current page for pagination
  isLoadingMore: boolean;   // Loading state for this section
  allVideos: VideoVO[];     // Accumulated videos from all pages
  categoryId?: string;      // Associated category for filtering
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Home() {
  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  
  // Banner data for hero carousel
  const [banners, setBanners] = useState<BannerVO[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);           // Initial page load
  const [contentLoading, setContentLoading] = useState(false); // Category change load
  
  // Category management
  const [categoryList, setCategoryList] = useState<CategoryItem[]>([
    { id: "All", categoryLangLabel: { "en": "All", "zh": "所有", "ms": "Semua", "de": "Alle", "fr": "Tous", "ru": "Все" } }
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  
  // Content sections with pagination state
  const [sections, setSections] = useState<ExtendedSection[]>([]);
  
  // Hooks
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const router = useRouter();

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------
  
  /**
   * Initialize page on mount
   * Loads categories, banners, and initial content sections
   */
  useEffect(() => {
    initializePage();
  }, []);

  /**
   * Main initialization function
   * Fetches all required data in parallel for faster load time
   */
  const initializePage = async () => {
    setIsLoading(true);
    try {
      // Fetch all initial data in parallel
      await Promise.all([
        fetchCategories(),    // Get category tree
        fetchBanners(),       // Get promotional banners
        fetchHomeSections()   // Get content sections
      ]);
    } catch (error) {
      console.error("Error initializing page:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // DATA FETCHING FUNCTIONS
  // --------------------------------------------------------------------------

  /**
   * Fetch banners from API
   * Selects mobile (type=2) or desktop (type=1) based on screen size
   */
  const fetchBanners = async () => {
    try {
      // Detect device type for appropriate banner format
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const bannerType = isMobile ? 2 : 1;
      
      // Fetch banners with 720p quality
      const fetchedBanners = await getBannerList(bannerType, '720');
      if (fetchedBanners && Array.isArray(fetchedBanners)) {
        setBanners(fetchedBanners);
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
    }
  };

  /**
   * Fetch category tree from API
   * Builds category list with "All" option and creates ID-to-name mapping
   */
  const fetchCategories = async () => {
    try {
      const fetchedCategories = await getCategoryTree();
      if (fetchedCategories && Array.isArray(fetchedCategories)) {
        // Add "All" option at the beginning
        setCategoryList([
          { id: "All", categoryLangLabel: { "en": "All", "zh": "所有", "ms": "Semua", "de": "Alle", "fr": "Tous", "ru": "Все" } },
          ...fetchedCategories
        ]);
        
        // Create mapping of category IDs to localized names
        // Used for displaying category names throughout the app
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

  /**
   * Fetch home sections using getHomeSections API
   * @param categoryId - Optional category filter (undefined = all categories)
   * 
   * API returns sections with initial content (15 items per section)
   * Each section is extended with pagination state for infinite scroll
   */
  const fetchHomeSections = async (categoryId?: string) => {
    try {
      const currentLanguage = i18n.language;
      
      // Fetch sections with category filter if selected
      // Pass undefined for "All" to get all categories
      const homeSections = await getHomeSections(
        categoryId && categoryId !== "All" ? categoryId : undefined,
        '720',  // Image quality
        15,     // Initial items per section
        currentLanguage
      );

      if (homeSections && Array.isArray(homeSections)) {
        // Extend each section with pagination state
        const extendedSections: ExtendedSection[] = homeSections.map(section => ({
          ...section,
          currentPage: 1,              // Start at page 1
          isLoadingMore: false,        // Not loading initially
          allVideos: [...section.contents]  // Initialize with first page
        }));
        
        console.log("Fetched home sections:", extendedSections);
        setSections(extendedSections);
      }
    } catch (error) {
      console.error("Error fetching home sections:", error);
    }
  };

  // --------------------------------------------------------------------------
  // EVENT HANDLERS
  // --------------------------------------------------------------------------

  /**
   * Handle category filter change
   * Reloads content for selected category
   * 
   * @param categoryId - Selected category ID or "All"
   */
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setContentLoading(true);
    
    // Reload sections with new category filter
    fetchHomeSections(categoryId).finally(() => setContentLoading(false));
  };

  /**
   * Load more content for a specific section (horizontal scroll pagination)
   * Called when user scrolls near the end of a section
   * 
   * @param sectionId - ID of the section to load more content for
   * 
   * Flow:
   * 1. Find the section in state
   * 2. Check if already loading or no more content
   * 3. Set loading state
   * 4. Fetch next page from API
   * 5. Append new content to section's allVideos
   * 6. Update pagination state
   */
  const loadMoreForSection = useCallback(async (sectionId: string) => {
    // Find section in state
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;

    const section = sections[sectionIndex];
    
    // Guard: Don't load if already loading or no more content
    if (section.isLoadingMore || !section.hasMore) return;

    // Set loading state for this section
    const updatedSections = [...sections];
    updatedSections[sectionIndex] = { ...section, isLoadingMore: true };
    setSections(updatedSections);

    try {
      const nextPage = section.currentPage + 1;
      
      // Use selected category or section's default category
      const categoryIdToUse = selectedCategory !== "All" 
        ? selectedCategory 
        : (section.categoryId || "movie");

      // Fetch next page of content
      const contentResult = await loadMoreSectionContent(
        sectionId,
        categoryIdToUse,
        '720',      // Image quality
        nextPage,   // Page number
        10          // Items per page
      );
      
      if (contentResult && contentResult.videos && contentResult.videos.length > 0) {
        // Success: Append new videos to section
        const newSections = [...sections];
        newSections[sectionIndex] = {
          ...section,
          currentPage: nextPage,
          isLoadingMore: false,
          allVideos: [...section.allVideos, ...contentResult.videos],
          hasMore: contentResult.hasNext
        };
        setSections(newSections);
      } else {
        // No more content available
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
      
      // Reset loading state on error
      const newSections = [...sections];
      newSections[sectionIndex] = { ...section, isLoadingMore: false };
      setSections(newSections);
    }
  }, [sections, selectedCategory]);

  // --------------------------------------------------------------------------
  // UTILITY FUNCTIONS
  // --------------------------------------------------------------------------

  /**
   * Convert VideoVO from API to DashboardItem for components
   * Maps API response format to internal component props
   * 
   * @param video - Video object from API
   * @returns DashboardItem for rendering
   */
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

  // --------------------------------------------------------------------------
  // SUB-COMPONENTS
  // --------------------------------------------------------------------------

  /**
   * Category filter component
   * Shows horizontally scrollable category buttons
   * 
   * @param display - "mobile" for mobile-only view, undefined for desktop-only
   * 
   * Mobile behavior: Navigate to category page
   * Desktop behavior: Filter content on current page
   */
  const MovieCategoryFilter: React.FC<{ display?: string }> = ({ display }) => {
    return (
      <>
        <div
          className={`
            flex flex-row items-center md:justify-center flex-nowrap overflow-x-auto w-[94vw] mx-auto mt-2 mb-5
            ${display === 'mobile' ? "overflow-x-auto mt-2 mb-5 md:hidden" : "hidden md:flex"}
          `}
          style={{ scrollbarWidth: "none" }}
        >
          {categoryList
            .filter(cat => !!cat.id)
            .map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => {
                  // Mobile: Navigate to category page
                  // Desktop: Filter current page
                  if (display === 'mobile') {
                    router.push(`/category/${cat.id}`);
                  } else {
                    handleCategoryChange(cat.id);
                  }
                }}
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
        {/* Hide scrollbar */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </>
    );
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <>
      {/* Initial page load - show full loading screen */}
      {isLoading ? (
        <LoadingPage />
      ) : (
        <>
          {/* Mobile category filter - navigates to category pages */}
          <MovieCategoryFilter display="mobile" />
          
          {/* Hero banner slider */}
          <BannerSlider banners={banners} />
          
          {/* Fallback when no content is available */}
          {!isLoading && banners.length === 0 && sections.length === 0 && (
            <div className="py-12 px-4 text-center w-full">
              <p className="text-gray-300 text-lg mb-4">{t('home.noContentAvailable')}</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => initializePage()}
                  className="px-4 py-2 bg-[#fbb033] text-black rounded-lg hover:bg-[#f69c05] transition-colors"
                >
                  {t('home.retry')}
                </button>
              </div>
            </div>
          )}

          {/* Main content area */}
          <div className="flex relative flex-col md:px-20 px-0 w-[100%] md:mt-4">
            {/* Desktop category filter - filters content on current page */}
            <MovieCategoryFilter />
            
            {/* Selected category indicator with clear filter option */}
            {selectedCategory && selectedCategory !== "All" && (
              <div className="py-4 px-4 flex flex-row justify-between items-center width-full">
                <p className="text-gray-300 text-sm">
                  {t('home.showingContentFor')}{' '}
                  <span className="text-[#fbb033] font-semibold">
                    {categoryMap[selectedCategory] || selectedCategory}
                  </span>
                  <button 
                    onClick={() => handleCategoryChange("All")}
                    className="ml-2 text-xs text-gray-400 hover:text-white underline"
                  >
                    {t('home.clearFilter')}
                  </button>
                </p>
              </div>
            )}
            
            {/* Content sections with horizontal infinite scroll */}
            {sections.length > 0 ? (
              !contentLoading ? (
                sections.map((section) => (
                  <div key={section.id}>
                    {/* Section with horizontal scrolling content */}
                    <DashboardSection
                      title={section.title}
                      videos={section.allVideos.map(convertToDashboardItem)}
                      // Show "View More" button if there's more content
                      onViewMore={section.hasMore ? () => {
                        const title = encodeURIComponent(section.title || '');
                        location.href = `/viewmore?id=${section.id}&title=${t(section.id, section.title)}&ctg=${section.categoryId ? section.categoryId : 'movie'}`;
                      } : undefined}
                      // Load more when scrolled to end of section
                      onScrollEnd={() => {
                        console.log(`Scrolled to end of section ${section.id}`);
                        loadMoreForSection(section.id);
                      }}
                    />
                    
                    {/* Loading indicator for this section */}
                    {section.isLoadingMore && (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fbb033]"></div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // Loading state when changing categories
                <LoadingPage className="relative h-[50vh] z-[-1]" />
              )
            ) : selectedCategory && selectedCategory !== "All" ? (
              // No content found for selected category
              <div className="md:py-8 px-4 text-center">
                <p className="text-gray-400 text-lg">
                  {t('home.noContentFound')} &quot;{categoryMap[selectedCategory] || selectedCategory}&quot;
                </p>
              </div>
            ) : null}
            
            {/* Subscription promotion for non-logged-in users */}
            {!user && <SubscriptionSection />}
          </div>
        </>
      )}
    </>
  );
}

// ============================================================================
// END OF HOME PAGE
// ============================================================================
