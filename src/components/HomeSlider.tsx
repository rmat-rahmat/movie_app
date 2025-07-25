'use client';
import Image from "next/image";
import { useEffect, useState } from "react";
import { useGesture } from "@use-gesture/react";
import { on } from "events";

interface Slide {
    id: number;
    backdrop_path: string;
    original_title: string;
    description: string;
    overview: string;
}

interface HomeSliderProps {
    slides: Slide[];
}

const HomeSlider: React.FC<HomeSliderProps> = ({ slides }) => {
    const [current, setCurrent] = useState(0);
    const [x, setX] = useState(0);
    const [touchStartPoint, setTouchStartPoint] = useState(0);

    useEffect(() => {
        console.log("Current slide:", current);
        const intervalId = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(intervalId);
    }, [slides.length, current]);

    const bind = useGesture({
        onDrag: ({ delta: [dx], direction: [xDir], event,touches, ...rest }) => {
            if (touches > 1) return;
            event.preventDefault();
            setX(x + dx);
        },
        onDragEnd: ({ event,touches }) => {
            if (touches>1) return;
            event.preventDefault();
            console.log("Dragging end");
            if (Math.abs(x) > 100) {
                if (x < 0) {
                    console.log("Dragging left");
                    setCurrent((prev) => (prev + 1) % slides.length);
                } else {
                    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
                }
            }
            setX(0);
        },
    });

    const onTouchStart = (e: React.TouchEvent) => {
        // e.preventDefault();
        console.log("Touch start");
        setTouchStartPoint(e.touches[0].clientX);
    };
    const onTouchMove = (e: React.TouchEvent) => {
        if (Math.abs(x) < 10 && Math.abs(x) > 6) {
            console.log("Touch move started");
        }
        setX(e.touches[0].clientX-touchStartPoint); // Adjust this logic as needed
    };  
    const onTouchEnd = (e: React.TouchEvent) => {
        // e.preventDefault();
        console.log("Touch end");
        if (Math.abs(x) > 100) {
            if (x < 0) {
                console.log("Touch left");
                setCurrent((prev) => (prev + 1) % slides.length);
            } else {
                setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
            }
        }
        setX(0);
    };


    return (
        <div style={{ backgroundColor: "green" }} className="w-full relative h-[457px] md:h-[400px] overflow-hidden" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} {...bind()}>
            {
                slides.map((slide, idx) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ${x < 0 && idx === (current + 1) % slides.length ? 'z-2 opacity-100' :x > 0 && idx === (current - 1+ slides.length) % slides.length ? 'z-2 opacity-100' : idx === current ? 'z-9 opacity-100' : 'z-1 opacity-50'}`}
                        style={idx === current ? { transform: `translateX(${x}px)` } : undefined}
                    >
                        <div className="grid h-full w-full md:grid-cols-[30%_70%] md:grid-rows-1 grid-cols-1 grid-rows-[70%_30%]">
                            <div className="bg-black order-last md:order-first flex items-end pb-12 pl-8 md:pl-20 overflow-visible">
                                <div className="text-white min-w-full md:min-w-[50vw] md:max-w-[50vw] z-1">
                                    <h2 className="text-2xl md:text-4xl font-bold mb-2">{`${slide.original_title}`}</h2>
                                    <p className="text-base md:text-lg">{slide.overview}</p>
                                </div>
                            </div>
                            <div className="relative bg-green-500 order-first md:order-last">
                                <Image
                                    src={slide.backdrop_path}
                                    alt={slide.original_title}
                                    fill
                                    priority={idx === current}
                                    className="object-cover w-full h-full"
                                    sizes="100vw"
                                />
                                <div className="absolute  inset-0  h-full bg-gradient-to-t from-black via-black/30 to-black/30  md:bg-[radial-gradient(circle_at_60%_50%,transparent,rgba(0,0,0,0.4),#000)]" />
                                <div className="absolute  inset-0  h-full  md:bg-[radial-gradient(circle_at_70%_50%,transparent,rgba(0,0,0,0.4),#000)]" />
                            </div>
                        </div>



                    </div>
                ))
            }
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        className={`w-3 h-3 rounded-full  ${idx === current ? "bg-green-500" : "bg-gray-400/50"}`}
                        onClick={() => setCurrent(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
    
}

export default HomeSlider;
