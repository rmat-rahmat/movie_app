import { transformEpisodesToSlides } from "@/utils/transformToSlides";
import { parseStringPromise } from 'xml2js';
import axios from 'axios';
import { BASE_URL } from '../config';
import type { VideoSrc } from "@/types/VideoSrc";

// Helper to convert Movie to VideoSrc
const Authorization = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4Yzc0NjMzMDQxNmJiODMxMmY5MzI1NTA1Y2JjZmZhZSIsIm5iZiI6MTc1NDg3NTYwMi42NzI5OTk5LCJzdWIiOiI2ODk5NDZkMjc3M2YwMWMyMzQ1ZDEyNzciLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.rXrr9MVh9M5P1TEmAxiHrr374UKU5SgLZaVzl4U0GEA';
function movieToVideoSrc(movie: unknown): VideoSrc {
  const m = movie as {
    id: number | string;
    original_title?: string;
    title?: string;
    description?: string;
    overview?: string;
    backdrop_path?: string;
    poster_path?: string;
    release_date?: string;
    vote_average?: number;
    vote_count?: number;
    popularity?: number;
    casts?: unknown[];
  };
  return {
    id: m.id,
    title: m.original_title || m.title || "",
    description: m.description || m.overview || "",
    backdrop_image: "https://image.tmdb.org/t/p/original/" + m.backdrop_path,
    potrait_image: "https://image.tmdb.org/t/p/original/" + m.poster_path,
    release_date: m.release_date,
    vote_average: m.vote_average,
    vote_count: m.vote_count,
    popularity: m.popularity,
    casts: Array.isArray(m.casts)
      ? m.casts.map((cast) => {
        const c = cast as {
          id: string | number;
          name: string;
          character?: string;
          profile_path?: string;
        };
        return {
          id: c.id,
          name: c.name,
          character: c.character,
          profile_image: c.profile_path,
        };
      })
      : [],
  };
}
export const getMovies = async (number: number): Promise<VideoSrc[]> => {
  const res = await axios.get(`https://jsonfakery.com/movies/random/${number}`);
  const movies = res.data;
  // Convert each movie to VideoSrc format
  return movies.map(movieToVideoSrc);
};

export const getNowPlayingMovies = async (number: number): Promise<VideoSrc[]> => {
  const url = 'https://api.themoviedb.org/3/movie/now_playing?language=en-US&page=1';
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization
    }
  };

  try {
  const res = await axios.get(url, { headers: options.headers });
  const movies = res.data;
    // Convert each movie to VideoSrc format
    console.log(movies);
    return movies?.results.map(movieToVideoSrc);
  } catch (error) {
    console.error('Error fetching now playing movies:', error);
    return [];
  }
};

export const getPopularMovie = async (number: number): Promise<VideoSrc[]> => {
  const url = 'https://api.themoviedb.org/3/movie/popular?language=en-US&page=1';
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization
    }
  };

  try {
  const res = await axios.get(url, { headers: options.headers });
  const movies = res.data;
    // Convert each movie to VideoSrc format
    return movies?.results.map(movieToVideoSrc);
  } catch (error) {
    console.error('Error fetching now playing movies:', error);
    return [];
  }
};

export const getTopRatedMovies = async (number: number): Promise<VideoSrc[]> => {
  const url = 'https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=1';
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization
    }
  };

  try {
  const res = await axios.get(url, { headers: options.headers });
  const movies = res.data;
    // Convert each movie to VideoSrc format
    return movies?.results.map(movieToVideoSrc);
  } catch (error) {
    console.error('Error fetching now playing movies:', error);
    return [];
  }
};
export const getUpcomingMovies = async (number: number): Promise<VideoSrc[]> => {
  const url = 'https://api.themoviedb.org/3/movie/upcoming?language=en-US&page=1';
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization
    }
  };  
  try {
  const res = await axios.get(url, { headers: options.headers });
  const movies = res.data;
  // Convert each movie to VideoSrc format
  return movies?.results.map(movieToVideoSrc);
  } catch (error) {
    console.error('Error fetching now playing movies:', error);
    return [];
  }
};

export const getSeries = async (country: string) => {
  const res = await axios.get(`https://api.tvmaze.com/schedule?country=${country}`);
  const episodes = res.data;
  return transformEpisodesToSlides(episodes, 10);
};

export const getShort = async (channel_id: string, limit: number): Promise<VideoSrc[]> => {
  const corsProxy = "https://corsproxy.io/?";
  const feedUrl = corsProxy + encodeURIComponent("https://www.youtube.com/feeds/videos.xml?channel_id=" + channel_id);

  const res = await axios.get(feedUrl, { responseType: 'text' });
  const xmlText = res.data;
  const parsed = await parseStringPromise(xmlText);

  const entries = parsed.feed.entry || [];

  type YoutubeFeedEntry = {
    'yt:videoId': string[];
    title: string[];
    published: string[];
    'media:group': Array<{
      'media:description': string[];
      'media:community': Array<{
        'media:statistics': Array<{ $: { views: string } }>;
        'media:starRating': Array<{ $: { count: string; average: string } }>;
      }>;
    }>;
  };

  const mockMovies: VideoSrc[] = entries.slice(0, limit).map((entry: unknown) => {
    const e = entry as YoutubeFeedEntry;
    const id = e['yt:videoId'][0];
    const title = e.title[0];
    const description = e['media:group'][0]['media:description'][0];
    const videoId = e['yt:videoId'][0];
    const publishDate = e.published[0];
    const popularity = Number(e['media:group'][0]['media:community'][0]['media:statistics'][0].$.views || "0");
    const vote_count = Number(e['media:group'][0]['media:community'][0]['media:starRating'][0].$.count || "0");
    const vote_average = Number(e['media:group'][0]['media:community'][0]['media:starRating'][0].$.average || "0");
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return {
      id,
      title,
      description,
      backdrop_image: thumbnail,
      potrait_image: thumbnail,
      release_date: new Date(publishDate).toISOString().split("T")[0],
      vote_average,
      vote_count,
      popularity,
      casts: [],
    };
  });

  return mockMovies;
};
