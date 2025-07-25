'use client';

import Image from "next/image";
import Navbar from "@/components/Navbar";
import HomeSlider from "@/components/HomeSlider";
import MovieSection from "@/components/MovieSection"; // Assuming you have a MovieSection component
import { getMovies } from "@/lib/movieApi"; // Adjust the import path as necessary
import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";


export default function Home() {
  const [headerMovies, setHeaderMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);

  useEffect(() => {

    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const topRated = await getMovies(10);
      const popular = await getMovies(10);
      const upcoming = await getMovies(10);
      const nowPlaying = await getMovies(10); // Adjust the number as needed  
      const header = await getMovies(5); // Fetch 3 movies for the header
      setTopRatedMovies(topRated);
      setPopularMovies(popular);
      setUpcomingMovies(upcoming);
      setNowPlayingMovies(nowPlaying);
      setHeaderMovies(header);
    } catch (error) {
      console.error("Error fetching movies:", error);
    }
  };

  return (
    <ProtectedLayout>
      <HomeSlider slides={headerMovies} />
      <div className="flex flex-col md:px-20 px-0 w-[100vw]">
        <MovieSection title="Top Rated Movies" movies={topRatedMovies} showRating={true}/>
        <MovieSection title="Popular Movies" movies={popularMovies} />
        <MovieSection title="Upcoming Movies" movies={upcomingMovies} />
        <MovieSection title="Now Playing Movies" movies={nowPlayingMovies} />

      </div>
    </ProtectedLayout>
  );
}

