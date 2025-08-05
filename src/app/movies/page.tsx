'use client';

import MovieSlider from "@/components/MovieSlider";
import MovieSection from "@/components/MovieSection";
import { getMovies } from "@/lib/movieApi";
import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import LoadingPage from "@/components/LoadingPage";
import type { VideoSrc } from "@/types/VideoSrc";

export default function Home() {
  const [headerMovies, setHeaderMovies] = useState<VideoSrc[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<VideoSrc[]>([]);
  const [popularMovies, setPopularMovies] = useState<VideoSrc[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<VideoSrc[]>([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<VideoSrc[]>([]);
  const [isloading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    setIsLoading(true);
    try {
      const topRated = await getMovies(10);
      const popular = await getMovies(10);
      const upcoming = await getMovies(10);
      const nowPlaying = await getMovies(10);
      const header = await getMovies(5);
      setTopRatedMovies(topRated);
      setPopularMovies(popular);
      setUpcomingMovies(upcoming);
      setNowPlayingMovies(nowPlaying);
      setHeaderMovies(header);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching movies:", error);
      setIsLoading(false);
    }
  };

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  type MovieCategoryFilterProps = {
    categories: string[];
  };

  const MovieCategoryFilter: React.FC<MovieCategoryFilterProps> = ({ categories }) => {
    return (
      <div className="flex items-center  justify-center space-x-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
            className={`px-4 py-2 rounded-md  hover:scale-105 transition-transform duration-300 cursor-pointer ${selectedCategory === category ? 'bg-[#e50914] text-white' : 'text-gray-300 shadow-[0px_0px_10px_1px]  shadow-[#e50914] hover:text-white transition-colors duration-300'}`}
          >
            {category}
          </button>
        ))}
      </div>
    );
  };

  return (
    <ProtectedLayout>
      {isloading ? <LoadingPage/> :
      <>
      <MovieSlider videos={headerMovies} />
      <div className="flex flex-col md:px-20 px-0 w-[100vw]">
        <MovieCategoryFilter categories={['Romance', 'Thriller', 'Mystery', 'Science Fiction']} />        
        <hr className="border-[#e50914] mt-3" />
        <MovieSection title="Top Rated Movies" videos={topRatedMovies} showRating={true}/>
        <MovieSection title="Popular Movies" videos={popularMovies} />
        <MovieSection title="Upcoming Movies" videos={upcomingMovies} />
        <MovieSection title="Now Playing Movies" videos={nowPlayingMovies} />
      </div>
      </>
      }
      
    </ProtectedLayout>
  );
}

