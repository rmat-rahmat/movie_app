'use client';

import { useEffect, useState } from "react";
import LoadingPage from "@/components/ui/LoadingPage";
import { VideoSrc } from "@/types/VideoSrc";
import { getWatchHistoryList, getUserUploadedVideos, getFavoritesList, getVideoLikeList, getSharesList } from "@/lib/movieApi";
import { FiChevronRight, FiDelete, FiLogOut, FiSettings, FiTrash, FiTrash2 } from "react-icons/fi";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAuthStore } from '@/store/authStore';
import Image from "next/image";
import DashboardSection from "@/components/movie/DashboardSection";
import { DashboardItem } from "@/types/Dashboard";
import ProfileWrapper from "./ProfileWrapper";


export default function Profile() {
    const [isloading, setIsLoading] = useState(true);
    const [lastSeenVid, setLastSeenVid] = useState<DashboardItem[]>([]);
    const [playlists, setPlaylists] = useState<DashboardItem[]>([]);
    const [yourVideos, setYourVideos] = useState<DashboardItem[]>([]);
    const [favorites, setFavorites] = useState<DashboardItem[]>([]);
    const [likedVideos, setLikedVideos] = useState<DashboardItem[]>([]);
    const [shares, setShares] = useState<DashboardItem[]>([]);
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

        const fetchData = async () => {
            const listA = await getWatchHistoryList(1, 12, '480');
            setLastSeenVid(listA || []);

            const uploads = await getUserUploadedVideos(1, 12, '480');
            setYourVideos(uploads || []);

            const favs = await getFavoritesList(1, 12, '480');
            setFavorites(favs || []);

            const likes = await getVideoLikeList(1, 12, '480');
            setLikedVideos(likes || []);

            const sharesList = await getSharesList(1, 12, undefined, undefined, '480');
            setShares(sharesList || []);

            setIsLoading(false);
        };
        fetchData();
    }, [user]);

    const maskUserID = (id: string | number | undefined) => {
        if (id === undefined || id === null) return '';
        const s = String(id);
        if (s.length <= 4) return s;
        return `${s.slice(0, 2)}***${s.slice(-2)}`;
    }


    return (
        <ProfileWrapper title={t('profile.profile', 'Profile')}>
            {isloading || authLoading || !user ? <LoadingPage /> : <>

                <DashboardSection
                    onViewMore={undefined}
                    title={t('profile.WatchHistory', 'Watch History')}
                    videos={lastSeenVid || []}
                    sectionOptionButton={{
                        title: t('viewAll', 'View All'),
                        icon: <FiChevronRight className="h-4 w-4" />,
                        iconRight: true,
                        onClick: () => {
                            location.href = '/profile/history';
                            // Clear watch history logic here
                            // setLastSeenVid([]);
                        }
                    }}
                />
                <DashboardSection
                    onViewMore={undefined}
                    title={t('profile.Playlist', 'My Playlist')}
                    videos={favorites || []}
                    sectionOptionButton={{
                        title: t('viewAll', 'View All'),
                        icon: <FiChevronRight className="h-4 w-4" />,
                        iconRight: true,
                        onClick: () => {
                            location.href = '/profile/favorites';
                        }
                    }}
                />
                {/* <DashboardSection
                        onViewMore={undefined}
                        title={t('profile.LikedVideos', 'Liked Videos')}
                        videos={likedVideos || []}
                        sectionOptionButton={{
                            title: t('viewAll', 'View All'),
                            icon: <FiChevronRight className="h-4 w-4" />,
                            iconRight: true,
                            onClick: () => {
                                location.href = '/profile/likes';
                            }
                        }}
                    /> */}
                {/* <DashboardSection
                        onViewMore={undefined}
                        title={t('profile.Playlist', 'Playlist')}
                        videos={playlists || []}
                        sectionOptionButton={{
                            title: t('viewAll', 'View All'),
                            icon: <FiChevronRight className="h-4 w-4" />,
                            iconRight: true,
                            onClick: () => {
                                // Clear watch history logic here
                                // setLastSeenVid([]);
                            }
                        }}
                    /> */}
                <DashboardSection
                    onViewMore={undefined}
                    title={t('profile.Shares', 'Shared Videos')}
                    videos={shares || []}
                    sectionOptionButton={{
                        title: t('viewAll', 'View All'),
                        icon: <FiChevronRight className="h-4 w-4" />,
                        iconRight: true,
                        onClick: () => {
                            location.href = '/profile/shares';
                        }
                    }}
                />
                <DashboardSection
                    onViewMore={undefined}
                    title={t('profile.YourVideos', 'Your Videos')}
                    videos={yourVideos || []}
                    sectionOptionButton={{
                        title: t('viewAll', 'View All'),
                        icon: <FiChevronRight className="h-4 w-4" />,
                        iconRight: true,
                        onClick: () => {
                            location.href = '/profile/your-videos';
                        }
                    }}
                />
                {/* View history */}

                {/* 
                <DashboardSection
                  key={sec.id || sec.title}
                  onViewMore={sec.hasMore ? () => location.href = `/viewmore/${sec.id}` : undefined}
                  title={sec.title || ""}
                  videos={sec.contents || []}
                />

                    */}
            
            </>}
        </ProfileWrapper>
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