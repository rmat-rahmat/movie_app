'use client';
import Image from "next/image";
import { useEffect, useState } from "react";
import { useGesture } from "@use-gesture/react";
import Loader from "./Loader";
import type { VideoSrc } from '@/types/VideoSrc';

interface MovieSliderProps {
    videos: VideoSrc[];
}

const MovieSlider: React.FC<MovieSliderProps> = ({ videos }) => {
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
        <div style={{ backgroundColor: "black" }} className="w-full relative h-[457px] md:h-[400px] overflow-hidden" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} {...bind()}>
            {
                videos.map((video, idx) => (
                    <div
                        key={video.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ${x < 0 && idx === (current + 1) % videos.length ? 'z-2 opacity-100' : x > 0 && idx === (current - 1 + videos.length) % videos.length ? 'z-2 opacity-100' : idx === current ? 'z-9 opacity-100' : 'z-1 opacity-50'}`}
                        style={idx === current ? { transform: `translateX(${x}px)` } : undefined}
                    >
                        <div className="grid h-full w-full md:grid-cols-[30%_70%] md:grid-rows-1 grid-cols-1 grid-rows-[70%_30%]">
                            <div className="bg-black w-[90vw] md:w-full order-last md:order-first flex items-end pb-12 mx-auto md:pl-20 overflow-visible">
                                <div className="text-white overflow-hidden text-ellipsis whitespace-wrap min-w-full md:min-w-[50vw] md:max-w-[50vw] z-1">
                                    <h2 className="text-2xl md:text-4xl font-bold mb-2">{video.title}</h2>
                                    <p className="text-base md:text-lg">  {video.description.split(" ").slice(0, 50).join(" ") + (video.description.split(" ").length > 50 ? "..." : "")}</p>
                                </div>
                            </div>
                            <div className="relative bg-[#e50914] order-first md:order-last">
                                <Image
                                    src={video.backdrop_image || video.potrait_image || ""}
                                    alt={video.title}
                                    fill
                                    priority={idx === current}
                                    className="object-cover w-full h-full"
                                    sizes="100vw"
                                />
                                <div className="absolute inset-0 h-full bg-gradient-to-t from-black via-black/30 to-black/30 md:bg-[radial-gradient(circle_at_60%_50%,transparent,rgba(0,0,0,0.4),#000)]" />
                                <div className="absolute inset-0 h-full md:bg-[radial-gradient(circle_at_70%_50%,transparent,rgba(0,0,0,0.4),#000)]" />
                            </div>
                        </div>
                    </div>
                ))
            }
            <div className="absolute bottom-0 flex gap-0 z-10 justify-center w-full px-5">
                {videos.map((_, idx) => (
                    <button
                        key={idx}
                        className={`${idx === 0 && "rounded-l-lg"} ${idx === videos.length - 1 && "rounded-r-lg"} w-[${1 / videos.length * 99}%] h-2 cursor-pointer ${idx === current ? "bg-[radial-gradient(circle_at_center,rgba(0,255,0,0.7),rgba(0,255,0,0.5),rgba(156,163,175,0.5))]" : "bg-gray-400/50"}`}
                        onClick={() => setCurrent(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}

export default MovieSlider;
