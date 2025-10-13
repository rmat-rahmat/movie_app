'use client';
import { useEffect, useState } from "react";
import { useGesture } from "@use-gesture/react";
import { useTranslation } from "react-i18next";
import LoadingPage from "../ui/LoadingPage";
import type { DashboardItem } from '@/types/Dashboard';
import MovieModal from "./MovieModal";
import Image from "next/image";
import type { VideoVO } from "@/types/Dashboard";
import { t } from "i18next";
// using native <img> for simpler fallback handling

interface DashboardSliderProps {
    videos: DashboardItem[];
}

const DashboardSlider: React.FC<DashboardSliderProps> = ({ videos }) => {
    const { i18n } = useTranslation();
    const [current, setCurrent] = useState(0);
    const [x, setX] = useState(0);
    const [touchStartPoint, setTouchStartPoint] = useState(0);
    // track image load errors per slide index so we can fallback to a local sample
    const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<DashboardItem | null>(null);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrent((prev) => (prev + 1) % Math.max(1, videos.length));
        }, 5000);
        return () => clearInterval(intervalId);
    }, [videos.length, current]);

    const bind = useGesture({
        onDrag: ({ delta: [dx], touches, event }) => {
            if (touches > 1) return;
            event.preventDefault();
            setX(x + dx);
        },
        onDragEnd: ({ touches, event }) => {
            if (touches > 1) return;
            event.preventDefault();
            if (Math.abs(x) > 100) {
                if (x < 0) {
                    setCurrent((prev) => (prev + 1) % videos.length);
                } else {
                    setCurrent((prev) => (prev - 1 + videos.length) % videos.length);
                }
            }
            setX(0);
        },
    });

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchStartPoint(e.touches[0].clientX);
    };
    const onTouchMove = (e: React.TouchEvent) => {
        setX(e.touches[0].clientX - touchStartPoint);
    };
    const onTouchEnd = () => {
        if (Math.abs(x) > 100) {
            if (x < 0) {
                setCurrent((prev) => (prev + 1) % videos.length);
            } else {
                setCurrent((prev) => (prev - 1 + videos.length) % videos.length);
            }
        }
        setX(0);
    };


    const handleDashboardItemClick = (video: DashboardItem) => {
        setSelectedVideo(video);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedVideo(null);
        setIsModalOpen(false);
    };

    if (!videos || videos.length === 0) {
        return <LoadingPage />;
    }
    return (
        <div
            style={{ backgroundColor: "black" }}
            className="w-full relative h-[500px] md:h-[70vh] lg:h-[80vh] overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            {...bind()}
        >
            {isModalOpen && selectedVideo && (
                <MovieModal
                    video={selectedVideo}
                    onClose={closeModal}
                />
            )}
            {videos.map((video, idx) => {
                const title = video.title || "";
                const backdropSrc = video.imageQuality?.p720 || "";
                const portraitSrc = video.imageQuality?.p360 || "";
                const fallbackSrc2 = '/fallback_poster/sample_snapshot_2.png';
                const fallbackSrc1 = '/fallback_poster/sample_snapshot_1.png';
                const computedSrc = (!backdropSrc && !portraitSrc) ? fallbackSrc1 : (imageErrorMap[idx] ? (idx % 2 === 0 ? fallbackSrc1 : fallbackSrc2) : (backdropSrc || portraitSrc || fallbackSrc1));
                const description = video.description || "";

                // Get current language from i18n for date formatting
                const currentLocale = i18n?.language || (typeof navigator !== 'undefined' && navigator.language) || 'en';
                const releaseLabel = video.createTime
                    ? new Date(String(video.createTime)).toLocaleString(currentLocale, { dateStyle: "full", timeStyle: "short" })
                    : (video.year ? String(video.year) : "");

                return (
                    <div
                        key={`${video.id}-${idx}`}
                        className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                            x < 0 && idx === (current + 1) % videos.length 
                                ? 'z-20 opacity-100 scale-105' 
                                : x > 0 && idx === (current - 1 + videos.length) % videos.length 
                                    ? 'z-20 opacity-100 scale-105' 
                                    : idx === current 
                                        ? 'z-30 opacity-100 scale-100' 
                                        : 'z-10 opacity-40 scale-95'
                        }`}
                        style={idx === current ? { transform: `translateX(${x}px)` } : undefined}
                    >
                        <div className="relative w-full h-full">
                            {/* Background Image with Enhanced Gradients */}
                            <div className="absolute inset-0">
                                <Image
                                    src={computedSrc}
                                    alt={title}
                                    fill
                                    className="object-cover"
                                    sizes="100vw"
                                    priority={idx === current}
                                    onError={() => setImageErrorMap(s => ({ ...s, [idx]: true }))}
                                    onLoad={() => {
                                        setImageErrorMap(s => {
                                            if (!s[idx]) return s;
                                            const copy = { ...s };
                                            delete copy[idx];
                                            return copy;
                                        });
                                    }}
                                />
                                {/* Netflix-style gradient overlays */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
                            </div>

                            {/* Content Container */}
                            <div className="relative z-10 h-full flex items-baseline md:items-center md:justify-start">
                                <div className="px-14 md:px-16 lg:px-20 max-w-2xl mt-auto mb-10">
                                    {/* Title */}
                                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-2xl leading-tight">
                                        {title}
                                    </h1>
                                    
                                    {/* Release Info Badge */}
                                    {releaseLabel && (
                                        <div className="hidden md:inline-flex items-center bg-gradient-to-r from-[#fbb033] to-[#f69c05] text-black font-bold px-3 md:px-4 py-2 rounded-full text-xs md:text-base mb-6 shadow-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {releaseLabel}
                                        </div>
                                    )}
                                    
                                    {/* Description */}
                                    <p className="text-sm md:text-xl text-gray-200 mb-2 md:mb-8 leading-relaxed drop-shadow-lg max-w-xl line-clamp-3">
                                        {description.split(" ").slice(0, 30).join(" ")}
                                        {description.split(" ").length > 30 ? "..." : ""}
                                    </p>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-2 md:gap-4">
                                        <button
                                            onClick={() => handleDashboardItemClick(video)}
                                            className="text-xs md:text-sm bg-white hover:bg-gray-200 text-black font-bold py-2 md:py-3 px-8 rounded-full inline-flex items-center cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-xl"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-6 w-6 mr-3"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                            {t('modal.watchNow')}
                                        </button>
                                        
                                        {/* <button
                                            onClick={() => handleDashboardItemClick(video)}
                                            className="hidden md:inline-flex text-xs md:text-sm bg-gray-600/80 hover:bg-gray-500/80 text-white font-semibold py-2 md:py-3 px-8 rounded-full  items-center cursor-pointer transition-all duration-200 backdrop-blur-sm border border-gray-400/30"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 mr-2"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {t('movie.moreInfo')}
                                        </button> */}
                                    </div>
                                </div>
                            </div>

                            {/* Age Rating Badge (if applicable) */}
                            {video.rating && (
                                <div className="absolute top-8 right-8 bg-gray-800/80 backdrop-blur-sm border border-gray-600 text-white px-3 py-1 rounded text-sm font-semibold">
                                    {video.rating}/10
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            {/* Netflix-style Indicators */}
            <div className="absolute bottom-4 md:bottom-8 right-4 md:right-8 flex gap-2 z-40">
                {videos.map((_, idx) => (
                    <button
                        key={idx}
                        className={`
                            h-1 transition-all duration-500 ease-in-out rounded-full cursor-pointer
                            ${idx === current
                                ? "bg-white w-8 shadow-lg"
                                : "bg-gray-400/60 hover:bg-gray-300/80 w-4"}
                        `}
                        onClick={() => setCurrent(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={() => setCurrent((prev) => (prev - 1 + videos.length) % videos.length)}
                className="absolute left-3 md:left-8 top-2/3 md:top-1/2 transform -translate-y-1/2 z-40  hover:bg-black/60 text-white p-3 rounded-full transition-all duration-200 group"
                aria-label="Previous slide"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            
            <button
                onClick={() => setCurrent((prev) => (prev + 1) % videos.length)}
                className="absolute right-3 md:right-8 top-2/3 md:top-1/2 transform -translate-y-1/2 z-40  hover:bg-black/60 text-white p-3 rounded-full transition-all duration-200  group"
                aria-label="Next slide"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
};

export default DashboardSlider;
