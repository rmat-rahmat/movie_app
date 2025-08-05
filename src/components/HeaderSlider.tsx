'use client';
import { useEffect, useState } from "react";
import { useGesture } from "@use-gesture/react";
import Loader from "./Loader";
import type { VideoSrc } from '@/types/VideoSrc';
import Image from "next/image";

interface HeaderSliderProps {
    videos: VideoSrc[];
}

const HeaderSlider: React.FC<HeaderSliderProps> = ({ videos }) => {
    const [current, setCurrent] = useState(0);
    const [x, setX] = useState(0);
    const [touchStartPoint, setTouchStartPoint] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrent((prev) => (prev + 1) % videos.length);
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
        return <Loader />;
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
            {videos.map((video, idx) => (
                <div
                    key={`${video.id}-${idx}`}
                    className={`absolute inset-0 transition-opacity duration-1000 ${x < 0 && idx === (current + 1) % videos.length ? 'z-2 opacity-100' : x > 0 && idx === (current - 1 + videos.length) % videos.length ? 'z-2 opacity-100' : idx === current ? 'z-9 opacity-100' : 'z-1 opacity-50'}`}
                    style={idx === current ? { transform: `translateX(${x}px)` } : undefined}
                >
                    <div className="grid h-full w-full md:grid-cols-[30%_70%] md:grid-rows-1 grid-cols-1 grid-rows-[70%_30%]">
                        <div className="bg-black order-last md:order-first flex items-end pb-12 pl-8 md:pl-20 overflow-visible">
                            <div className="text-white min-w-full md:min-w-[50vw] md:max-w-[50vw] z-1">
                                <h2 className="text-2xl md:text-4xl font-bold mb-2">{video.title}</h2>
                                <div className="bg-gradient-to-b from-[#e50914] to-[#b20710] py-2 rounded-lg text-center inline-block w-auto px-4">
                                     {new Date(video.release_date ?? "").toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
                                </div>
                                <p className="text-base md:text-lg">
                                    {video.description.split(" ").slice(0, 50).join(" ") + (video.description.split(" ").length > 50 ? "..." : "")}
                                </p>
                            </div>
                        </div>
                        <div className="relative bg-[#e50914] order-first md:order-last">
                            <Image
                                src={video.backdrop_image || video.potrait_image || ""}
                                alt={video.title}
                                fill
                                className="object-cover w-full h-full"
                                sizes="100vw"
                                priority={idx === current}
                            />
                            <div className="absolute inset-0 h-full bg-gradient-to-t from-black via-black/30 to-black/30 md:bg-[radial-gradient(circle_at_60%_50%,transparent,rgba(0,0,0,0.4),#000)]" />
                            <div className="absolute inset-0 h-full md:bg-[radial-gradient(circle_at_70%_50%,transparent,rgba(0,0,0,0.4),#000)]" />
                        </div>
                    </div>
                </div>
            ))}
            <div className="absolute bottom-0 flex gap-0 z-10 justify-center w-full px-5">
                {videos.map((_, idx) => (
                    <button
                        key={idx}
                        className={`
                            ${idx === 0 ? "rounded-l-lg" : ""}
                            ${idx === videos.length - 1 ? "rounded-r-lg" : ""}
                            z-100 w-[calc(100vw-16rem)] h-2 cursor-pointer
                            
                            ${idx === current
                                ? "bg-gradient-to-r from-[#e50914] via-[#b20710] to-gray-400/50 transition-colors duration-1000 ease-in-out"
                                : idx < current
                                    ? "bg-[#e50914] "
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

export default HeaderSlider;
