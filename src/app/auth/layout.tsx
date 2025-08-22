'use client';
import React, { useState, useEffect } from 'react';
import { getMovies } from '@/lib/movieApi';
import { VideoSrc } from '@/types/VideoSrc';
import RainAnimation from "@/components/ui/RainAnimation";
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    
    const [isLoading, setIsLoading] = useState(false);
    const [movies, setMovies] = useState<VideoSrc[]>([]);
    const fetchMovies = async () => {
        setIsLoading(true);
        try {
            const moviesData = await getMovies(30);
            console.log(moviesData.length, "movies fetched");
            setMovies(moviesData);
        } catch (error) {
            console.error("Error fetching movies:", error);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchMovies();
    }, []);



    useEffect(() => {
        // Only inject keyframes once after mount
        if (typeof window !== "undefined") {
            const styleSheet = document.styleSheets[0];
            // For movies
            for (let idx = 0; idx < 30; idx++) {
                const animationName = `rainAnim${idx}`;
                if (
                    styleSheet &&
                    !Array.from(styleSheet.cssRules).find(
                        rule =>
                            rule.type === window.CSSRule.KEYFRAMES_RULE &&
                            (rule as CSSKeyframesRule).name === animationName
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
            // For emojis
            for (let idx = 0; idx < 12; idx++) {
                const animationName = `emojiRainAnim${idx}`;
                if (
                    styleSheet &&
                    !Array.from(styleSheet.cssRules).find(
                        rule =>
                            rule.type === window.CSSRule.KEYFRAMES_RULE &&
                            (rule as CSSKeyframesRule).name === animationName
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
    }, []); // Only run once

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#fbb033]"></div>
            </div>
        );
    }
    return (
        <div className="flex flex-col md:flex-row h-screen items-center justify-center">
            <RainAnimation movies={movies} />
            <div className="absolute z-0 top-10 md:right-10 w-full  md:w-[30vw] h-[10vh] z-0 pointer-events-none overflow-hidden z-2">
                <h1
                    className="text-4xl font-bold text-white relative text-center md:text-right animate-glow"
                    style={{
                        textShadow: "2px 2px 3px rgba(0,0,0,0.9), 0 0 0 #000, 0 0 8px #222"
                    }}
                >
                    SeeFu.TV
                </h1>
                <style jsx>{`
                    @keyframes glow {
                        0%, 100% {
                            text-shadow: 2px 2px 3px rgba(255,0,0,0.9), 0 0 0 #000, 0 0 3px #222, 0 0 4px #39ff14, 0 0 3px #39ff14;
                        }
                        50% {
                            text-shadow: 2px 2px 3px rgba(0,0,255,0.9), 0 0 0 #000, 0 0 3px #39ff14, 0 0 4px #39ff14, 0 0 3px #39ff14;
                        }
                    }
                    .animate-glow {
                        animation: glow 2s ease-in-out infinite;
                    }
                `}</style>
            </div>
            <div className="absolute top-4 left-4 z-50">
                            <LanguageSwitcher large />
                        </div>
            {children}
        </div>
    );
}
