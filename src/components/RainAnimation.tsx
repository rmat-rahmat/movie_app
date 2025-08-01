import React, { useEffect } from "react";
import type { VideoSrc } from "@/types/VideoSrc";
import Image from "next/image";

const emojiList = [
    { emoji: "😊", label: "happy" },
    { emoji: "😂", label: "laugh" },
    { emoji: "😍", label: "love" },
    { emoji: "❤️", label: "heart" },
    { emoji: "⭐️", label: "star" },
    { emoji: "🤗", label: "hug" },
    { emoji: "🥳", label: "party" },
    { emoji: "👏", label: "clap" },
    { emoji: "👍", label: "thumbs up" },
    { emoji: "✨", label: "sparkles" },
    { emoji: "😄", label: "smile" },
    { emoji: "✌️", label: "peace" }
];

const RainAnimation: React.FC<{ movies: VideoSrc[] }> = React.memo(function RainAnimation({ movies }) {
    useEffect(() => {
        if (typeof window !== "undefined") {
            const styleSheet = document.styleSheets[0];
            for (let idx = 0; idx < movies.length; idx++) {
                const animationName = `rainAnim${idx}`;
                if (
                    styleSheet &&
                    !Array.from(styleSheet.cssRules).find(
                        rule => (rule instanceof CSSKeyframesRule && rule.name === animationName)
                    )
                ) {
                    styleSheet.insertRule(
                        `
                        @keyframes ${animationName} {
                            0% { top: -120px; opacity: 0.7; transform: rotate(0deg) scale(1);}
                            10% { opacity: 1;}
                            90% { opacity: 1;}
                            100% { top: 100vh; opacity: 0.7; transform: rotate(0deg) scale(1.05);}
                        }
                        `,
                        styleSheet.cssRules.length
                    );
                }
            }
            for (let idx = 0; idx < emojiList.length; idx++) {
                const animationName = `emojiRainAnim${idx}`;
                if (
                    styleSheet &&
                    !Array.from(styleSheet.cssRules).find(
                        rule => (rule instanceof CSSKeyframesRule && rule.name === animationName)
                    )
                ) {
                    styleSheet.insertRule(
                        `
                        @keyframes ${animationName} {
                            0% { top: -60px; opacity: 0.8; transform: rotate(0deg) scale(1);}
                            10% { opacity: 1;}
                            90% { opacity: 1;}
                            100% { top: 100vh; opacity: 0.8; transform: rotate(0deg) scale(1.1);}
                        }
                        `,
                        styleSheet.cssRules.length
                    );
                }
            }
        }
    }, [movies.length]);

    return (
        <div className="absolute z-0 top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            <div className="flex flex-wrap w-full h-full">
                {movies.map((movie, idx) => {
                    const left = Math.random() * 95;
                    const width = [96, 128, 160][Math.floor(Math.random() * 3)];
                    const height = width * 0.6;
                    const animationName = `rainAnim${idx}`;
                    const duration = 6 + Math.random() * 6;
                    const delay = Math.random() * duration;
                    const rotate = Math.random() * 12 - 6;
                    return (
                        <Image
                            key={movie.id || idx}
                            src={movie.backdrop_image || movie.potrait_image || '/images/placeholder.png'}
                            alt={movie.title || 'Movie'}
                            width={width}
                            height={height}
                            className="object-cover rounded-lg shadow-lg absolute pointer-events-none"
                            style={{
                                left: `${left}%`,
                                top: `-${height + 20}px`,
                                opacity: 0.6,
                                zIndex: 0,
                                animation: `${animationName} ${duration}s linear ${delay}s infinite`,
                                transform: `rotate(${rotate}deg)`
                            }}
                            draggable={false}
                            unoptimized
                        />
                    );
                })}
                {emojiList.map((item, idx) => {
                    const left = Math.random() * 95;
                    const fontSize = [32, 40, 48][Math.floor(Math.random() * 3)];
                    const animationName = `emojiRainAnim${idx}`;
                    const duration = 5 + Math.random() * 7;
                    const delay = Math.random() * duration;
                    const rotate = Math.random() * 24 - 12;
                    return (
                        <span
                            key={item.label + idx}
                            role="img"
                            aria-label={item.label}
                            className="absolute pointer-events-none select-none"
                            style={{
                                fontSize: `${fontSize.toFixed(2)}px`,
                                left: `${left.toFixed(2)}%`,
                                top: `-60px`,
                                zIndex: 0,
                                opacity: 0.7,
                                animation: `${animationName} ${duration}s linear ${delay}s infinite`,
                                userSelect: "none",
                                transform: `rotate(${rotate}deg)`
                            }}
                        >
                            {item.emoji}
                        </span>
                    );
                })}
            </div>
        </div>
    );
});

export default RainAnimation;