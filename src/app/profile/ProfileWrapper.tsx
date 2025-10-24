'use client';

import { useEffect, useState } from "react";
import LoadingPage from "@/components/ui/LoadingPage";
import { VideoSrc } from "@/types/VideoSrc";
import { getWatchHistoryList, getUserUploadedVideos, getFavoritesList, getVideoLikeList } from "@/lib/movieApi";
import { FiChevronLeft, FiChevronRight, FiDelete, FiLogOut, FiSettings, FiTrash, FiTrash2 } from "react-icons/fi";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAuthStore } from '@/store/authStore';
import Image from "next/image";
import DashboardSection from "@/components/movie/DashboardSection";
import { DashboardItem } from "@/types/Dashboard";


export default function ProfileWrapper({ children ,title, subHeaderRight}: { children: React.ReactNode , title: string ,subHeaderRight?: React.ReactNode}) {
    const [isloading, setIsLoading] = useState(true);
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
        console.log("user:", user)
        setIsLoading(false);
    }, [user]);

    const maskUserID = (id: string | number | undefined) => {
        if (id === undefined || id === null) return '';
        const s = String(id);
        if (s.length <= 4) return s;
        return `${s.slice(0, 2)}***${s.slice(-2)}`;
    }


    return (
        <>
            {isloading || authLoading || !user ? <LoadingPage /> : <div className=" mx-auto overflow-hidden">
                <div className="grid h-[40vh] md:h-[30vh] w-full md:grid-cols-[30%_70%] md:grid-rows-1 grid-cols-1 grid-rows-[70%_30%]">
                    <div className="bg-black order-last md:order-first flex items-end md:pl-20 overflow-visible">
                        <div className="flex items-center gap-4 p-4 min-w-[200%] z-1">
                            <Image src={user?.avatar || '/fallback_poster/sample_poster.png'} alt={user?.nickname || "avatar"} width={30} height={30} className="w-30 h-30 lg:min-w-50 lg:min-h-50 rounded-full mr-2 object-cover" />
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-bold">{user?.name || user?.nickname || maskUserID(user?.id) || 'User'}</h1>
                                <p className="text-gray-400 mb-2 w-[60vw] md:w-[40vw] pr-15">
                                    {t('profile.welcome', { name: user?.name || user?.nickname || maskUserID(user?.id) || 'User' })}
                                </p>
                                <div className="flex items-center gap-2 flex-col md:flex-row pr-15 md:pr-0">
                                    {/* <button className="bg-[#fbb033] text-white px-4 py-2 rounded font-semibold w-full md:w-fit hover:bg-red-700 transition">
                                        {`${t('profile.subscribeLabel') || 'Subscribe'} ${subscribersCount ? `(${formatSubscribers(Number(subscribersCount))})` : ''}`}
                                    </button> */}
                                    <Link href="/settings" className="flex items-center gap-2 bg-gray-800 text-white px-3 py-2 w-full md:w-fit rounded font-medium hover:bg-gray-700 transition">
                                        <FiSettings className="h-4 w-4" />
                                        <span className="text-sm">{t('profile.settings') || 'Settings'}</span>
                                    </Link>
                                    <button className="flex items-center gap-2 bg-gray-800 text-white px-3 py-2 w-full md:w-fit rounded font-medium hover:bg-gray-700 transition" onClick={() => useAuthStore.getState().logout()}>
                                        <FiLogOut className="h-4 w-4" />
                                        <span className="text-sm">{t('navigation.logout') || 'Logout'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative w-[full] bg-[#fbb033] order-first md:order-last flex items-center justify-center">
                        <div className="absolute inset-0 h-full bg-gradient-to-t from-black via-black/30 to-black/30 md:bg-[radial-gradient(circle_at_60%_50%,transparent,rgba(0,0,0,0.4),#000)]" />
                        <div className="absolute inset-0 h-full md:bg-[radial-gradient(circle_at_70%_50%,transparent,rgba(0,0,0,0.4),#000)]" />
                    </div>
                </div>
                <div className="container min-h-[40vh] mx-auto px-4 py-8 mt-0">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Link href="/profile" className="text-gray-300 hover:text-white flex items-center gap-2">
                                <FiChevronLeft /> {t('profile.backToProfile', 'Back to Profile')}
                            </Link>
                            <h1 className="text-3xl font-bold">{title}</h1>
                        </div>
                        {subHeaderRight && <>{subHeaderRight}</>}
                    </div>
                    {children}
                </div>
            </div>
            }
        </>
    );
}


