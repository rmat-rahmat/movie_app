'use client';
import React, { useEffect, useState } from 'react';
import MovieModal from "./MovieModal";

interface Movie {
    id: number;
    backdrop_path: string;
    poster_path: string;
    original_title: string;
    description: string;
    overview: string;
    release_date: string;
    vote_average?: number;
    vote_count?: number;
    popularity?: number;
    casts?: {
        id: string;
        name: string;
        character: string;
        profile_path: string;
    }[];
}

interface MovieSectionProps {
    title: string;
    movies: Movie[];
    showRating?: boolean;
    showPlayback?: boolean;
    showViewer?: boolean;
    frameSize?: number;
}

const MovieSection: React.FC<MovieSectionProps> = ({ title, movies, showRating, showPlayback,showViewer,frameSize }) => {
    const [selectedMovieIndex, setSelectedMovieIndex] = useState<number | null>(null);

    if (!movies || movies.length === 0) {
        return <div className="text-center text-gray-500">No movies available</div>;
    }
    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <div className={`grid grid-flow-col auto-cols-[45%] md:auto-cols-[${frameSize?frameSize:20}%]  gap-4 p-4 overflow-x-scroll`}>
                {movies.map((movie, index) => (
                    <div key={movie.id} onClick={() => setSelectedMovieIndex(index)} className={`flex flex-1 flex-col bg-black shadow-md pb-2 shadow-green-500/50 rounded-lg touchable hover:scale-105 transition-transform duration-300 cursor-pointer`} >
                        <div className="relative w-full h-auto rounded-lg mb-2" >
                            <div className="absolute w-full h-full bg-gradient-to-t from-black via-black/30 to-transparent" />
                            <div className="absolute w-full h-full bg-gradient-to-b from-black to-transparent to-[30%]  " />
                            <img className='z-0 rounded-t-lg' src={movie.poster_path} alt={movie.original_title} />
                        </div>
                        <div className='relative px-4 mt-[-30px]  overflow-y-visible'>
                            <h3 className="text-lg font-semibold">{movie.original_title}</h3>
                            <p className="text-sm text-gray-400">{movie.release_date}</p>
                        </div>
                        {showRating && movie.vote_count !== undefined && movie.vote_count > 0 && <div className="flex items-center mt-auto mb-2 align-center justify-center">
                            {[...Array(5)].map((_, index) => (
                                <svg
                                    key={index}
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`h-5 w-5 ${index < Math.ceil((movie.vote_average || 0) / 2) ? 'text-green-500' : 'text-gray-400'}`}
                                    fill={index < Math.ceil((movie.vote_average || 0) / 2) ? 'currentColor' : 'none'}
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={index < Math.ceil((movie.vote_average || 0) / 2) ? 0 : 1}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                            ))}
                        </div>}
                        {showViewer && <div className="flex mt-auto justify-center mt-2 mb-2">
                            
                            <span className="ml-2 text-gray-400">{parseInt(String(movie.popularity ?? "0")).toLocaleString('en-US', { notation: "compact" })} views</span>
                        </div>}
                        
                    </div>
                ))}
            </div>

            <MovieModal
                movie={selectedMovieIndex !== null ? movies[selectedMovieIndex] : null}
                onClose={() => setSelectedMovieIndex(null)} showPlayback={showPlayback}
            />
        </div>
    );
}

export default MovieSection;

