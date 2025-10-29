'use client';

import { useEffect, useState } from "react";
import LoadingPage from "@/components/ui/LoadingPage";
import { VideoSrc } from "@/types/VideoSrc";
import { getWatchHistoryList, getUserUploadedVideos, getFavoritesList, getVideoLikeList } from "@/lib/movieApi";
import { FiChevronLeft, FiChevronRight, FiDelete, FiEdit, FiLogOut, FiSettings, FiTrash, FiTrash2 } from "react-icons/fi";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAuthStore } from '@/store/authStore';
import Image from "next/image";
import DashboardSection from "@/components/movie/DashboardSection";
import { DashboardItem } from "@/types/Dashboard";


export default function ProfileWrapper({ children, title, subHeaderRight }: { children: React.ReactNode, title: string, subHeaderRight?: React.ReactNode }) {
    const [isloading, setIsLoading] = useState(true);
    const { t } = useTranslation('common');

    const user = useAuthStore((s) => s.user);
    const authLoading = useAuthStore((s) => s.isLoading);
    // const checkAuth = useAuthStore((s) => s.checkAuth);
    const subscribersCount = user?.subscribers;

    ``
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
        if (s.length <= 6) return `${s.slice(0, 2)}***${s.slice(-2)}`;
        return `${s.slice(0, 3)}*****${s.slice(-3)}`;
    }


    return (
        <>
            {isloading || authLoading || !user ? <LoadingPage /> : <div className=" mx-auto overflow-hidden">
                <div className="flex md:hidden items-center justify-between mb-6 p-1">
                    <div className="flex items-center ">
                        {title !== t('navigation.profile', 'Profile') &&
                            <Link href="/profile" className="text-gray-300 hover:text-white flex items-center">
                                <FiChevronLeft size={26} /> <span className="hidden md:inline">{t('profile.backToProfile', 'Back to Profile')}</span>
                            </Link>}
                        <h1 className="text-xl md:text-3xl font-bold">{title}</h1>
                    </div>
                    {subHeaderRight && <>{subHeaderRight}</>}
                </div>
               <div className="order-last md:order-first flex items-end md:pl-20 overflow-visible">
                        <div className="flex items-center gap-1 p-4 w-full z-1 justify-start ">
                            <Image src={user?.avatar || '/fallback_poster/sample_poster.png'} alt={user?.nickname || "avatar"} width={30} height={30} className="w-15 h-15 md:w-30 md:h-30 lg:min-w-50 lg:min-h-50 rounded-full mr-2 object-cover" />
                            <div className="flex flex-grow flex-col h-full">
                                <h1 className="text-lg md:text-5xl font-bold"> {(user?.name || user?.nickname || maskUserID(user?.id) || 'User').toString().charAt(0).toUpperCase() + (user?.name || user?.nickname || maskUserID(user?.id) || 'User').toString().slice(1)}</h1>
                                <h2 className="text-md md:text-3xl font-bold">Id: {maskUserID(user?.id) || maskUserID(user?.email) || 'User'}</h2>
                                {/* <p className="text-gray-400 mb-2 w-[60vw] md:w-[40vw] pr-15">
                                    {t('profile.welcome', { name: user?.name || user?.nickname || maskUserID(user?.id) || 'User' })}
                                </p> */}
                                <div className="flex  md:mt-10 items-center gap-2 flex-col md:flex-row pr-15 md:pr-0">
                                    {/* <button className="bg-[#fbb033] text-white px-4 py-2 rounded font-semibold w-full md:w-fit hover:bg-red-700 transition">
                                        {`${t('profile.subscribeLabel') || 'Subscribe'} ${subscribersCount ? `(${formatSubscribers(Number(subscribersCount))})` : ''}`}
                                    </button> */}
                                    {/* <Link href="/settings" className="flex items-center gap-2 bg-gray-800 text-white px-3 py-2 w-full md:w-fit rounded font-medium hover:bg-gray-700 transition">
                                        <FiSettings className="h-4 w-4" />
                                        <span className="text-sm">{t('profile.settings') || 'Settings'}</span>
                                    </Link>
                                    <button className="flex items-center gap-2 bg-gray-800 text-white px-3 py-2 w-full md:w-fit rounded font-medium hover:bg-gray-700 transition" onClick={() => useAuthStore.getState().logout()}>
                                        <FiLogOut className="h-4 w-4" />
                                        <span className="text-sm">{t('navigation.logout') || 'Logout'}</span>
                                    </button> */}

                                <button className="flex items-center gap-1 bg-[#fbb033] text-white px-2 py-1 w-full md:w-fit rounded-full font-medium hover:bg-gray-700 transition" onClick={() => useAuthStore.getState().logout()}>
                                    <FiLogOut className="h-4 w-4" />
                                    <span className="text-sm">{t('navigation.logout') || 'Logout'}</span>
                                </button>
                                </div>
                            </div>
                            <div className="flex  md:self-center items-center md:justify-start gap-2 mt-2 md:mt-0">
                                <Link href="/settings" className="flex items-center gap-2 text-white px-3 py-2 w-full md:w-fit rounded-full font-medium hover:bg-[#fbb033] transition">
                                    <FiEdit className="h-4 w-4" />
                                    <span className="hidden md:inline text-sm">{t('profile.settings') || 'Settings'}</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="relative w-[full]  order-first md:order-last flex items-center justify-center">
                        <div className="absolute inset-0 h-full bg-gradient-to-t from-black via-black/30 to-black/30 md:bg-[radial-gradient(circle_at_60%_50%,transparent,rgba(0,0,0,0.4),#000)]" />
                        <div className="absolute inset-0 h-full md:bg-[radial-gradient(circle_at_70%_50%,transparent,rgba(0,0,0,0.4),#000)]" />
                    </div>
                <div className="container min-h-[40vh] mx-auto px-4 py-8 mt-0">
                    <div className="hidden md:flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                             {title !== t('navigation.profile', 'Profile') &&
                                <Link href="/profile" className="text-gray-300 hover:text-white flex items-center gap-2">
                                    <FiChevronLeft /> {t('profile.backToProfile', 'Back to Profile')}
                                </Link>}
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


