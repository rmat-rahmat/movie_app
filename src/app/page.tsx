'use client';

import MovieSection from "@/components/movie/MovieSection";
import { getMovies, getSeries, getShort, getUpcomingMovies, getPopularMovie, getTopRatedMovies, getNowPlayingMovies } from "@/lib/movieApi";
import { useEffect, useState } from "react";
import LoadingPage from "@/components/ui/LoadingPage";
import HeaderSlider from "@/components/layout/HeaderSlider";
import type { VideoSrc } from "@/types/VideoSrc";
import { FiPlayCircle, FiStar } from "react-icons/fi";
import SubscriptionSection from "@/components/subscription/SubscriptionSection";
import { allCategories } from "@/lib/categoryList";
import NavigationFrame from "@/components/ui/NavigationFrame";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const [headerMovies, setHeaderMovies] = useState<VideoSrc[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<VideoSrc[]>([]);
  const [popularMovies, setPopularMovies] = useState<VideoSrc[]>([]);
  const [drama, setdrama] = useState<VideoSrc[]>([]);
  const [isloading, setIsLoading] = useState(true);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<VideoSrc[]>([]);
  const [shortMovies, setShortMovies] = useState<VideoSrc[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    setIsLoading(true);
    try {
      const topRated = await getTopRatedMovies(1);
      const popular = await getPopularMovie(1);
      const newdrama = await getShort("UCXhPKXcBaBwpwOjq4l8mHIw", 10);
      const nowPlaying = await getNowPlayingMovies(1);
      
      const header = await getUpcomingMovies(1)
      setTopRatedMovies(topRated);
      setPopularMovies(popular);
      setdrama(newdrama);
      setNowPlayingMovies(nowPlaying);
      setHeaderMovies(header);
      const short = await getShort("UC2xVncJghTKzq4HvjzfIcOg", 10);
      setShortMovies(short);
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
        {display === 'mobile' && <hr className="flex md:hidden h-1 rounded-full bg-gradient-to-r from-[#fbb033] via-[#f69c05] to-[#fbb033] border-0 mt-0" />}
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
            className="flex w-full gap-2 md:gap-4 px-2 py-1"
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
          <MovieCategoryFilter display="mobile" categories={allCategories} />
          <HeaderSlider videos={headerMovies} />
          <div className="flex flex-col md:px-20 px-0 w-[100%] mt-4">
            <MovieCategoryFilter categories={allCategories} />
            <hr className="h-1 rounded-full bg-gradient-to-r from-[#fbb033] via-[#f69c05] to-[#fbb033] border-0"/>
            {user && <MovieSection
              icon={<FiPlayCircle className="h-6 w-6 text-[#fbb033]" />}
              onViewMore={() => console.log("View More Movies")}
              title="Recently Watch" videos={shortMovies} showRating={true} showPlayback={true} showViewer={true} />}
            <MovieSection
              icon={<FiPlayCircle className="h-6 w-6 text-[#fbb033]" />}
              onViewMore={() => console.log("View More Movies")}
              title="Short" videos={shortMovies} showRating={true} showPlayback={true} showViewer={true} />
            <MovieSection
              icon={<FiStar className="h-6 w-6 text-yellow-400" />}
              title="Top Rated Movies" videos={topRatedMovies} showRating={true} />
            {!user && <SubscriptionSection />}
            <MovieSection title="Popular Movies" videos={popularMovies} />
            <MovieSection title="Drama" frameSize={30} videos={drama} showPlayback={true} showViewer={true} />
            <MovieSection title="Now Playing Movies" videos={nowPlayingMovies} />
          </div>
        </>
      }
    </>
  );
}

