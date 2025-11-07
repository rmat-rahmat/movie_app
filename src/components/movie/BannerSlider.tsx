'use client';
import { useEffect, useState } from "react";
import { useGesture } from "@use-gesture/react";
import { useTranslation } from "react-i18next";
import type { BannerVO } from '@/types/Dashboard';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { t } from "i18next";

interface BannerSliderProps {
    banners: BannerVO[];
}

const BannerSlider: React.FC<BannerSliderProps> = ({ banners }) => {
    const { i18n } = useTranslation();
    const router = useRouter();
    const [current, setCurrent] = useState(0);
    const [x, setX] = useState(0);
    const [touchStartPoint, setTouchStartPoint] = useState(0);
    const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (banners.length === 0) return;
        const intervalId = setInterval(() => {
            setCurrent((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(intervalId);
    }, [banners.length]);

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
                    setCurrent((prev) => (prev + 1) % banners.length);
                } else {
                    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
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
                setCurrent((prev) => (prev + 1) % banners.length);
            } else {
                setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
            }
        }
        setX(0);
    };

    const handleBannerClick = (banner: BannerVO) => {
        if (banner.linkType === 1 && banner.videoId ) {
            // Internal link - navigate to video player or details
            router.push(`/videoplayer?directid=${encodeURIComponent(banner.videoId)}`);
        } else if (banner.linkType === 2 && banner.externalUrl) {
            // External link - open in new tab
            window.open(banner.externalUrl, '_blank', 'noopener,noreferrer');
        }
    };

    if (!banners || banners.length === 0) {
        return null;
    }

    return (
        <div
            style={{ backgroundColor: "black" }}
            className="w-full relative h-[50vh] md:h-[70vh] lg:h-[80vh] overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            {...bind()}
        >
            {banners.map((banner, idx) => {
                const isActive = idx === current;
                const offset = (idx - current + banners.length) % banners.length;
                const translate = offset === 0 ? x : offset * 100;
                const hasError = imageErrorMap[idx] || false;

                // Fallback images
                const fallbackSrc1 = '/fallback_poster/sample_poster1.png';
                const fallbackSrc2 = '/fallback_poster/sample_poster.png';
                const computedSrc = hasError 
                    ? (idx % 2 === 0 ? fallbackSrc1 : fallbackSrc2) 
                    : banner.imageUrl;

                return (
                    <div
                        key={idx}
                        style={{
                            transform: `translateX(${translate}vw)`,
                            transition: x === 0 ? 'transform 0.3s ease' : 'none',
                        }}
                        className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
                    >
                        <div className="flex w-full h-full relative" onClick={() => handleBannerClick(banner)}>
                            <Image
                                src={computedSrc}
                                alt={banner.title || `Banner ${idx + 1}`}
                                fill
                                className="object-cover"
                                sizes="100vw"
                                priority={idx === 0}
                                onError={() => {
                                    setImageErrorMap((prev) => ({ ...prev, [idx]: true }));
                                }}
                            />
                          
                           
                        </div>
                         {/* Bottom gradient & content */}
                            <div className=" inset-x-0 bottom-0 w-full">
                                {/* gradient overlay */}
                                <div className=" inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                                {/* content placed at bottom */}
                                <div className="relative pointer-events-auto mt-6 px-6 md:px-12 lg:px-16 flex items-center gap-4">
                                    {/* Avatar on the left */}
                                    <div className="flex-shrink-0">
                                        <Image
                                            src={banner.avatarUrl || '/fallback_poster/sample_avatar.png'}
                                            alt={banner.title ? `${banner.title} avatar` : 'Banner avatar'}
                                            width={64}
                                            height={64}
                                            className="rounded-full object-cover w-12 h-12 md:w-16 md:h-16 border-2 border-white shadow"
                                        />
                                    </div>
                                    {/* Title and description */}
                                    <div>
                                        <h2 className="text-white text-xl md:text-3xl lg:text-4xl font-bold mb-1 max-w-3xl">
                                            {banner.title}
                                        </h2>
                                        {banner.description ? (
                                            <p className="text-sm md:text-xl text-gray-200 mb-2 md:mb-8 leading-relaxed drop-shadow-lg max-w-xl line-clamp-3">
                                                {banner.description.split(" ").slice(0, 30).join(" ")}
                                                {banner.description.split(" ").length > 30 ? "..." : ""}
                                            </p>
                                        ) : (
                                            <p className="text-xs md:text-xl text-gray-200 mb-2 md:mb-8 leading-relaxed drop-shadow-lg max-w-xl line-clamp-3">
                                                {t('movie.dummyDesc', 'Just a quick video to share something cool — hope you enjoy it! Drop a comment below and let me know what you think.')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                    </div>
                );
            })}

            {/* Navigation dots - positioned from bottom of main container */}
            <div className="absolute bottom-32 md:bottom-42 lg:bottom-45 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                {banners.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrent(idx)}
                        className={`h-2 w-4 md:h-3 md:w-6 rounded-full transition-all cursor-pointer ${
                            idx === current 
                                ? 'bg-[#fbb033] scale-125' 
                                : 'bg-white/50 hover:bg-white/80'
                        }`}
                        aria-label={`Go to banner ${idx + 1}`}
                    />
                ))}
            </div>

            {/* Navigation arrows */}
            <button
                onClick={() => setCurrent((prev) => (prev - 1 + banners.length) % banners.length)}
                className="hidden md:absolute left-4 md:top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full transition-colors z-10 cursor-pointer"
                aria-label="Previous banner"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <button
                onClick={() => setCurrent((prev) => (prev + 1) % banners.length)}
                className="hidden md:absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full transition-colors z-10 cursor-pointer"
                aria-label="Next banner"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
};

export default BannerSlider;
