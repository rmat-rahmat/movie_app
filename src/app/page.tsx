'use client';

import { getDashboard } from "@/lib/movieApi";
import { useEffect, useState } from "react";
import LoadingPage from "@/components/ui/LoadingPage";
import type { DashboardItem, ContentSection } from '@/types/Dashboard';
import SubscriptionSection from "@/components/subscription/SubscriptionSection";
import { allCategories } from "@/lib/categoryList";
import { useAuthStore } from "@/store/authStore";
import DashboardSection from "@/components/movie/DashboardSection";
import DashboardSlider from "@/components/movie/DashboardSlider";
import { getCategoryList,getCategoryTree,type CategoryItem} from "@/lib/movieApi";
import { getLocalizedCategoryName } from '@/utils/categoryUtils';


export default function Home() {
  const [headerMovies, setHeaderMovies] = useState<DashboardItem[]>([]);
  const [isloading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(allCategories);
  const [categoryList, setCategoryList] = useState<CategoryItem[]>([{id:"All",categoryLangLabel:{"en":"All"}}]); // Store fetched category list
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [allSections, setAllSections] = useState<ContentSection[]>([]); // Store original sections
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({}); // Map category IDs to names
  const [selectedCategory, setSelectedCategory] = useState<string | null>("All");
  const { user } = useAuthStore();

  useEffect(() => {
    fetchCategories();
    fetchMovies();
  }, []);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const fetchedCategories = await getCategoryTree();
      if (fetchedCategories && Array.isArray(fetchedCategories)) {
        setCategoryList([{id:"All",categoryLangLabel:{"en":"All"}},...fetchedCategories]);
        // Map category IDs to names
        const idToNameMap: Record<string, string> = {};
        fetchedCategories.forEach(cat => {
          if (cat.id) {
            idToNameMap[cat.id] = getLocalizedCategoryName(cat);
          }
        });
        console.log("Category ID to Name Map:", idToNameMap);
        setCategoryMap(idToNameMap);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchMovies = async () => {
    setIsLoading(true);
    try {
      // Try loading live dashboard from backend first
      const dashboard = await getDashboard(true);

      // If dashboard or its data is missing, fall back to safe defaults
      if (!dashboard || !dashboard.data) {
        console.warn('Dashboard returned empty or missing data; using fallback values');
        setHeaderMovies([]);
        setSections([]);
        setAllSections([]);
        setCategories(allCategories);
        return;
      }

      // Normalize featured content and sections to arrays
      const featured = Array.isArray(dashboard.data.featuredContent) ? dashboard.data.featuredContent : [];
      const originalSections = Array.isArray(dashboard.data.contentSections) ? dashboard.data.contentSections : [];

      setHeaderMovies(featured);
      console.log(originalSections);
      setSections(originalSections);
      setAllSections(originalSections); // Store original sections for filtering

      // derive categories from dashboard response, fallback to existing list
      const dashboardCategories = Array.isArray(dashboard.data.categories) ? dashboard.data.categories : [];

      const safeGetCategoryName = (c: any): string => {
        if (!c) return '';
        try {
          const name = getLocalizedCategoryName(c);
          if (name) return name;
        } catch (e) {
          // ignore
        }
        return c.categoryName || c.categoryAlias || c.id || '';
      };

      const mappedCategories = dashboardCategories.map((c) => safeGetCategoryName(c)).filter(Boolean) as string[];
      const finalCategories = mappedCategories.length > 0 ? Array.from(new Set(mappedCategories)) : allCategories;
      // Ensure "All" is at the beginning
      const categoriesWithAll = finalCategories.includes("All") ? finalCategories : ["All", ...finalCategories];
      setCategories(categoriesWithAll);
    } catch (error) {
      console.error("Error fetching movies:", error);
    } finally {
      // Always clear loading flag so UI doesn't spin indefinitely
      setIsLoading(false);
    }
  };

  
  // Filter sections based on selected category
  useEffect(() => {
    if (!selectedCategory || selectedCategory === "All") {
      setSections(allSections);
    } else {
      const filteredSections = allSections.map(section => {
        const filteredContents = (section.contents || []).filter(item => {
          // Check if item matches the selected category
          const matchesCategoryId = item.categoryId === selectedCategory;
          const matchesCategoryName = item.categoryId && categoryMap[item.categoryId] === selectedCategory;
          const matchesTags = item.tags?.includes(selectedCategory);
          const matchesTagsCaseInsensitive = item.tags?.some(tag => tag.toLowerCase() === selectedCategory.toLowerCase());
          const matchesTitle = item.title?.toLowerCase().includes(selectedCategory.toLowerCase());
          const matchesDescription = item.description?.toLowerCase().includes(selectedCategory.toLowerCase());
          
          // For debugging - log the first few items to understand the data structure
          if (allSections.length > 0 && section === allSections[0] && item === section.contents?.[0]) {
            console.log('Sample item structure:', {
              title: item.title,
              categoryId: item.categoryId,
              categoryName: item.categoryId ? categoryMap[item.categoryId] : null,
              tags: item.tags,
              selectedCategory,
              matchesCategoryId,
              matchesCategoryName,
              matchesTags,
              matchesTagsCaseInsensitive
            });
          }
          
          return matchesCategoryId || matchesCategoryName || matchesTags || matchesTagsCaseInsensitive || matchesTitle || matchesDescription;
        });

        return {
          ...section,
          contents: filteredContents
        };
      }).filter(section => (section.contents || []).length > 0); // Only show sections with content

      setSections(filteredSections);
    }
  }, [selectedCategory, allSections, categoryMap]);
  type MovieCategoryFilterProps = {
    categories: string[];
    display?: string;
  };

  // Expanded categories similar to YouTube


  const MovieCategoryFilter: React.FC<MovieCategoryFilterProps> = ({ categories, display }) => {
    return (
      <>
        {/* {display === 'mobile' && <hr className="flex w-[90vw] mx-auto md:hidden h-1 rounded-full bg-gradient-to-r from-[#fbb033] via-[#f69c05] to-[#fbb033] border-0 mt-3" />} */}
        <div
          className={`
            flex flex-row items-center flex-nowrap overflow-x-auto  w-[90vw] mx-auto mt-2 mb-5 justify-center
            ${display === 'mobile'
              ? "overflow-x-auto mt-2 mb-5 md:hidden"
              : "hidden md:flex"}
          `}
          style={{ scrollbarWidth: "none" }}
        >
              {categoryList.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    if(cat.id==="All"){
                      return;
                    }
                    location.href = `/category/${cat.id}`
                    // setSelectedCategory(getLocalizedCategoryName(cat) === selectedCategory ? null : getLocalizedCategoryName(cat)||"All")
                  }}
                  className={` md:text-xl mx-1 px-3 py-1 md:px-4 md:py-2 whitespace-nowrap rounded-full hover:scale-105 transition-transform duration-300 cursor-pointer ${selectedCategory === getLocalizedCategoryName(cat)
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
      {isloading ? <LoadingPage /> :
        <>
          <MovieCategoryFilter display="mobile" categories={categories} />
          <DashboardSlider videos={headerMovies} />
          {/* Fallback UI when dashboard returned empty featured content and no sections */}
          {!isloading && headerMovies.length === 0 && sections.length === 0 && (
            <div className="py-12 px-4 text-center w-full">
              <p className="text-gray-300 text-lg mb-4">No content available right now. We may be updating the catalogue.</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => fetchMovies()}
                  className="px-4 py-2 bg-[#fbb033] text-black rounded-lg hover:bg-[#f69c05] transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={() => { location.href = '/category'; }}
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:text-white"
                >
                  Browse categories
                </button>
              </div>
            </div>
          )}
          <div className="flex relative flex-col md:px-20 px-0 w-[100%] mt-4">
            <MovieCategoryFilter categories={categories} />
            <hr className="h-1 rounded-full bg-gradient-to-r from-[#fbb033] via-[#f69c05] to-[#fbb033] border-0" />
            
            {/* Show selected category indicator */}
            {selectedCategory && selectedCategory !== "All" && (
              <div className="py-4 px-4 flex flex-row justify-between items-center width-full ">
                <p className="text-gray-300 text-sm">
                  Showing content for: <span className="text-[#fbb033] font-semibold">{selectedCategory}</span>
                  <button 
                    onClick={() => setSelectedCategory(null)}
                    className="ml-2 text-xs text-gray-400 hover:text-white underline"
                  >
                    Clear filter
                  </button>
                </p>
                {sections.length>0 && <button 
                  onClick={() => location.href = `/category/${categoryList.find(cat => getLocalizedCategoryName(cat) === selectedCategory)?.id}`}
                  className="mt-2 px-4 py-2 bg-[#fbb033] text-black rounded-lg hover:bg-[#f69c05] transition-colors cursor-pointer"
                >
                  Show All Content
                </button>}
              </div>
            )}
            
            {/* If we have dashboard sections render them dynamically */}
            {sections.length > 0 ? (
              sections.map((sec) => (
                <DashboardSection
                  key={sec.id || sec.title}
                  onViewMore={sec.hasMore ? () => location.href = `/viewmore/${sec.id}` : undefined}
                  title={sec.title || ""}
                  videos={sec.contents || []}
                />
              ))
            ) : selectedCategory && selectedCategory !== "All" ? (
              <div className="py-8 px-4 text-center">
                <p className="text-gray-400 text-lg">No content found for &quot;{selectedCategory}&quot;</p>
                <button 
                  onClick={() => location.href = `/category/${categoryList.find(cat => getLocalizedCategoryName(cat) === selectedCategory)?.id}`}
                  className="mt-2 px-4 py-2 bg-[#fbb033] text-black rounded-lg hover:bg-[#f69c05] transition-colors cursor-pointer"
                >
                  Show All Content
                </button>
              </div>
            ) : null}
            {!user && <SubscriptionSection />}
          </div>
        </>
      }
    </>
  );
}

