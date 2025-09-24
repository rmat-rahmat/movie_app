'use client';
import React, { useState } from 'react';
import MovieModal from "./MovieModal";
import type { DashboardItem as DashboardItemType } from '@/types/Dashboard';
import DashboardItem from './DashboardItem';


interface DashboardSectionProps {
    title: string;
    videos: DashboardItemType[]; // now accepts DashboardItem from server
    icon?: React.ReactNode;
    showRating?: boolean;
    showPlayback?: boolean;
    showViewer?: boolean;
    frameSize?: number;
    onViewMore?: () => void;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({ title, videos, showRating, showPlayback, showViewer, frameSize, icon, onViewMore }) => {
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
                        className="flex items-center gap-1 text-[#fbb033] hover:text-[#fbb033] font-medium text-sm cursor-pointer"
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
            <div className={`hide-scrollbar grid grid-flow-col auto-cols-[45%] sm:auto-cols-[45%] ${frameSize ? `xl:auto-cols-[${frameSize}%]` : "xl:auto-cols-[20%]"}  gap-4 py-4 px-1 overflow-x-scroll`}>
                {videos.map((video: DashboardItemType, index: number) => (
                    <DashboardItem
                        key={video.id}
                        video={video}
                        index={index}
                        onClick={() => setSelectedMovieIndex(index)}
                        showRating={showRating}
                        showViewer={showViewer}
                    />
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

export default DashboardSection;

