'use client';

import MovieSlider from "@/components/MovieSlider";
import MovieSection from "@/components/MovieSection"; // Assuming you have a MovieSection component
import { getMovies } from "@/lib/movieApi"; // Adjust the import path as necessary
import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import LoadingPage from "@/components/LoadingPage";


export default function Home() {
  const [headerMovies, setHeaderMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
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
      const nowPlaying = await getMovies(10); // Adjust the number as needed  
      const header = await getMovies(5); // Fetch 3 movies for the header
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
            className={`px-4 py-2 rounded-md  hover:scale-105 transition-transform duration-300 cursor-pointer ${selectedCategory === category ? 'bg-green-500/50 text-white' : 'text-gray-300 shadow-[0px_0px_10px_1px]  shadow-green-500/50 hover:text-white transition-colors duration-300'}`}
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
      <MovieSlider slides={headerMovies} />
      <div className="flex flex-col md:px-20 px-0 w-[100vw]">
        
        <MovieCategoryFilter categories={['Romance', 'Thriller', 'Mystery', 'Science Fiction']} />        
        <hr className="border-green-500/50 mt-3" />
        <MovieSection title="Top Rated Movies" movies={topRatedMovies} showRating={true}/>
        <MovieSection title="Popular Movies" movies={popularMovies} />
        <MovieSection title="Upcoming Movies" movies={upcomingMovies} />
        <MovieSection title="Now Playing Movies" movies={nowPlayingMovies} />

      </div>
      </>
      }
      
    </ProtectedLayout>
  );
}

