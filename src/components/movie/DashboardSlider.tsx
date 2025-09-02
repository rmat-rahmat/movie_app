'use client';
import { useEffect, useState } from "react";
import { useGesture } from "@use-gesture/react";
import { useTranslation } from "react-i18next";
import LoadingPage from "../ui/LoadingPage";
import type { DashboardItem } from '@/types/Dashboard';
import Image from "next/image";
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

    if (!videos || videos.length === 0) {
        return <LoadingPage />;
    }
    return (
        <div
            style={{ backgroundColor: "black" }}
            className="w-full relative h-[457px] md:h-[400px] overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            {...bind()}
        >
            {videos.map((video, idx) => {
                const title = video.title || "";
                const backdropSrc =  video.imageQuality?.p720 || "";
                const portraitSrc = video.imageQuality?.p360 || "";
                const fallbackSrc2 = '/fallback_poster/sample_snapshot_2.png';
                const fallbackSrc1 = '/fallback_poster/sample_snapshot_1.png';
                const computedSrc = (!backdropSrc && !portraitSrc) ? fallbackSrc1 : (imageErrorMap[idx] ? (idx%2===0 ? fallbackSrc1 : fallbackSrc2) : (backdropSrc || portraitSrc || fallbackSrc1));
                const description = video.description || "";
                
                // Get current language from i18n for date formatting
                const currentLocale = i18n?.language || (typeof navigator !== 'undefined' && navigator.language) || 'en';
                const releaseLabel = video.createTime 
                    ? new Date(String(video.createTime)).toLocaleString(currentLocale, { dateStyle: "full", timeStyle: "short" }) 
                    : (video.year ? String(video.year) : "");

                return (
                <div
                    key={`${video.id}-${idx}`}
                    className={`absolute inset-0 transition-opacity duration-1000 ${x < 0 && idx === (current + 1) % videos.length ? 'z-2 opacity-100' : x > 0 && idx === (current - 1 + videos.length) % videos.length ? 'z-2 opacity-100' : idx === current ? 'z-9 opacity-100' : 'z-1 opacity-50'}`}
                    style={idx === current ? { transform: `translateX(${x}px)` } : undefined}
                >
                    <div className="grid h-full w-full md:grid-cols-[30%_70%] md:grid-rows-1 grid-cols-1 grid-rows-[70%_30%]">
                            <div className="bg-black w-[90vw] md:w-full order-last md:order-first flex items-end pb-12 mx-auto md:pl-20 overflow-visible">

                            <div className="text-white min-w-full md:min-w-[50vw] md:max-w-[50vw] z-1">
                                <h2 className="text-2xl md:text-4xl font-bold mb-2">{title}</h2>
                                <div className="bg-gradient-to-b from-[#fbb033] to-[#f69c05] mb-3 py-2 rounded-lg text-center inline-block w-auto px-4">
                                     {releaseLabel}
                                </div>
                                <p className="text-base md:text-lg">
                                    {description.split(" ").slice(0, 50).join(" ") + (description.split(" ").length > 50 ? "..." : "")}
                                </p>
                            </div>
                        </div>
                        <div className="relative bg-[#fbb033] order-first md:order-last">
                            {/* <img
                                src={computedSrc}
                                alt={title}
                                className="object-cover w-full h-full"
                                onError={() => setImageErrorMap(s => ({ ...s, [idx]: true }))}
                                onLoad={() => {
                                    setImageErrorMap(s => {
                                        if (!s[idx]) return s;
                                        const copy = { ...s };
                                        delete copy[idx];
                                        return copy;
                                    });
                                }}
                            /> */}
                             <Image
                                src={computedSrc}
                                alt={title}
                                fill
                                className="object-cover w-full h-full"
                                sizes="100vw"
                                priority={idx === current}
                                onError={() => setImageErrorMap(s => ({ ...s, [idx]: true }))}
                                onLoadingComplete={() => {
                                    // clear any previous error if the image successfully loads
                                    setImageErrorMap(s => {
                                        if (!s[idx]) return s;
                                        const copy = { ...s };
                                        delete copy[idx];
                                        return copy;
                                    });
                                }}
                            />
                            <div className="absolute inset-0 h-full bg-gradient-to-t from-black via-black/30 to-black/30 md:bg-[radial-gradient(circle_at_60%_50%,transparent,rgba(0,0,0,0.4),#000)]" />
                            <div className="absolute inset-0 h-full md:bg-[radial-gradient(circle_at_70%_50%,transparent,rgba(0,0,0,0.4),#000)]" />
                        </div>
                    </div>
                </div>
                );
            })}
            <div className="absolute bottom-0 flex gap-0 z-10 justify-center w-full px-5">
                {videos.map((_, idx) => (
                    <button
                        key={idx}
                        className={`
                            ${idx === 0 ? "rounded-l-lg" : ""}
                            ${idx === videos.length - 1 ? "rounded-r-lg" : ""}
                            z-100 w-[calc(100vw-16rem)] h-2 cursor-pointer
                            
                            ${idx === current
                                ? "bg-gradient-to-r from-[#fbb033] via-[#f69c05] to-gray-400/50 transition-colors duration-1000 ease-in-out"
                                : idx < current
                                    ? "bg-[#fbb033] "
                                    : "bg-gray-400/50"}
                        `}
                        onClick={() => setCurrent(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default DashboardSlider;
