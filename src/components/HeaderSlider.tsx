'use client';
import Image from "next/image";
import { useEffect, useState } from "react";
import { useGesture } from "@use-gesture/react";
import Loader from "./Loader";

interface Slide {
    id: number;
    image: string;
    title: string;
    description: string;
    highlight?: string;
    navigation?:ButtonLink;
}
interface ButtonLink {
    href: string;
    label: string;
    icon: React.ReactNode;
}
interface HeaderSliderProps {
    slides: Slide[];

}

const HeaderSlider: React.FC<HeaderSliderProps> = ({ slides }) => {
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


    if (!slides || slides.length === 0) {
        return <Loader />;
    }
    return (
        <div style={{ backgroundColor: "black" }} className="w-full relative h-[457px] md:h-[400px] overflow-hidden" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} {...bind()}>
            {
                slides.map((slide, idx) => (
                    <div
                        key={slide.id+idx}
                        className={`absolute inset-0 transition-opacity duration-1000 ${x < 0 && idx === (current + 1) % slides.length ? 'z-2 opacity-100' :x > 0 && idx === (current - 1+ slides.length) % slides.length ? 'z-2 opacity-100' : idx === current ? 'z-9 opacity-100' : 'z-1 opacity-50'}`}
                        style={idx === current ? { transform: `translateX(${x}px)` } : undefined}
                    >
                        <div className="grid h-full w-full md:grid-cols-[30%_70%] md:grid-rows-1 grid-cols-1 grid-rows-[70%_30%]">
                            <div className="bg-black order-last md:order-first flex items-end pb-12 pl-8 md:pl-20 overflow-visible">
                                <div className="text-white min-w-full md:min-w-[50vw] md:max-w-[50vw] z-1">
                                    <h2 className="text-2xl md:text-4xl font-bold mb-2">{`${slide.title}`}</h2>
                                    <div className="bg-green-500/50 py-2 rounded-full max-w-xs text-center">
                                        <p className="text-sm md:text-base">Air Date: {slide.highlight}</p>
                                    </div>
                                    <p className="text-base md:text-lg">
                                        {slide.description.split(" ").slice(0, 100).join(" ") + (slide.description.split(" ").length > 100 ? "..." : "")}
                                    </p>
                                </div>
                            </div>
                            <div className="relative bg-green-500 order-first md:order-last">
                                <img
                                    src={slide.image}
                                    alt={slide.title}
                                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                />
                                <div className="absolute  inset-0  h-full bg-gradient-to-t from-black via-black/30 to-black/30  md:bg-[radial-gradient(circle_at_60%_50%,transparent,rgba(0,0,0,0.4),#000)]" />
                                <div className="absolute  inset-0  h-full  md:bg-[radial-gradient(circle_at_70%_50%,transparent,rgba(0,0,0,0.4),#000)]" />
                            </div>
                        </div>



                    </div>
                ))
            }
            <div className="absolute bottom-0 flex gap-0 z-10 justify-center w-full px-5">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        className={`${idx===0 && "rounded-l-lg"} ${idx===slides.length-1 && "rounded-r-lg"} z-100 w-[calc(100vw-16rem)] h-2 cursor-pointer ${idx === current ? "bg-[radial-gradient(circle_at_center,rgba(0,255,0,0.7),rgba(0,255,0,0.5),rgba(156,163,175,0.5))]" : "bg-gray-400/50"}`}
                        onClick={() => setCurrent(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
    
}

export default HeaderSlider;
