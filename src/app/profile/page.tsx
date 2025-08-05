'use client';

import MovieSection from "@/components/MovieSection";
import { getMovies, getSeries, getShort } from "@/lib/movieApi";
import { useEffect, useState } from "react";
import LoadingPage from "@/components/LoadingPage";
import GuestLayout from "@/components/GuestLayout";
import HeaderSlider from "@/components/HeaderSlider";
import type { VideoSrc } from "@/types/VideoSrc";
import { FiPlayCircle, FiStar } from "react-icons/fi";


export default function Home() {
  const [headerMovies, setHeaderMovies] = useState<VideoSrc[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<VideoSrc[]>([]);
  const [popularMovies, setPopularMovies] = useState<VideoSrc[]>([]);
  const [drama, setdrama] = useState<VideoSrc[]>([]);
  const [isloading, setIsLoading] = useState(true);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<VideoSrc[]>([]);
  const [shortMovies, setShortMovies] = useState<VideoSrc[]>([]);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    setIsLoading(true);
    try {
      const topRated = await getMovies(10);
      const popular = await getMovies(10);
      const newdrama = await getShort("UCXhPKXcBaBwpwOjq4l8mHIw", 10);
      const nowPlaying = await getMovies(10);
      const header = await getSeries("CN");
      setTopRatedMovies(topRated);
      setPopularMovies(popular);
      setdrama(newdrama);
      setNowPlayingMovies(nowPlaying);
      setHeaderMovies(header);
      const short = await getShort("UC2xVncJghTKzq4HvjzfIcOg", 10);
      setShortMovies(short);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching movies:", error);
      setIsLoading(false);
    }
  };

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  type MovieCategoryFilterProps = {
    categories: string[];
    display?: string;
  };

  // Expanded categories similar to YouTube
  const allCategories = [
    "All",
    "Romance",
    "Thriller",
    "Mystery",
    "Science Fiction",
    "Music",
    "Gaming",
    "Live",
    "News",
    "Sports",
    "Learning",
    "Fashion & Beauty",
    "Comedy",
    "Movies",
    "TV Shows",
    "Documentary",
    "Animation",
    "Kids",
    "Travel",
    "Food",
    "Technology",
    "Entertainment",
    "Recently Uploaded",
    "Trending",
  ];


  return (
    <GuestLayout>
      {isloading ? <LoadingPage /> :
        <div className="container mx-auto px-4 py-8 mt-16">
            <div className="flex items-center gap-4 mb-8 bg-gray-800 p-4 rounded-lg">
                <img
                    src={mockUser.avatar}
                    alt="User Avatar"
                    className="w-40 h-40 rounded-full border"
                />
                <div className="flex flex-col">
                <h1 className="text-2xl font-bold">{mockUser.name}</h1>
                <p className="text-gray-600 mb-2">Welcome to {mockUser.name}'s channel. Sharing tutorials, reviews, and more!</p>
                <button className="bg-red-600 text-white px-4 py-2 rounded font-semibold w-fit hover:bg-red-700 transition">
                  Subscribe {mockUser.subscribers ? `(${formatSubscribers(mockUser.subscribers)})` : ""}
                </button>
                </div>
                <div className="flex items-center bg-red-700 rounded w-full min-h-[20vh]">
                </div>

            </div>

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