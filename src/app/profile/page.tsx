'use client';

import { useEffect, useState } from "react";
import LoadingPage from "@/components/ui/LoadingPage";
import { VideoSrc } from "@/types/VideoSrc";
import { getLastSeenVideos } from "@/lib/userMovieList";
import { FiSettings } from "react-icons/fi";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAuthStore } from '@/store/authStore';
import Image from "next/image";


export default function Profile() {
    const [isloading, setIsLoading] = useState(true);
    const [lastSeenVid, setLastSeenVid] = useState<VideoSrc[]>([]);
    const { t } = useTranslation('common');

    const user = useAuthStore((s) => s.user);
    const authLoading = useAuthStore((s) => s.isLoading);
    // const checkAuth = useAuthStore((s) => s.checkAuth);
    const subscribersCount = user?.subscribers;


    useEffect(() => {
        // ensure auth is loaded
        if (!user) {
            // checkAuth().catch(() => {});
        }

        const fetchData = async () => {
            const listA = await getLastSeenVideos();
            setLastSeenVid(listA);
            setIsLoading(false);
        };
        fetchData();
    }, [user]);

    return (
        <>
            {isloading || authLoading || !user ? <LoadingPage /> : <div className=" mx-auto overflow-hidden">
                <div className="grid h-[40vh] md:h-[30vh] w-full md:grid-cols-[30%_70%] md:grid-rows-1 grid-cols-1 grid-rows-[70%_30%]">
                    <div className="bg-black order-last md:order-first flex items-end md:pl-20 overflow-visible">
                        <div className="flex items-center gap-4 p-4 min-w-[200%] z-1">
                            <Image src={user?.avatar || '/fallback_poster/sample_poster.png'} alt={user?.nickname || "avatar"} width={30} height={30} className="w-30 h-30 lg:min-w-50 lg:min-h-50 rounded-full mr-2 object-cover" />
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-bold">{user?.name || user?.nickname || 'User'}</h1>
                                <p className="text-gray-400 mb-2 w-[60vw] md:w-[40vw] pr-15">
                                    {t('profile.welcome', { name: user?.name || user?.nickname || 'User' })}
                                </p>
                                <div className="flex items-center gap-2 flex-col md:flex-row pr-15 md:pr-0">
                                    {/* <button className="bg-[#fbb033] text-white px-4 py-2 rounded font-semibold w-full md:w-fit hover:bg-red-700 transition">
                                        {`${t('profile.subscribeLabel') || 'Subscribe'} ${subscribersCount ? `(${formatSubscribers(Number(subscribersCount))})` : ''}`}
                                    </button> */}
                                    <Link href="/settings" className="flex items-center gap-2 bg-gray-800 text-white px-3 py-2 w-full md:w-fit rounded font-medium hover:bg-gray-700 transition">
                                        <FiSettings className="h-4 w-4" />
                                        <span className="text-sm">{t('profile.settings') || 'Settings'}</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative w-[full] bg-[#fbb033] order-first md:order-last flex items-center justify-center">
                        {/* <video
                            src="https://www.w3schools.com/html/mov_bbb.mp4"
                            muted
                            playsInline
                            autoPlay
                            loop
                            controls={false}
                            className="object-cover w-full h-full inset-0"
                            style={{ width: "100%", height: "100%" }}
                        /> */}
                        <div className="absolute inset-0 h-full bg-gradient-to-t from-black via-black/30 to-black/30 md:bg-[radial-gradient(circle_at_60%_50%,transparent,rgba(0,0,0,0.4),#000)]" />
                        <div className="absolute inset-0 h-full md:bg-[radial-gradient(circle_at_70%_50%,transparent,rgba(0,0,0,0.4),#000)]" />
                    </div>
                </div>
                <div className="container min-h-[40vh] mx-auto px-4 py-8 mt-0">

{/* 
                    <MovieSection

                        icon={<FiPlayCircle className="h-6 w-6 text-[#fbb033]" />}
                        onViewMore={() => console.log("View More Movies")}
                        showPlayback={true} showViewer={true}
                        frameSize={30}
                        title={t('profile.lastSeen') || t('profile.personalInfo')}
                        videos={lastSeenVid}
                    />


                    <MovieSection
                        onViewMore={() => console.log("Uploaded Videos")}
                        showPlayback={true} showViewer={true}
                        frameSize={20}
                        title={t('profile.uploadedVideos') || 'Uploaded Videos'}
                        videos={lastSeenVid}
                    />

                    <MovieSection
                        onViewMore={() => console.log("Playlists")} showViewer={true}
                        frameSize={20}
                        title={t('profile.playlists') || 'Playlists'}
                        videos={lastSeenVid}
                    /> */}
                   
                </div>
            </div>
            }
        </>
    );
}




// Utility function to format subscriber count
function formatSubscribers(count: number): string {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
        return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
}