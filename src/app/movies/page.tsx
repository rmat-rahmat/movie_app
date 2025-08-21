'use client';

import MovieSlider from "@/components/movie/MovieSlider";
import MovieSection from "@/components/movie/MovieSection";
import { getMovies,getNowPlayingMovies,getPopularMovie,getTopRatedMovies,getUpcomingMovies } from "@/lib/movieApi";
import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/auth/ProtectedLayout";
import LoadingPage from "@/components/ui/LoadingPage";
import type { VideoSrc } from "@/types/VideoSrc";
import { allCategories } from "@/lib/categoryList";
import MovieCategoryFilter from "@/components/movie/MovieCategoryFilter";

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
      const topRated = await getTopRatedMovies(1);
      const popular = await getPopularMovie(1);
      const upcoming = await getUpcomingMovies(1);
      const nowPlaying = await getNowPlayingMovies(1);
      // const header = await getMovies(5);
      setTopRatedMovies(topRated);
      setPopularMovies(popular);
      setUpcomingMovies(upcoming);
      setNowPlayingMovies(nowPlaying);
      setHeaderMovies(upcoming);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching movies:", error);
      setIsLoading(false);
    }
  };

  return (
    <>
      {isloading ? <LoadingPage/> :
      <>
      <MovieSlider videos={headerMovies} />
      <div className="flex flex-col md:px-20 px-0 w-[100%] mt-4">
        <MovieCategoryFilter categories={allCategories} />
        <hr className="border-[#e50914] mt-3" />
        <MovieSection title="Top Rated Movies" videos={topRatedMovies} showRating={true}/>
        <MovieSection title="Popular Movies" videos={popularMovies} />
        <MovieSection title="Upcoming Movies" videos={upcomingMovies} />
        <MovieSection title="Now Playing Movies" videos={nowPlayingMovies} />
      </div>
      </>
      }
      
    </>
  );
}

