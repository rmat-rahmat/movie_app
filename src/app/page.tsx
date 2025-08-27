/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { getUpcomingMovies, getDashboard } from "@/lib/movieApi";
import { useEffect, useState } from "react";
import LoadingPage from "@/components/ui/LoadingPage";
import type { DashboardItem, ContentSection } from '@/types/Dashboard';
import SubscriptionSection from "@/components/subscription/SubscriptionSection";
import { allCategories } from "@/lib/categoryList";
import { useAuthStore } from "@/store/authStore";
import DashboardSection from "@/components/movie/DashboardSection";
import DashboardSlider from "@/components/movie/DashboardSlider";

export default function Home() {
  const [headerMovies, setHeaderMovies] = useState<DashboardItem[]>([]);
  const [isloading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(allCategories);
  const [sections, setSections] = useState<ContentSection[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    setIsLoading(true);
    try {
      // Try loading live dashboard from backend first
      const dashboard = await getDashboard(true);
      if (dashboard && dashboard.data) {
          // featured content -> header

          setHeaderMovies(dashboard.data.featuredContent || []);
          setSections(dashboard.data.contentSections || []);
          // derive categories from dashboard response, fallback to existing list
          const mappedCategories = (dashboard.data.categories || []).map((c) => c.categoryName || c.categoryAlias || c.id).filter(Boolean) as string[];
          setCategories(mappedCategories.length > 0 ? Array.from(new Set(mappedCategories)) : allCategories);
          setIsLoading(false);
          return;
        }

        // fallback: only fetch header upcoming movies to display
        const header = await getUpcomingMovies(1);
        // map VideoSrc -> DashboardItem for headerMovies state
        const headerItems: DashboardItem[] = (header || []).map(h => ({
          id: String(h.id),
          title: h.title || '',
          description: h.description || '',
          coverUrl: h.backdrop_image || h.potrait_image || undefined,
          customCoverUrl: h.potrait_image || h.backdrop_image || undefined,
          createTime: h.release_date || undefined,
          rating: (h.vote_average as any) ?? undefined,
          fileSize: (h.popularity as any) ?? undefined,
        }));
        setHeaderMovies(headerItems);
        setIsLoading(false);
    } catch (error) {
      console.error("Error fetching movies:", error);
      setIsLoading(false);
    }
  };

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                className={`px-3 py-1 md:px-4 md:py-2 whitespace-nowrap rounded-md hover:scale-105 transition-transform duration-300 cursor-pointer ${selectedCategory === category
                  ? "bg-gradient-to-b from-[#fbb033] to-[#f69c05] text-white"
                  : "text-gray-300 inset-shadow-[0px_0px_5px_1px] inset-shadow-[#fbb033] hover:text-white transition-colors duration-300"
                  }`}
              >
                {category}
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
            {/* If we have dashboard sections render them dynamically */}
            {sections.length > 0 && (
              sections.map((sec) => (
                <DashboardSection
                  key={sec.id || sec.title}
                  onViewMore={sec.hasMore ? () => console.log("View More Movies") : undefined}
                  title={sec.title || ""}
                  videos={sec.contents || []}
                />
              ))
            )}
            {!user && <SubscriptionSection />}
          </div>
        </>
      }
    </>
  );
}

