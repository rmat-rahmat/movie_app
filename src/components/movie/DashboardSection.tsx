'use client';
import React, { useState, useRef, useEffect } from 'react';
import MovieModal from "./MovieModal";
import type { DashboardItem as DashboardItemType } from '@/types/Dashboard';
import DashboardItem from './DashboardItem';
import { t } from 'i18next';
import { useRouter } from 'next/navigation';



interface DashboardSectionProps {
    title: string;
    videos: DashboardItemType[]; // now accepts DashboardItem from server
    icon?: React.ReactNode;
    showRating?: boolean;
    showPlayback?: boolean;
    showViewer?: boolean;
    frameSize?: number;
    onViewMore?: () => void;
    onScrollEnd?: () => void; // Callback when user scrolls near the end horizontally
    onOptionsClick?: (videoId: string) => void;
    sectionOptionButton?: {
        title: string;
        icon?: React.ReactNode;
        iconRight?: boolean;
        onClick: () => void;
    };
}

const DashboardSection: React.FC<DashboardSectionProps> = ({ title, videos, showRating, showPlayback, showViewer, frameSize, icon, onViewMore, onScrollEnd, onOptionsClick, sectionOptionButton }) => {
    const [selectedMovieIndex, setSelectedMovieIndex] = useState<number | null>(null);
    const router = useRouter();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const hasTriggeredScrollEnd = useRef(false);

    // Handle horizontal scroll to detect when user reaches near the end
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer || !onScrollEnd) return;

        const handleScroll = () => {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
            // Trigger when within 200px of the end
            const isNearEnd = scrollLeft + clientWidth >= scrollWidth - 200;

            if (isNearEnd && !hasTriggeredScrollEnd.current) {
                hasTriggeredScrollEnd.current = true;
                onScrollEnd();
            }
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [onScrollEnd]);

    // Reset scroll end trigger when videos change (new content loaded)
    useEffect(() => {
        hasTriggeredScrollEnd.current = false;
    }, [videos.length]);

    if (!videos || videos.length === 0) {
        return <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-4 px-0">
                <div className="flex items-center gap-2">
                    {icon}
                    <h2 className="text-2xl font-semibold ">{title}</h2>
                </div>
                <div className="flex items-center gap-2"></div>
            </div>
            <div className="text-center text-gray-500">{title + " " + t('profile.notAvailable', 'not available')}</div>
        </div>
    }
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-4 px-0">
                <div className="flex items-center gap-2">
                    {icon}
                    <h2 className="text-2xl font-semibold">{title}</h2>
                </div>
                {onViewMore && (
                    <button
                        onClick={onViewMore}
                        className="flex items-center gap-1 text-[#fbb033] hover:text-[#fbb033] font-medium text-sm cursor-pointer"
                    >
                        {t('common.viewMore', 'View More')}
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
                {sectionOptionButton &&
                    <button className="flex items-center gap-1 hover:text-[#fbb033] border hover:border-[#fbb033]  pr-2 pl-4 py-1  rounded-full hover:text-[#fbb033] font-medium text-base cursor-pointer transition-all duration-200 transform hover:scale-105 "
                        onClick={sectionOptionButton.onClick}
                    >
                        {!sectionOptionButton.iconRight && sectionOptionButton.icon}
                        {sectionOptionButton.title}
                        {sectionOptionButton.iconRight && sectionOptionButton.icon}
                    </button>
                }
            </div>
            <div 
                ref={scrollContainerRef}
                className={`hide-scrollbar grid grid-flow-col auto-cols-[45%] sm:auto-cols-[45%] ${frameSize ? `xl:auto-cols-[${frameSize}%]` : "xl:auto-cols-[20%]"}  gap-4 py-4 px-1 overflow-x-scroll`}
            >
                {videos.map((video: DashboardItemType, index: number) => (
                    <DashboardItem
                        key={video.id}
                        video={video}
                        index={index}
                        onClick={() => {
                             router.push(`/videoplayer?directid=${encodeURIComponent(video.id)}`);
                            // setSelectedMovieIndex(index)
                        }}
                        showRating={showRating}
                        showViewer={showViewer}
                        onOptionsClick={onOptionsClick}
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

