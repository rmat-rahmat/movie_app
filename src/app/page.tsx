'use client';

import MovieSection from "@/components/MovieSection";
import { getMovies, getSeries, getShort } from "@/lib/movieApi";
import { useEffect, useState } from "react";
import LoadingPage from "@/components/LoadingPage";
import GuestLayout from "@/components/GuestLayout";
import HeaderSlider from "@/components/HeaderSlider";
import type { VideoSrc } from "@/types/VideoSrc";

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
        {display === 'mobile' && <hr className="flex md:hidden border-green-500/40 mt-18" />}
        <div
          className={`
            flex justify-center w-full overflow-x-auto mt-2 mb-5
            ${display === 'mobile'
              ? "overflow-x-auto mt-2 mb-5 md:hidden"
              : "hidden md:flex"}
          `}
        >
          <div className="flex w-full gap-2 md:gap-4 px-2 py-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                className={`px-3 py-1 md:px-4 md:py-2 whitespace-nowrap rounded-md hover:scale-105 transition-transform duration-300 cursor-pointer ${selectedCategory === category
                    ? "bg-green-500/50 text-white"
                    : "text-gray-300 shadow-[0px_0px_10px_1px] shadow-green-500/50 hover:text-white transition-colors duration-300"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
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
            <hr className="border-green-500/50 mt-3" />
            <MovieSection
              icon={<svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M10 8l6 4-6 4V8z" /></svg>}
              onViewMore={() => console.log("View More Movies")}
              title="Short" videos={shortMovies} showRating={true} showPlayback={true} showViewer={true} />
            <MovieSection
            icon={<svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>}
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

