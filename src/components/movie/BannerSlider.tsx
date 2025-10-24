'use client';
import { useEffect, useState } from "react";
import { useGesture } from "@use-gesture/react";
import { useTranslation } from "react-i18next";
import type { BannerVO } from '@/types/Dashboard';
import Image from "next/image";
import { useRouter } from 'next/navigation';

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
            className="w-full relative h-[500px] md:h-[70vh] lg:h-[80vh] overflow-hidden"
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
                            <div className=" inset-x-0 bottom-0   w-full">
                                {/* gradient overlay */}
                                <div className=" inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                                {/* content placed at bottom */}
                                <div className="relative pointer-events-auto p-6 md:p-12 lg:p-16">
                                    <h2 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold mb-4 max-w-3xl">
                                        {banner.title}
                                    </h2>

                                    {/* {(banner.linkType === 1 || banner.linkType === 2) && (
                                        <button
                                            onClick={() => handleBannerClick(banner)}
                                            className="bg-[#fbb033] hover:bg-[#f69c05] text-black font-bold px-8 py-3 rounded-lg transition-colors cursor-pointer"
                                        >
                                            {banner.linkType === 1 ? 'Watch Now' : 'Learn More'}
                                        </button>
                                    )} */}
                                </div>
                            </div>
                    </div>
                );
            })}

            {/* Navigation dots */}
            <div className="absolute bottom-[28%] left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                {banners.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrent(idx)}
                        className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                            idx === current 
                                ? 'bg-[#fbb033] w-8' 
                                : 'bg-white/50 hover:bg-white/80'
                        }`}
                        aria-label={`Go to banner ${idx + 1}`}
                    />
                ))}
            </div>

            {/* Navigation arrows */}
            <button
                onClick={() => setCurrent((prev) => (prev - 1 + banners.length) % banners.length)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full transition-colors z-10 cursor-pointer"
                aria-label="Previous banner"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <button
                onClick={() => setCurrent((prev) => (prev + 1) % banners.length)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full transition-colors z-10 cursor-pointer"
                aria-label="Next banner"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
};

export default BannerSlider;
