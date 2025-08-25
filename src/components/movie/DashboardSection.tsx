'use client';
import React, { useState } from 'react';
import MovieModal from "./MovieModal";
import type { DashboardItem } from '@/types/Dashboard';
import Image from "next/image";


interface DashboardSectionProps {
    title: string;
    videos: DashboardItem[]; // now accepts DashboardItem from server
    icon?: React.ReactNode;
    showRating?: boolean;
    showPlayback?: boolean;
    showViewer?: boolean;
    frameSize?: number;
    onViewMore?: () => void;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({ title, videos, showRating, showPlayback, showViewer, frameSize,icon,onViewMore }) => {
    const [selectedMovieIndex, setSelectedMovieIndex] = useState<number | null>(null);

    if (!videos || videos.length === 0) {
        return <div className="text-center text-gray-500">No movies available</div>;
    }
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-4 px-0">
                <div className="flex items-center gap-2">
                    {icon}
                    <h2 className="text-2xl font-bold">{title}</h2>
                </div>
                {onViewMore && (
                    <button
                        onClick={onViewMore}
                        className="flex items-center gap-1 text-[#fbb033] hover:text-[#fbb033] font-medium text-sm"
                    >
                        View More
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
            </div>
            <div className={`hide-scrollbar grid grid-flow-col auto-cols-[70%] sm:auto-cols-[45%] ${frameSize ? `xl:auto-cols-[${frameSize}%]` : "xl:auto-cols-[20%]"}  gap-4 py-4 px-1 overflow-x-scroll`}>
                {videos.map((video: DashboardItem, index: number) => {
                    const potrait = video.customCoverUrl || video.coverUrl || "";
                    const release_date = video.createTime ? String(video.createTime).split('T')[0] : (video.year ? String(video.year) : "");
                    const vote_average = (video.rating ?? 0) as number;
                    const popularity = Number((video as any).popularity ?? (video as any).views ?? 0);

                    return (
                        <div
                            key={video.id}
                            onClick={() => setSelectedMovieIndex(index)}
                            className={`flex flex-1 flex-col bg-black shadow-[0px_0px_2px_1px] pb-2 shadow-[#fbb033] rounded-lg touchable hover:scale-105 transition-transform duration-300 cursor-pointer`}
                        >
                            <div className="relative w-full h-auto rounded-lg mb-2" >
                                <div className="absolute w-full h-full bg-gradient-to-t from-black via-black/30 to-transparent z-1" />
                                <div className="relative w-full h-[300px]">
                                    <Image
                                        src={potrait || ""}
                                        alt={video.title || ""}
                                        fill
                                        className="z-0 rounded-t-lg object-cover"
                                        sizes="100vw"
                                        priority={index === 0}
                                    />
                                </div>
                            </div>
                            <div className='relative px-4 mt-[-70px] lg::mt-[-40px]  overflow-y-visible z-1'>
                                {video.title && video.title.length > 30 ? (
                                    <h3 className="text-xs lg::text-lg: font-semibold">{video.title}</h3>
                                ) : (
                                    <h3 className="text-lg: lg::text-lg font-semibold">{video.title}</h3>
                                )}
                                <p className="text-xs lg::text-sm text-gray-400">{release_date}</p>
                            </div>
                            {showRating && vote_average !== undefined && vote_average > 0 && (
                                <div className="flex items-center mt-auto mb-2 align-center px-4 py-1">
                                    {[...Array(5)].map((_, idx: number) => (
                                        <svg
                                            key={idx}
                                            xmlns="http://www.w3.org/2000/svg"
                                            className={`h-5 w-5 ${idx < Math.ceil((vote_average || 0) / 2) ? 'text-[#fbb033]' : 'text-gray-400'}`}
                                            fill={idx < Math.ceil((vote_average || 0) / 2) ? 'currentColor' : 'none'}
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={idx < Math.ceil((vote_average || 0) / 2) ? 0 : 1}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                        </svg>
                                    ))}
                                </div>
                            )}
                            {showViewer && (
                                <div className="flex mt-auto justify-center mt-2 mb-2">
                                    <span className="text-xs lg::text-sm ml-2 text-gray-400">
                                        {popularity.toLocaleString('en-US', { notation: "compact" })} views
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
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

export default DashboardSection;

