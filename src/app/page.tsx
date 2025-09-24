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
      if (dashboard && dashboard.data) {
          // featured content -> header

          setHeaderMovies(dashboard.data.featuredContent || []);
          const originalSections = dashboard.data.contentSections || [];
          console.log(originalSections)
          setSections(originalSections);
          setAllSections(originalSections); // Store original sections for filtering
          // derive categories from dashboard response, fallback to existing list
          const dashboardCategories = dashboard.data.categories || [];
          const mappedCategories = dashboardCategories.map((c) => getLocalizedCategoryName(c)).filter(Boolean) as string[];
          const finalCategories = mappedCategories.length > 0 ? Array.from(new Set(mappedCategories)) : allCategories;
          // Ensure "All" is at the beginning
          const categoriesWithAll = finalCategories.includes("All") ? finalCategories : ["All", ...finalCategories];
          setCategories(categoriesWithAll);
          
          // Create a map of category IDs to names for better filtering
          // const categoryIdToName: Record<string, string> = {};
          // dashboardCategories.forEach(cat => {
          //   if (cat.id) {
          //     categoryIdToName[cat.id] = cat.categoryName || cat.categoryAlias || cat.id;
          //   }
          // });
          // setCategoryMap(categoryIdToName);
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
    } catch (error) {
      console.error("Error fetching movies:", error);
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
        {display === 'mobile' && <hr className="flex md:hidden h-1 rounded-full bg-gradient-to-r from-[#fbb033] via-[#f69c05] to-[#fbb033] border-0 mt-3" />}
        <div
          className={`
            flex justify-center w-full overflow-x-auto mt-2 mb-5
            ${display === 'mobile'
              ? "overflow-x-auto mt-2 mb-5 md:hidden"
              : "hidden md:flex"}
          `}
          style={{ scrollbarWidth: "none" }}
        >
          <div
            className="flex w-full gap-2 md:gap-4 px-2 py-1 justify-center"
            style={{ scrollbarWidth: "none" }}
          >
            {categoryList.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  location.href = `/category/${cat.id}`
                  // setSelectedCategory(getLocalizedCategoryName(cat) === selectedCategory ? null : getLocalizedCategoryName(cat)||"All")
                }}
                className={`px-3 py-1 md:px-4 md:py-2 whitespace-nowrap rounded-md hover:scale-105 transition-transform duration-300 cursor-pointer ${selectedCategory === getLocalizedCategoryName(cat)
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
        </div>
      </>
    );
  };

  return (
    <>
      {isloading ? <LoadingPage /> :
        <>
          <MovieCategoryFilter display="mobile" categories={categories} />
          <DashboardSlider videos={headerMovies} />
          <div className="flex flex-col md:px-20 px-0 w-[100%] mt-4">
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

