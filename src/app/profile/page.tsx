'use client';

import { useEffect, useState } from "react";
import LoadingPage from "@/components/LoadingPage";
import GuestLayout from "@/components/GuestLayout";
import Image from "next/image";
import { VideoSrc } from "@/types/VideoSrc";
import { getLastSeenVideos } from "@/lib/userMovieList";
import MovieSection from "@/components/MovieSection";
import { FiPlayCircle } from "react-icons/fi";


export default function Profile() {
    const [isloading, setIsLoading] = useState(true);
    const [lastSeenVid, setLastSeenVid] = useState<VideoSrc[]>([]);


    useEffect(() => {
        const fetchData = async () => {
            const listA = await getLastSeenVideos();
            setLastSeenVid(listA);
            setIsLoading(false);
        };
        fetchData();
    }, []);



    return (
        <GuestLayout>
            {isloading ? <LoadingPage /> : <div>
                {/* <div className="grid h-[30vh] mt-10 w-full md:grid-cols-[30%_70%] md:grid-rows-1 grid-cols-1 grid-rows-[70%_30%]">
                    <div className="bg-black order-last md:order-first flex items-end md:pl-20 overflow-visible">
                        <div className="flex items-center gap-4 p-4 min-w-[200%] z-1">
                            <img
                                src={mockUser.avatar}
                                alt="User Avatar"
                                className="w-40 h-40 rounded-full border"
                            />
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-bold">{mockUser.name}</h1>
                                <p className="text-gray-600 mb-2">
                                    Welcome to {mockUser.name}&apos;s channel. Sharing tutorials, reviews, and more!
                                </p>
                                <button className="bg-red-600 text-white px-4 py-2 rounded font-semibold w-fit hover:bg-red-700 transition">
                                    Subscribe {mockUser.subscribers ? `(${formatSubscribers(mockUser.subscribers)})` : ""}
                                </button>
                            </div>
                           

                        </div>
                    </div>
                    <div className="relative bg-[#e50914] order-first md:order-last flex items-center justify-center">
                        <video
                            src="https://www.w3schools.com/html/mov_bbb.mp4"
                            controls
                            autoPlay
                            loop
                            className="object-cover w-full h-full absolute inset-0"
                            style={{ width: "100%", height: "100%" }}
                        />
                        <div className="absolute inset-0 h-full bg-gradient-to-t from-black via-black/30 to-black/30 md:bg-[radial-gradient(circle_at_60%_50%,transparent,rgba(0,0,0,0.4),#000)]" />
                        <div className="absolute inset-0 h-full md:bg-[radial-gradient(circle_at_70%_50%,transparent,rgba(0,0,0,0.4),#000)]" />
                    </div>
                </div> */}
                <div className="container mx-auto px-4 py-8 mt-16">


                    <MovieSection

                        icon={<FiPlayCircle className="h-6 w-6 text-[#e50914]" />}
                        onViewMore={() => console.log("View More Movies")}
                        showPlayback={true} showViewer={true}
                        frameSize={30}
                        title="Recently Watched"
                        videos={lastSeenVid}
                    />

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Uploaded Videos</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {mockUser.uploadedVideos.map((video) => (
                                <div key={video.id} className="border rounded p-2 flex flex-col items-center">
                                    <img src={video.thumbnail} alt={video.title} className="w-full h-24 object-cover rounded" />
                                    <div className="mt-2 text-center">
                                        <div className="font-medium">{video.title}</div>
                                        <div className="text-sm text-gray-500">{video.views} views</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Watchlist</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {mockUser.watchlist.map((video) => (
                                <div key={video.id} className="border rounded p-2 flex flex-col items-center">
                                    <img src={video.thumbnail} alt={video.title} className="w-full h-24 object-cover rounded" />
                                    <div className="mt-2 text-center font-medium">{video.title}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">Playlists</h2>
                        <ul>
                            {mockUser.playlists.map((playlist) => (
                                <li key={playlist.id} className="mb-2 border rounded p-2 flex justify-between items-center">
                                    <span>{playlist.name}</span>
                                    <span className="text-sm text-gray-500">{playlist.count} videos</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </div>
            }
        </GuestLayout>
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

const mockUser = {
    name: "John Doe",
    avatar: "https://i.pravatar.cc/150?img=3",
    subscribers: 1200,
    uploadedVideos: [
        { id: 1, title: "My First Video", thumbnail: "https://via.placeholder.com/150", views: 120 },
        { id: 2, title: "React Tutorial", thumbnail: "https://via.placeholder.com/150", views: 98 },
    ],
    watchlist: [
        { id: 3, title: "Learn TypeScript", thumbnail: "https://via.placeholder.com/150" },
        { id: 4, title: "Next.js Guide", thumbnail: "https://via.placeholder.com/150" },
    ],
    playlists: [
        { id: 1, name: "Favorites", count: 5 },
        { id: 2, name: "Watch Later", count: 3 },
    ],
};