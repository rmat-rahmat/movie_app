import { getShort } from "./movieApi";
import type { VideoSrc } from "@/types/VideoSrc";
/**
 * Fetches the last seen videos from localStorage or sessionStorage.
 * If not found, it fetches from the API and stores it in the specified storage.
 *
 * @param storageKey - The key to use for storing the last seen videos.
 * @param channelId - The YouTube channel ID to fetch videos from.
 * @param count - The number of videos to fetch.
 * @param useSessionStorage - Whether to use sessionStorage instead of localStorage.
 * @returns A promise that resolves to an array of VideoSrc objects.
 */

export const getLastSeenVideos = async (
    storageKey: string = 'lastSeenVid',
    channelId: string = 'UCk6_V9EQQ7c8fuWzFKcCNzQ',
    count: number = 10,
    useSessionStorage: boolean = false // Option to use sessionStorage
): Promise<VideoSrc[]> => {
    if (typeof window !== "undefined") {
        const storage = useSessionStorage ? sessionStorage : localStorage;
        const stored = storage.getItem(storageKey);
        // if (stored) {
        //     try {
        //         return JSON.parse(stored) as VideoSrc[];
        //     } catch {
        //         // fallback if parsing fails
        //     }
        // }
        const listA = await getShort(channelId, count);
        storage.setItem(storageKey, JSON.stringify(listA));
        return listA;
    }
    return [];
};