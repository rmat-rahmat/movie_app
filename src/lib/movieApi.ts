import { transformEpisodesToSlides } from "@/utils/transformToSlides";
import { parseStringPromise } from 'xml2js';
import type { VideoSrc } from "@/types/VideoSrc";

// Helper to convert Movie to VideoSrc
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
    backdrop_image: m.backdrop_path,
    potrait_image: m.poster_path,
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
  const res = await fetch(`https://jsonfakery.com/movies/random/${number}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch top-rated movies');
  const movies = await res.json();
  // Convert each movie to VideoSrc format
  return movies.map(movieToVideoSrc);
};

export const getSeries = async (country: string) => {
  const res = await fetch(`https://api.tvmaze.com/schedule?country=${country}`, { cache: 'default' });
  if (!res.ok) throw new Error('Failed to fetch top-rated series');
  const episodes = await res.json();
  return transformEpisodesToSlides(episodes, 10);
};

export const getShort = async (channel_id: string, limit: number): Promise<VideoSrc[]> => {
  const corsProxy = "https://corsproxy.io/?";
  const feedUrl = corsProxy + encodeURIComponent("https://www.youtube.com/feeds/videos.xml?channel_id=" + channel_id);

  const res = await fetch(feedUrl);
  const xmlText = await res.text();
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
