/**
 * Profile Page
 * 
 * This page displays the user's profile, including:
 * - Watch history (recently watched videos)
 * - Playlist (favorites)
 * - User's uploaded videos
 * - Download Android app section
 * 
 * Key conventions:
 * - Uses `useState` and `useEffect` for data fetching and state management.
 * - Uses `useAuthStore` for authentication and user info.
 * - Uses `DashboardSection` for consistent video grid UI.
 * - Follows project conventions in .github/copilot-instructions.md.
 * 
 * To extend:
 * - Add more dashboard sections as needed.
 * - Add more user profile features (settings, edit profile, etc.).
 * 
 * Function-level comments are provided below for maintainability.
 */

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
import { LuCrown } from "react-icons/lu";
import DownloadAndroid from "@/components/download/DownloadAndroid"

/**
 * Profile
 * Main profile page component.
 * Fetches and displays user data: watch history, playlist, uploads, etc.
 */
export default function Profile() {
    // State for loading and user data
    const [isloading, setIsLoading] = useState(true);
    const [lastSeenVid, setLastSeenVid] = useState<DashboardItem[]>([]);
    const [playlists, setPlaylists] = useState<DashboardItem[]>([]);
    const [yourVideos, setYourVideos] = useState<DashboardItem[]>([]);
    const [favorites, setFavorites] = useState<DashboardItem[]>([]);
    const [likedVideos, setLikedVideos] = useState<DashboardItem[]>([]);
    const { t } = useTranslation('common');

    // Auth state
    const user = useAuthStore((s) => s.user);
    const authLoading = useAuthStore((s) => s.isLoading);
    // const checkAuth = useAuthStore((s) => s.checkAuth);
    const subscribersCount = user?.subscribers;

    /**
     * Effect: Fetches user-related video data on mount or when user changes.
     */
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

            // const favs = await getFavoritesList(1, 12, '480');

            // const likes = await getVideoLikeList(1, 12, '480');
            // setLikedVideos(likes || []);
            // setFavorites([...(favs || []), ...(likes || [])]);
            remakePlaylists();

            setIsLoading(false);
        };
        fetchData();
    }, [user]);

    const remakePlaylists = async () => {
        const favs = await getFavoritesList(1, 12, '480');
        const likes = await getVideoLikeList(1, 12, '480');

        // Get first item of each, update title and tags, and ensure photo exists
        const favFirst = favs && favs.length > 0 && favs[0]?.imageQuality?.url 
            ? { 
            ...favs[0], 
            title:t('profile.Favorites', 'My Favorites'),
            tags: [`${favs.length} videos`] ,
            language:null,
            fileName:'favorites/list'

              }
            : undefined;
        const likeFirst = likes && likes.length > 0 && likes[0]?.imageQuality?.url 
            ? { 
            ...likes[0], 
            title: t('profile.LikedVideos', 'Liked Videos') ,
            tags: [`${likes.length} videos`] ,
            language:null,
            fileName:'likes'
              }
            : undefined;

        // Only include items with photo
        const filtered = [favFirst, likeFirst].filter(Boolean) as DashboardItem[];
        console.log("Remade playlists:", filtered);
        setFavorites(filtered);
    }
    /**
     * maskUserID
     * Utility to mask user ID for privacy.
     */
    const maskUserID = (id: string | number | undefined) => {
        if (id === undefined || id === null) return '';
        const s = String(id);
        if (s.length <= 4) return s;
        return `${s.slice(0, 2)}***${s.slice(-2)}`;
    }

    return (
        <ProfileWrapper title={t('navigation.profile', 'Profile')}>
            {/* Show loading spinner if loading or auth is loading */}
            {isloading || authLoading || !user ? <LoadingPage /> : <>

                {/* Watch History Section */}
                <DashboardSection
                    onViewMore={undefined}
                    title={t('profile.WatchHistory', 'Watch History')}
                    videos={lastSeenVid || []}
                    sectionOptionButton={{
                        title: t('common.viewAll', 'View All'),
                        icon: <FiChevronRight className="h-4 w-4" />,
                        iconRight: true,
                        onClick: () => {
                            location.href = '/profile/history';
                            // Clear watch history logic here
                            // setLastSeenVid([]);
                        }
                    }}
                />
                {/* Playlist (Favorites) Section */}
                <DashboardSection
                    onViewMore={undefined}
                    title={t('profile.Playlist', 'My Playlist')}
                    videos={favorites || []}
                    isSubSection={true}
                    sectionOptionButton={{
                        title: t('common.viewAll', 'View All'),
                        icon: <FiChevronRight className="h-4 w-4" />,
                        iconRight: true,
                        onClick: () => {
                            location.href = '/profile/favorites';
                        }
                    }}
                />
                {/* User's Uploaded Videos Section */}
                <DashboardSection
                    onViewMore={undefined}
                    title={t('profile.YourVideos', 'Your Videos')}
                    videos={yourVideos || []}
                    selfVideos={true}
                    sectionOptionButton={{
                        title: t('common.viewAll', 'View All'),
                        icon: <FiChevronRight className="h-4 w-4" />,
                        iconRight: true,
                        onClick: () => {
                            location.href = '/profile/your-videos';
                        }
                    }}
                />
            </>}
            
            {/* Download Android App Section */}
            <DownloadAndroid />
            
        </ProfileWrapper>
    );
}

/**
 * formatSubscribers
 * Utility function to format subscriber count (e.g., 1.2K, 3.4M).
 */
function formatSubscribers(count: number): string {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
        return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
}