'use client';
import React, {  useState } from 'react';
import MovieModal from "./MovieModal";
import type { VideoSrc } from '@/types/VideoSrc';
import Image from "next/image";


interface MovieSectionProps {
    title: string;
    videos: VideoSrc[]; // Use array of any instead of Movie[]
    showRating?: boolean;
    showPlayback?: boolean;
    showViewer?: boolean;
    frameSize?: number;
}

const MovieSection: React.FC<MovieSectionProps> = ({ title, videos, showRating, showPlayback, showViewer, frameSize }) => {
    const [selectedMovieIndex, setSelectedMovieIndex] = useState<number | null>(null);

    if (!videos || videos.length === 0) {
        return <div className="text-center text-gray-500">No movies available</div>;
    }
    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <div className={`grid grid-flow-col auto-cols-[45%] ${frameSize ? `md:auto-cols-[${frameSize}%]` : "md:auto-cols-[20%]"}  gap-4 p-4 overflow-x-scroll`}>
                {videos.map((video: VideoSrc, index: number) => (
                    <div
                        key={video.id}
                        onClick={() => setSelectedMovieIndex(index)}
                        className={`flex flex-1 flex-col bg-black shadow-md pb-2 shadow-green-500/50 rounded-lg touchable hover:scale-105 transition-transform duration-300 cursor-pointer`}
                    >
                        <div className="relative w-full h-auto rounded-lg mb-2" >
                            <div className="absolute w-full h-full bg-gradient-to-t from-black via-black/30 to-transparent" />
                            <div className="absolute w-full h-full bg-gradient-to-b from-black to-transparent to-[30%]  " />
                            <div className="relative w-full h-[300px]">
                                <Image
                                    src={video.potrait_image || ""}
                                    alt={video.title}
                                    fill
                                    className="z-0 rounded-t-lg object-cover"
                                    sizes="100vw"
                                    priority={index === 0}
                                />
                            </div>
                        </div>
                        <div className='relative px-4 mt-[-30px]  overflow-y-visible'>
                            <h3 className="text-lg font-semibold">{video.title}</h3>
                            <p className="text-sm text-gray-400">{video.release_date}</p>
                        </div>
                        {showRating && video.vote_count !== undefined && video.vote_count > 0 && (
                            <div className="flex items-center mt-auto mb-2 align-center justify-center">
                                {[...Array(5)].map((_, index: number) => (
                                    <svg
                                        key={index}
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-5 w-5 ${index < Math.ceil((video.vote_average || 0) / 2) ? 'text-green-500' : 'text-gray-400'}`}
                                        fill={index < Math.ceil((video.vote_average || 0) / 2) ? 'currentColor' : 'none'}
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={index < Math.ceil((video.vote_average || 0) / 2) ? 0 : 1}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                ))}
                            </div>
                        )}
                        {showViewer && (
                            <div className="flex mt-auto justify-center mt-2 mb-2">
                                <span className="ml-2 text-gray-400">
                                    {parseInt(String(video.popularity ?? "0")).toLocaleString('en-US', { notation: "compact" })} views
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {selectedMovieIndex !== null && (
                <MovieModal
                    video={videos[selectedMovieIndex]}
                    onClose={() => setSelectedMovieIndex(null)} showPlayback={showPlayback}
                />
            )}
        </div>
    );
}

export default MovieSection;

