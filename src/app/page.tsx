'use client';

import MovieSection from "@/components/MovieSection";
import { getMovies, getSeries, getShort } from "@/lib/movieApi";
import { useEffect, useState } from "react";
import LoadingPage from "@/components/LoadingPage";
import GuestLayout from "@/components/GuestLayout";
import HeaderSlider from "@/components/HeaderSlider";
import type { VideoSrc } from "@/types/VideoSrc";
import { FiPlayCircle, FiStar } from "react-icons/fi";

export default function Home() {
  const [headerMovies, setHeaderMovies] = useState<VideoSrc[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<VideoSrc[]>([]);
  const [popularMovies, setPopularMovies] = useState<VideoSrc[]>([]);
  const [drama, setdrama] = useState<VideoSrc[]>([]);
  const [isloading, setIsLoading] = useState(true);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<VideoSrc[]>([]);
  const [shortMovies, setShortMovies] = useState<VideoSrc[]>([]);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    setIsLoading(true);
    try {
      const topRated = await getMovies(10);
      const popular = await getMovies(10);
      const newdrama = await getShort("UCXhPKXcBaBwpwOjq4l8mHIw", 10);
      const nowPlaying = await getMovies(10);
      const header = await getSeries("CN");
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
  const allCategories = [
    "All",
    "Romance",
    "Thriller",
    "Mystery",
    "Science Fiction",
    "Music",
    "Gaming",
    "Live",
    "News",
    "Sports",
    "Learning",
    "Fashion & Beauty",
    "Comedy",
    "Movies",
    "TV Shows",
    "Documentary",
    "Animation",
    "Kids",
    "Travel",
    "Food",
    "Technology",
    "Entertainment",
    "Recently Uploaded",
    "Trending",
  ];

  const MovieCategoryFilter: React.FC<MovieCategoryFilterProps> = ({ categories, display }) => {
    return (
      <>
        {display === 'mobile' && <hr className="flex md:hidden h-1 rounded-full bg-gradient-to-r from-[#e50914] via-[#b20710] to-[#e50914] border-0 mt-18" />}
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
                    ? "bg-gradient-to-b from-[#e50914] to-[#b20710] text-white"
                    : "text-gray-300 inset-shadow-[0px_0px_5px_1px] inset-shadow-[#e50914] hover:text-white transition-colors duration-300"
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
    <GuestLayout>
      {isloading ? <LoadingPage /> :
        <>
          <MovieCategoryFilter display="mobile" categories={allCategories} />
          <HeaderSlider videos={headerMovies} />
          <div className="flex flex-col md:px-20 px-0 w-[100%] mt-4">
            <MovieCategoryFilter categories={allCategories} />
            <hr className="h-1 rounded-full bg-gradient-to-r from-[#e50914] via-[#b20710] to-[#e50914] border-0"/>
            <MovieSection
              icon={<FiPlayCircle className="h-6 w-6 text-[#e50914]" />}
              onViewMore={() => console.log("View More Movies")}
              title="Short" videos={shortMovies} showRating={true} showPlayback={true} showViewer={true} />
            <MovieSection
              icon={<FiStar className="h-6 w-6 text-yellow-400" />}
              title="Top Rated Movies" videos={topRatedMovies} showRating={true} />
            <MovieSection title="Popular Movies" videos={popularMovies} />
            <MovieSection title="Drama" frameSize={30} videos={drama} showPlayback={true} showViewer={true} />
            <MovieSection title="Now Playing Movies" videos={nowPlayingMovies} />
          </div>
        </>
      }
    </GuestLayout>
  );
}

