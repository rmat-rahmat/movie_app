/**
 * movieApi.ts
 * 
 * This module provides API client functions and TypeScript types for interacting with
 * the Seefu TV backend movie/series/episode APIs. It includes:
 * 
 * - Category, dashboard, and video/series/episode CRUD operations
 * - Caching helpers for categories and dashboard data
 * - Search, recommendation, and playback URL fetchers
 * - User actions: watch history, favorites, likes, shares
 * - Edit/update/delete endpoints for movies, series, and episodes
 * 
 * Conventions:
 * - All API calls are made using axios.
 * - Category and dashboard data are cached in-memory and in localStorage.
 * - Types are imported from `@/types/Dashboard` where possible.
 * - Use the exported helpers in UI components for all server interactions.
 * 
 * See .github/copilot-instructions.md for project conventions.
 * 
 * To extend:
 * - Add new API endpoints as async functions.
 * - Add new types to `@/types/Dashboard` if needed.
 * - Use debug logging and error handling patterns as shown.
 */

import { transformEpisodesToSlides } from "@/utils/transformToSlides";
import { parseStringPromise } from 'xml2js';
import axios from 'axios';
import { BASE_URL } from '../config';
import type { VideoSrc } from "@/types/VideoSrc";
import type { 
  DashboardApiResponse, 
  DashboardItem, 
  CategoryItem, 
  VideosApiResponse, 
  SearchApiResponse, 
  RecommendationApiResponse, 
  BannerVO, 
  ContentVO, 
  ContentListResponse, 
  EpisodeVO, 
  PageResultEpisodeVO,
  HomeSectionVO,
  SectionContentRequest,
  SectionContentVO
  , Share, ShareDto, ShareResponse
} from '@/types/Dashboard';
import { parseJsonFile } from "next/dist/build/load-jsconfig";
import i18next, { t } from 'i18next';
import { url } from "inspector";

// Interface for content items from API responses
interface ContentApiItem {
  id: string;
  title?: string;
  description?: string;
  categoryId?: string;
  year?: number;
  region?: string;
  language?: string;
  director?: string;
  actors?: string[] | string;
  rating?: number;
  tags?: string[];
  createTime?: string;
  updateTime?: string;
  imageQuality?: {
    url?: string;
    customCoverUrl?: string;
    p144?: string;
    p360?: string;
    p720?: string;
  };
  coverUrl?: string;
  isSeries?: boolean;
  seriesId?: string;
  seasonNumber?: number;
  totalEpisodes?: number;
  isCompleted?: boolean;
}

/**
 * buildCategoryTree
 * Converts a flat list of categories into a hierarchical tree structure.
 * Used for category dropdowns and navigation.
 */
function buildCategoryTree(flat: CategoryItem[] = []): CategoryItem[] {
  const map = new Map<string, CategoryItem & { children?: CategoryItem[] }>();
  // normalize and populate map
  flat.forEach((c) => {
    map.set(String(c.id), { ...c, children: [] });
  });

  const roots: (CategoryItem & { children?: CategoryItem[] })[] = [];

  map.forEach((node) => {
    const parentId = node.parentId;
    if (parentId && parentId !== '0' && map.has(String(parentId))) {
      const parent = map.get(String(parentId))!;
      parent.children = parent.children || [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Optional: sort roots and children by sortWeight when present
  const sortFn = (a: CategoryItem & { sortWeight?: string | number | undefined }, b: CategoryItem & { sortWeight?: string | number | undefined }) => {
    const na = Number(a?.sortWeight ?? 0);
    const nb = Number(b?.sortWeight ?? 0);
    return na - nb;
  };

  const sortRecursive = (list: (CategoryItem & { children?: CategoryItem[] })[]) => {
    list.sort(sortFn);
    list.forEach((it) => {
      if (Array.isArray(it.children) && it.children.length) sortRecursive(it.children as (CategoryItem & { children?: CategoryItem[] })[]);
    });
  };

  sortRecursive(roots as (CategoryItem & { children?: CategoryItem[] })[]);

  return roots as CategoryItem[];
}

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

/**
 * getMovies
 * Fetches a list of random movies from a mock API and maps them to VideoSrc.
 */
export const getMovies = async (number: number): Promise<VideoSrc[]> => {
  const res = await axios.get(`https://jsonfakery.com/movies/random/${number}`);
  const movies = res.data;
  // Convert each movie to VideoSrc format
  return movies.map(movieToVideoSrc);
};

/**
 * getNowPlayingMovies, getPopularMovie, getTopRatedMovies, getUpcomingMovies
 * Fetches movies from TMDB API for different categories and maps to VideoSrc.
 */
export const getNowPlayingMovies = async (_number: number): Promise<VideoSrc[]> => {
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
    return movies?.results.map(movieToVideoSrc);
  } catch (error) {
    console.error('Error fetching now playing movies:', error);
    return [];
  }
};

export const getPopularMovie = async (_number: number): Promise<VideoSrc[]> => {
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

export const getTopRatedMovies = async (_number: number): Promise<VideoSrc[]> => {
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
export const getUpcomingMovies = async (_number: number): Promise<VideoSrc[]> => {
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

/**
 * getSeries
 * Fetches TV series episodes from TVMaze API and transforms them for the dashboard.
 */
export const getSeries = async (country: string) => {
  const res = await axios.get(`https://api.tvmaze.com/schedule?country=${country}`);
  const episodes = res.data;
  return transformEpisodesToSlides(episodes, 10);
};


/**
 * getDashboard
 * Fetches and caches the dashboard data (featured content, categories, sections).
 * Uses localStorage and in-memory cache for performance.
 */
let inMemoryDashboardCache: { timestamp: number; payload: DashboardApiResponse } | null = null;
let inMemoryCategoriesCache: { timestamp: number; categories: CategoryItem[] } | null = null;

export const getDashboard = async (force = false): Promise<DashboardApiResponse | null> => {
  const CACHE_KEY = 'seefu_dashboard_cache_v1';
  const REFRESH_TS_KEY = 'seefu_dashboard_refresh_timestamps_v1';
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  const now = Date.now();

  const isWindow = typeof window !== 'undefined';

  const readCache = (): { timestamp: number; payload: DashboardApiResponse } | null => {
    if (inMemoryDashboardCache) return inMemoryDashboardCache;
    if (!isWindow) return null;
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { timestamp: number; payload: DashboardApiResponse };
      // basic validation
      if (!parsed || !parsed.timestamp || !parsed.payload) return null;
      // populate in-memory for this runtime
      // If categories exist, ensure they are transformed into a hierarchical tree
      const flatCats = parsed.payload?.data?.categories || [];
      const catsTree = Array.isArray(flatCats) ? buildCategoryTree(flatCats as CategoryItem[]) : [];
      parsed.payload = {
        ...parsed.payload,
        data: {
          ...parsed.payload.data,
          categories: catsTree,
        },
      };
      inMemoryDashboardCache = parsed;
      // also populate categories cache if available
      inMemoryCategoriesCache = { timestamp: parsed.timestamp, categories: catsTree };
      return parsed;
    } catch (_e) {
      // malformed json or access denied
      return null;
    }
  };

  // Detect rapid refreshes (multiple page loads within short period) using sessionStorage
  // We keep a list of timestamps (ms) and count entries within the last 5 seconds.
  let forceRefresh = false;
  if (isWindow) {
    try {
      const raw = window.sessionStorage.getItem(REFRESH_TS_KEY);
      const arr: number[] = raw ? (JSON.parse(raw) as number[]) : [];
      // add current load
      arr.push(now);
      // keep only last 5 seconds
      const windowStart = now - 5_000;
      const recent = arr.filter((t) => t >= windowStart);
      // persist back
      window.sessionStorage.setItem(REFRESH_TS_KEY, JSON.stringify(recent));
      // force refresh when page was refreshed more than 3 times within 5 seconds
      if (recent.length > 3) forceRefresh = true;
    } catch (_e) {
      // ignore sessionStorage errors
    }
  }

  const cache = readCache();
  // If cache exists and is fresh, return it — unless it has no categories (empty/missing),
  // in which case we consider it stale and fetch fresh data from server.
  const cacheHasCategories = !!(cache && cache.payload && Array.isArray(cache.payload.data?.categories) && cache.payload.data!.categories.length > 0);
  // if caller explicitly requests a force refresh, skip returning cached payload
  if (!force && !forceRefresh && cache && now - cache.timestamp < TWO_HOURS_MS && cacheHasCategories) {
    return cache.payload;
  }

  // fetch fresh data
  try {
    const url = `${BASE_URL}/api-movie/v1/home/dashboard`;
    const res = await axios.get<DashboardApiResponse>(url);
    const payload = res.data as DashboardApiResponse;

    // ensure categories are stored as hierarchical tree

    const flatCats = await getCategoryList() || payload?.data?.categories || [];
    const catsTree = Array.isArray(flatCats) ? buildCategoryTree(flatCats as CategoryItem[]) : [];
    // create a new payload object with hierarchical categories
    const newPayload = { ...payload, data: { ...payload.data, categories: catsTree } } as DashboardApiResponse;

    const record = { timestamp: now, payload: newPayload };
    // update in-memory
    inMemoryDashboardCache = record;
    // update categories cache in-memory
    inMemoryCategoriesCache = { timestamp: now, categories: catsTree };
    // update localStorage when available
    if (isWindow) {
      try {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(record));
        // also persist categories (hierarchical tree) separately for quick access
        const CATEGORIES_KEY = 'seefu_dashboard_categories_v1';
        try {
          window.localStorage.setItem(CATEGORIES_KEY, JSON.stringify(catsTree));
        } catch (_e) {
          // ignore category storage errors
        }
      } catch (_e) {
        // ignore quota/permission errors
      }
    }

    return newPayload;
  } catch (err) {
    console.error('Failed to fetch dashboard', err);
    // fallback to cache if available
    if (cache) return cache.payload;
    return null;
  }
};

/**
 * getCachedCategories
 * Returns cached categories from memory or localStorage, or fetches from API if not cached.
 */
export const getCachedCategories = async (): Promise<CategoryItem[] | null> => {
  if (inMemoryCategoriesCache) return inMemoryCategoriesCache.categories;
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('seefu_dashboard_categories_v1');
    if (!raw) return await getCategoryTree() || null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    // If stored format is flat (items have parentId and no children), convert to tree
    const first = parsed[0];
    const isTree = first && Object.prototype.hasOwnProperty.call(first, 'children');
    const catsTree = isTree ? (parsed as CategoryItem[]) : buildCategoryTree(parsed as CategoryItem[]);
    inMemoryCategoriesCache = { timestamp: Date.now(), categories: catsTree };
    return catsTree;
  } catch (_e) {
    return null;
  }
};

/**
 * getCategoryTree
 * Fetches the flat category list and builds a hierarchical tree.
 */
export const getCategoryTree = async (): Promise<CategoryItem[] | null> => {
  const cats = await getCategoryList();
  if (!cats || !Array.isArray(cats)) return null;
  return buildCategoryTree(cats);
}

/**
 * getCategoryList
 * Fetches the flat list of categories from the backend.
 */
export const getCategoryList = async (): Promise<CategoryItem[] | null> => {
  const lang = (i18next && i18next.language) ? i18next.language : (typeof window !== 'undefined' && navigator.language ? navigator.language.split('-')[0] : 'en');
  const url = `${BASE_URL}/api-movie/v1/category/list?lang=${encodeURIComponent(lang)}`;
  try {
    const response = await axios.get(url);
    const categories = response.data?.data || [];
    return Array.isArray(categories) ? categories : null;
  } catch (error) {
    console.error('Failed to fetch category list:', error);
    return null;
  }
}

/**
 * mapFeaturedToVideoSrc
 * Maps featured dashboard content to VideoSrc[] for UI display.
 */
export const mapFeaturedToVideoSrc = (payload: DashboardApiResponse | null): VideoSrc[] => {
  const items = payload?.data?.featuredContent || [];
  return items.map((it: DashboardItem) => {
    const id = it.id;
    const title = it.title || '';
    const description = it.description || '';
    const backdrop_image = it.coverUrl || '';
    const potrait_image = it.coverUrl || '';
    const release_date = it.createTime ? String(it.createTime).split('T')[0] : (it.year ? String(it.year) : undefined);
    const vote_average = typeof it.rating === 'number' ? it.rating : (it.rating ? Number(it.rating) : undefined);
    const popularity = typeof it.fileSize === 'number' ? it.fileSize : undefined;
    const casts = Array.isArray(it.actors)
      ? it.actors.map((name: string, idx: number) => ({ id: `${id}_cast_${idx}`, name, character: undefined, profile_image: undefined }))
      : [];

    return {
      id,
      title,
      description,
      backdrop_image,
      potrait_image,
      release_date,
      vote_average,
      vote_count: undefined,
      popularity,
      casts,
    } as VideoSrc;
  });
};

/**
 * getCategoryVideos
 * Fetches paginated videos for a given category.
 */
export async function getCategoryVideos(categoryId: string, page: number = 1, size: number = 20,type:string="720",sortType:string="0"): Promise<VideosApiResponse | null> {
  try {
    const response = await axios.get(`${BASE_URL}/api-movie/v1/category/videos/${categoryId}`, {
      params: { page, size ,type,sortType},
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data as VideosApiResponse;
  } catch (e) {
    console.error('Failed to fetch category videos:', e);
    return null;
  }
}

/**
 * getGridVideos
 * Fetches paginated videos from a dynamic API endpoint.
 */
export async function getGridVideos(src: string, page: number = 1, size: number = 21): Promise<VideosApiResponse | null> {
  try {
    // normalize src to avoid accidental double slashes when src starts with '/'
    const normalizedSrc = src.startsWith('/') ? src.slice(1) : src;
    const finalUrl = `${BASE_URL}/${normalizedSrc}`;
    console.log(`getGridVideos -> requesting: ${finalUrl}`);
    const response = await axios.get(finalUrl, {
      params: { page, size },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data as VideosApiResponse;
  } catch (e) {
    console.error('Failed to fetch category videos:', e);
    return null;
  }
}

/**
 * searchVideos
 * Searches for videos by name and optional category, paginated.
 */
export async function searchVideos(
  searchName: string,
  categoryId: string = "",
  page: number = 1,
  size: number = 10
): Promise<SearchApiResponse | null> {
  try {
    const response = await axios.post(`${BASE_URL}/api-movie/v1/search/searchVideo`, {
      searchName,
      categoryId,
      page,
      size
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
    });

    return response.data as SearchApiResponse;
  } catch (e) {
    console.error('Failed to search videos:', e);
    return null;
  }
}

/**
 * getSearchSuggestions
 * Fetches search keyword suggestions for autocomplete.
 */
export async function getSearchSuggestions(prefix: string = '', limit: number = 10): Promise<string[] | null> {
  try {
    const url = `${BASE_URL}/api-movie/v1/search/suggestions`;
    const response = await axios.get(url, {
      params: { prefix, limit },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const data = response.data;
    if (data && data.success && Array.isArray(data.data)) {
      return data.data as string[];
    }
    return Array.isArray(data?.data) ? data.data : [];
  } catch (err) {
    console.error('Failed to fetch search suggestions', err);
    return null;
  }
}

/**
 * getHotKeywords
 * Fetches trending/hot search keywords.
 */
export async function getHotKeywords(limit: number = 10): Promise<string[] | null> {
  try {
    const url = `${BASE_URL}/api-movie/v1/search/hot-keywords`;
    const response = await axios.get(url, {
      params: { limit },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const data = response.data;
    if (data && data.success && Array.isArray(data.data)) {
      return data.data as string[];
    }
    return Array.isArray(data?.data) ? data.data : [];
  } catch (err) {
    console.error('Failed to fetch hot keywords', err);
    return null;
  }
}


/**
 * getSearchHistory
 * Fetches the user's recent search history.
 */
export async function getSearchHistory(limit: number = 10): Promise<string[] | null> {
  try {
    const url = `${BASE_URL}/api-movie/v1/search/recent`;
    const response = await axios.get(url, {
      params: { limit },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const data = response.data;
    if (data && data.success && Array.isArray(data.data)) {
      return data.data as string[];
    }
    return Array.isArray(data?.data) ? data.data : [];
  } catch (err) {
    console.error('Failed to fetch search history', err);
    return null;
  }
}

/**
 * getPlayMain
 * Fetches the main m3u8 playlist for a video upload.
 */
export async function getPlayMain(uploadId: string, expires: number | string = 100000, signature: string = '2', apiKey?: string): Promise<string | null> {
  try {
    const url = `${BASE_URL}/api-net/play/${uploadId}/expires=${expires}&signature=${signature}`;
    const params: Record<string, string> = {};
    if (expires !== undefined && expires !== null) params.expires = String(expires);
    if (signature !== undefined && signature !== null) params.signature = String(signature);
    const headers: Record<string, string> = {};
    if (apiKey) headers['api-key'] = apiKey;
    const query = new URLSearchParams(params).toString();
    const requestUrl = query ? `${url}?${query}` : url;
    const response = await fetch(requestUrl, { method: 'GET', headers });
    if (!response.ok) throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    const res = { data: await response.text() };
    return res.data as string;
  } catch (err) {
    console.error('Failed to fetch play main for', uploadId, err);
    return null;
  }
}

/**
 * getPlayVariant
 * Fetches a specific quality variant m3u8 playlist.
 */
export async function getPlayVariant(uploadId: string, type: string, apiKey?: string): Promise<string | null> {
  try {
    // const url = `${BASE_URL}/api-net/play/${uploadId}/${type}.m3u8`;
    const url = `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`;
    const headers: Record<string, string> = {};
    if (apiKey) headers['api-key'] = apiKey;
    const res = await axios.get(url, { headers, responseType: 'text' });
    return res.data as string;
  } catch (err) {
    console.error('Failed to fetch play variant for', uploadId, type, err);
    return null;
  }
}

/**
 * getPlaybackUrl
 * Fetches the playback URL for a specific video quality.
 */
export async function getPlaybackUrl(uploadId: string, quality: '144p' | '360p' | '480p' | '720p' | '1080p', apiKey?: string): Promise<string | null> {
  try {
    const url = `${BASE_URL}/api-net/play/${uploadId}/${quality}.m3u8`;
    // const url = `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`;
    const headers: Record<string, string> = {};
    if (apiKey) headers['api-key'] = apiKey;

    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }
    // console.log(response)
    const text = await response.text();
    try {
      const parsed = await JSON.parse(text);
      console.log('getPlaybackUrl -> parsed JSON response:', parsed);
      return null;
    } catch (parseErr) {
      // console.error('Failed to parse JSON:', parseErr);
    }
    // console.log('getPlaybackUrl -> fetched URL:', url, 'response length:', text);
    return text;
  } catch (err) {
    console.error('Failed to fetch playback URL for', uploadId, quality, err);
    return null;
  }
}

/**
 * getContentDetail
 * Fetches detailed information for a video or series, including episodes.
 */
export async function getContentDetail(contentId: string,isOwn?:boolean): Promise<import('@/types/Dashboard').VideoDetails | null> {
  try {
    let url = `${BASE_URL}/api-movie/v1/home/contents/${contentId}/detail`;
    if(isOwn){
      url = `${BASE_URL}/api-movie/v1/home/my-uploads/${contentId}/detail`;
    }
    const res = await axios.get(url, {
      headers: { 'Accept': '*/*' }
    });
    const json = res.data;
    console.log('Fetched content detail for', contentId, json);
    if (json && json.data) {
      return json.data as import('@/types/Dashboard').VideoDetails;
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch content detail for', contentId, err);
    return null;
  }
}

/**
 * getVideoRecommendations
 * Fetches recommended videos based on a given video ID.
 */
export async function getVideoRecommendations(videoId: string, page: number = 1, size: number = 20): Promise<RecommendationApiResponse | null> {
  try {
    const response = await axios.get(`${BASE_URL}/api-movie/v1/home/videoRecommendationList`, {
      params: {
        videoId,
        page,
        size: Math.min(size, 100) // Ensure size doesn't exceed 100
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = response.data;
    
    if (data?.success && data?.data) {
      return data as RecommendationApiResponse;
    }
    
    return null;
  } catch (err) {
    console.error('Failed to fetch video recommendations for', videoId, err);
    return null;
  }
}

// Record watch history
export interface WatchHistoryDto {
  mediaId: string;
  episodeId: string;
  watchTime: number; // seconds watched this session
  duration?: number; // total duration in seconds
  progress: number; // current playhead in seconds
  source?: string;
}

/**
 * recordWatchHistory
 * Records the user's watch progress for a video or episode.
 */
export async function recordWatchHistory(dto: WatchHistoryDto): Promise<boolean> {
  try {
    const url = `${BASE_URL}/api-movie/v1/watch-history/record`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : undefined;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await axios.post(url, dto, { headers });
    const data = res.data;
    return !!(data && data.success);
  } catch (err) {
    console.error('Failed to record watch history', err);
    return false;
  }
}

/**
 * getLastWatchPosition
 * Fetches the last watch position for a video/episode for resume playback.
 */
export async function getLastWatchPosition(mediaId: string, episodeId: string): Promise<number | null> {
  try {
    const url = `${BASE_URL}/api-movie/v1/watch-history/last-position`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : undefined;
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await axios.get(url, {
      params: { mediaId, episodeId },
      headers,
    });
    const data = res.data;
    if (data && data.success && typeof data.data === 'number') {
      return Number(data.data);
    }
    return null;
  } catch (err) {
    console.log('Failed to fetch last watch position', err);
    return null;
  }
}

/**
 * getWatchHistoryList
 * Fetches the user's watch history as a paginated list.
 */
export async function getWatchHistoryList(page: number = 0, size: number = 12,type: string='720'): Promise<DashboardItem[] | null> {
  try {
    const url = `${BASE_URL}/api-movie/v1/watch-history/list`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : undefined;
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await axios.get(url, {
      params: { page, size ,type},
      headers,
    });
    const data = res.data;
      console.log("Watch history contents:", data);
    if (data && data.success && data.data && Array.isArray(data.data.records)) {

      const contents = data.data.records as unknown[];
      // Map API content shape to DashboardItem minimal fields
      const list: DashboardItem[] = contents.map((it) => {
        const record = it as Record<string, unknown>;
        const id = String(record.id ?? record.mediaId ?? '');
        const title = String(record.title ?? record.original_title ?? '');
        const description = typeof record.description === 'string' ? String(record.description) : (typeof record.overview === 'string' ? String(record.overview) : undefined);
        const coverUrl = typeof record.coverUrl === 'string' ? String(record.coverUrl) : (typeof record.poster_path === 'string' ? String(record.poster_path) : undefined);
        const createTime = record.createTime as string | undefined;
        const year = record.year as number | undefined;
        const rating = typeof record.rating === 'number' ? record.rating as number : (record.rating ? Number(record.rating as unknown) : undefined);
        const fileSize = typeof record.fileSize === 'number' ? record.fileSize as number : undefined;
        const actorsArr = Array.isArray(record.actors) ? (record.actors as unknown[]).map(a => String(a)) : undefined;

        return {
          ...record,
          id,
          title,
          description,
          coverUrl,
          createTime,
          year,
          rating,
          fileSize,
          actors: actorsArr,
        } as DashboardItem;
      });
      return list;
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch watch history list', err);
    return null;
  }
}

/**
 * clearWatchHistory
 * Clears all watch history for the current user.
 */
export async function clearWatchHistory(): Promise<boolean> {
  try {
    const url = `${BASE_URL}/api-movie/v1/watch-history/clear`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : undefined;
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await axios.delete(url, { headers });
    const data = res.data;
    return !!(data && data.success);
  } catch (err) {
    console.error('Failed to clear watch history', err);
    return false;
  }
}

/**
 * getUserUploadedVideos
 * Fetches the user's uploaded videos (movies and series).
 */
export async function getUserUploadedVideos(page: number = 1, size: number = 12, type: string = '720'): Promise<DashboardItem[] | null> {
  try {
    const url = `${BASE_URL}/api-movie/v1/my-videos/uploads`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : undefined;
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const params: Record<string, string | number> = { page, size, type };
    const res = await axios.get(url, { params, headers });
    const data = res.data;

    if (data && data.success && data.data && Array.isArray(data.data.contents)) {
      const list: DashboardItem[] = data.data.contents.map((item: ContentVO) => {
        // Handle actors field which can be string[] or need parsing
        let actorsArr: string[] = [];
        if (Array.isArray(item.actors)) {
          actorsArr = item.actors;
        }

        return {
          id: item.id || '',
          title: item.title || '',
          description: item.description || '',
          categoryId: item.categoryId || '',
          year: item.year,
          region: item.region,
          language: item.language,
          director: item.director,
          actors: actorsArr,
          rating: item.rating,
          tags: Array.isArray(item.tags) ? item.tags : [],
          createTime: item.createTime,
          updateTime: item.updateTime,
          imageQuality: item.imageQuality || null,
          coverUrl: item.coverUrl,
          isSeries: item.isSeries,
          seriesId: item.seriesId,
          seasonNumber: item.seasonNumber,
          totalEpisodes: item.totalEpisodes,
          isCompleted: item.isCompleted,
          status: item.status,
        } as DashboardItem;
      });
      return list;
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch user uploaded videos', err);
    return null;
  }
}

/**
 * getSeriesEpisodes
 * Fetches episodes for a given series, paginated.
 */
export async function getSeriesEpisodes(
  seriesId: string,
  page: number = 1,
  size: number = 20,
  type: string = '720'
): Promise<{ episodes: EpisodeVO[]; pageInfo: PageResultEpisodeVO } | null> {
  try {
    const url = `${BASE_URL}/api-movie/v1/my-videos/${encodeURIComponent(seriesId)}/episodes`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : undefined;
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const params: Record<string, string | number> = { page, size, type };
    const res = await axios.get(url, { params, headers });
    const data = res.data;

    if (data && data.success && data.data) {
      return {
        episodes: data.data.items || [],
        pageInfo: {
          page: data.data.page || page,
          size: data.data.size || size,
          total: data.data.total || 0,
          totalPages: data.data.totalPages || 0,
          items: data.data.items || [],
        },
      };
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch series episodes', err);
    return null;
  }
}

/**
 * checkFavorite
 * Checks if a video is favorited by the current user.
 */
export async function checkFavorite(videoId: string): Promise<boolean> {
  try {
    const url = `${BASE_URL}/api-movie/v1/favorites/check`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : undefined;
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const params: Record<string, string> = { videoId };
    const res = await axios.get(url, { params, headers });
    const data = res.data;

    // data.data is boolean: true if favorited, false otherwise
    return !!(data && data.success && data.data);
  } catch (err) {
    console.error('Failed to check favorite status', err);
    return false;
  }
}

/**
 * toggleFavorite
 * Toggles the favorite status for a video.
 */
export async function toggleFavorite(videoId: string): Promise<{ success: boolean; isFavorited: boolean; message?: string }> {
  try {
    const url = `${BASE_URL}/api-movie/v1/favorites/toggle`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : undefined;
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const params = new URLSearchParams();
    params.append('videoId', videoId);

    const res = await axios.post(url, params, { headers });
    const data = res.data;

    if (data && data.success) {
      // data.data is boolean: true means now favorited, false means unfavorited
      return { success: true, isFavorited: !!data.data, message: data.message };
    }
    return { success: false, isFavorited: false, message: data.message || 'Failed to toggle favorite' };
  } catch (err) {
    console.error('Failed to toggle favorite', err);
    const message = axios.isAxiosError(err) && err.response?.data?.message 
      ? err.response.data.message 
      : 'An error occurred while toggling favorite';
    return { success: false, isFavorited: false, message };
  }
}

/**
 * getFavoritesList
 * Fetches the user's list of favorited videos.
 */
export async function getFavoritesList(page: number = 0, size: number = 20, type: string = '720'): Promise<DashboardItem[] | null> {
  try {
    const url = `${BASE_URL}/api-movie/v1/favorites/list`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : undefined;
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const params: Record<string, string | number> = { page, size, type };
    const res = await axios.get(url, { params, headers });
    const responseData = res.data;
    console.log("Favorites list response data:", responseData);
    if (responseData && responseData.success && responseData.data) {
      const contents = responseData.data.contents || [];
      const list = contents.map((item: ContentApiItem) => {
        return {
          id: item.id,
          title: item.title || 'Untitled',
          description: item.description || '',
          coverImage: item.imageQuality?.url || item.coverUrl || '/fallback_poster/sample_poster.png',
          rating: item.rating,
          releaseDate: item.year ? String(item.year) : undefined,
          category: item.categoryId,
          isSeries: item.isSeries || false,
          seriesId: item.seriesId,
          seasonNumber: item.seasonNumber,
          totalEpisodes: item.totalEpisodes,
          isCompleted: item.isCompleted,
          director: item.director,
          actors: Array.isArray(item.actors) ? item.actors : [],
          language: item.language,
          region: item.region,
          tags: Array.isArray(item.tags) ? item.tags : [],
          createTime: item.createTime,
          updateTime: item.updateTime,
          imageQuality: item.imageQuality || {},
        } as DashboardItem;
      });
      return list;
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch favorites list', err);
    return null;
  }
}

// ============================================
// Video Like API Functions
// ============================================

/**
 * toggleVideoLike
 * Toggles the like status for a video.
 */
export async function toggleVideoLike(videoId: string): Promise<{ success: boolean; isLiked: boolean; message?: string }> {
  try {
    const url = `${BASE_URL}/api-movie/v1/like/toggleLike`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : undefined;
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const params = new URLSearchParams();
    params.append('contentId', videoId);
    params.append('contentType', "video");

    const res = await axios.post(url, params, { headers });
    const data = res.data;

    if (data && data.success) {
      // data.data is boolean: true means now liked, false means unliked
      return { success: true, isLiked: !!data.data, message: data.message };
    }
    return { success: false, isLiked: false, message: data.message || 'Failed to toggle like' };
  } catch (err) {
    console.error('Failed to toggle like', err);
    const message = axios.isAxiosError(err) && err.response?.data?.message 
      ? err.response.data.message 
      : 'An error occurred while toggling like';
    return { success: false, isLiked: false, message };
  }
}

/**
 * checkVideoLike
 * Checks if a video is liked by the current user.
 */
export async function checkVideoLike(videoId: string): Promise<boolean> {
  try {
    const url = `${BASE_URL}/api-movie/v1/like/check`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : undefined;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const params = new URLSearchParams();
    params.append('videoId', videoId);

    const res = await axios.get(url, { params, headers });
    const data = res.data;

    return data && data.success && data.data === true;
  } catch (err) {
    console.error('Failed to check like status', err);
    return false;
  }
}

/**
 * getVideoLikeList
 * Fetches the user's list of liked videos.
 */
export async function getVideoLikeList(page: number = 0, size: number = 20, type: string = '720'): Promise<DashboardItem[] | null> {
  try {
    const url = `${BASE_URL}/api-movie/v1/like/list`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : undefined;
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const params: Record<string, string | number> = { page, size, type };
    const res = await axios.get(url, { params, headers });
    const responseData = res.data;

    if (responseData && responseData.success && responseData.data) {
      const contents = responseData.data.contents || [];
      const list = contents.map((item: ContentApiItem) => {
        return {
          id: item.id,
          title: item.title || 'Untitled',
          description: item.description || '',
          coverImage: item.imageQuality?.url || item.coverUrl || '/fallback_poster/sample_poster.png',
          rating: item.rating,
          releaseDate: item.year ? String(item.year) : undefined,
          category: item.categoryId,
          isSeries: item.isSeries || false,
          seriesId: item.seriesId,
          seasonNumber: item.seasonNumber,
          totalEpisodes: item.totalEpisodes,
          isCompleted: item.isCompleted,
          director: item.director,
          actors: Array.isArray(item.actors) ? item.actors : [],
          language: item.language,
          region: item.region,
          tags: Array.isArray(item.tags) ? item.tags : [],
          createTime: item.createTime,
          updateTime: item.updateTime,
          imageQuality: item.imageQuality || {},
        } as DashboardItem;
      });
      return list;
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch liked videos list', err);
    return null;
  }
}

/**
 * getSharesList
 * Fetches the user's shared videos/episodes.
 */
export async function getSharesList(
  page: number = 1, 
  size: number = 20, 
  contentId?: string,
  contentType?: 'video' | 'episode',
  imageType: string = '720',
  platform?: string
): Promise<DashboardItem[] | null> {
  try {
    const url = `${BASE_URL}/api-movie/v1/shares/list`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : undefined;
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const params: Record<string, string | number> = { page, size, imageType };
    if (contentId) params.contentId = contentId;
    if (contentType) params.contentType = contentType;
    if (platform) params.platform = platform;

    const res = await axios.get(url, { params, headers });
    const data = res.data;

    if (data && data.success && data.data && Array.isArray(data.data.contents)) {
      const list: DashboardItem[] = data.data.contents.map((item: ContentVO) => {
        // Handle actors field
        let actorsArr: string[] = [];
        if (Array.isArray(item.actors)) {
          actorsArr = item.actors;
        }

        return {
          id: item.id || '',
          title: item.title || '',
          description: item.description || '',
          categoryId: item.categoryId || '',
          year: item.year,
          region: item.region,
          language: item.language,
          director: item.director,
          actors: actorsArr,
          rating: item.rating,
          tags: Array.isArray(item.tags) ? item.tags : [],
          createTime: item.createTime,
          updateTime: item.updateTime,
          imageQuality: item.imageQuality || null,
          coverUrl: item.coverUrl,
          isSeries: item.isSeries,
          seriesId: item.seriesId,
          seasonNumber: item.seasonNumber,
          episodeNumber: item.episodeNumber,
          totalEpisodes: item.totalEpisodes,
          isCompleted: item.isCompleted,
          status: item.status,
          fileName: item.fileName,
          fileSize: item.fileSize,
          createBy: item.createBy,
        } as DashboardItem;
      });
      return list;
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch shares list', err);
    return null;
  }
}

/**
 * createShare
 * Creates a new share record for a video or episode.
 */
export async function createShare(shareDto: ShareDto): Promise<{ success: boolean; message?: string; data?: Share | null }> {
  try {
    const url = `${BASE_URL}/api-movie/v1/shares/create`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : undefined;
    
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const payload = {
      targetId: shareDto.targetId,
      contentType: shareDto.contentType || 'video',
      type: shareDto.type,
      platform: shareDto.platform
    };

    const res = await axios.post(url, payload, { headers });
    const data = res.data;

    if (data && data.success) {
      return { success: true, data: data.data as Share };
    }
    
    return { success: false, message: data.message || 'Failed to create share record' };
  } catch (err) {
    console.error('Failed to create share record', err);
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'Failed to create share record' 
    };
  }
}

/**
 * getDirectorList
 * Fetches a list of director names for suggestions/autocomplete.
 */
export async function getDirectorList(name: string = '', gender?: number, page: number = 0, size: number = 50): Promise<string[] | null> {
  try {
    const url = `${BASE_URL}/api-movie/v1/director/list`;
    const params: Record<string, string | number | undefined> = { page, size };
    if (name) params.name = name;
    if (typeof gender === 'number') params.gender = gender;
    const res = await axios.get(url, { params, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    const data = res.data;
    if (data && data.success && data.data && Array.isArray(data.data.records)) {
      return (data.data.records as unknown[]).map((r) => String((r as Record<string, unknown>).name ?? ''));
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch director list', err);
    return null;
  }
}

/**
 * getActorList
 * Fetches a list of actor names for suggestions/autocomplete.
 */
export async function getActorList(name: string = '', gender?: number, page: number = 0, size: number = 50): Promise<string[] | null> {
  try {
    const url = `${BASE_URL}/api-movie/v1/actor/list`;
    const params: Record<string, string | number | undefined> = { page, size };
    if (name) params.name = name;
    if (typeof gender === 'number') params.gender = gender;
    const res = await axios.get(url, { params, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    const data = res.data;
    if (data && data.success && data.data && Array.isArray(data.data.records)) {
      return (data.data.records as unknown[]).map((r) => String((r as Record<string, unknown>).name ?? ''));
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch actor list', err);
    return null;
  }
}

/**
 * getRegionList
 * Fetches a list of region names for suggestions/autocomplete.
 */
export async function getRegionList(name: string = '', page: number = 0, size: number = 200): Promise<string[] | null> {
  try {
    const url = `${BASE_URL}/api-movie/v1/region/list`;
    const params: Record<string, string | number | undefined> = { page, size };
    if (name) params.name = name;
    const res = await axios.get(url, { params, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    const data = res.data;
    if (data && data.success && data.data && Array.isArray(data.data.records)) {
      return (data.data.records as unknown[]).map((r) => String((r as Record<string, unknown>).name ?? ''));
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch region list', err);
    return null;
  }
}

/**
 * getLanguageList
 * Fetches a list of language names for suggestions/autocomplete.
 */
export async function getLanguageList(name: string = '', code: string = '', page: number = 1, size: number = 200): Promise<string[] | null> {
  try {
    const url = `${BASE_URL}/api-movie/v1/language/page`;
    const params: Record<string, string | number | undefined> = { page, size };
    if (name) params.name = name;
    if (code) params.code = code;
    const res = await axios.get(url, { params, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    const data = res.data;
    if (data && data.success && Array.isArray(data.data)) {
      return data.data.map((item: { id: string; code: string; name: string }) => item.name);
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch language list', err);
    return null;
  }
}

// Types for reset password API
export interface ResetPasswordRequest {
  email: string;
  emailCaptcha: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message?: string;
  errorCode?: string;
  timestamp?: number;
  clientError?: boolean;
  serverError?: boolean;
}

export async function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  try {
    const result =await axios.post(`${BASE_URL}/api-movie/v1/auth/resetPassword`, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!result.data || !result.data.success) {
      const errorCode = result.data?.errorCode;
      const message =
        errorCode === 'ERR_EMAIL_CAPTCHA_ERROR_OR_USER_NOT_EXISTS'
          ? t('common.ERR_EMAIL_CAPTCHA_ERROR_OR_USER_NOT_EXISTS')
          : t(errorCode || 'An error occurred');

      return {
        success: false,
        message,
        errorCode,
        timestamp: result.data?.timestamp,
        clientError: result.data?.clientError,
        serverError: result.data?.serverError
      };
    }
    return {
      success: true
    };
  } catch (err: unknown) {
    type ErrorResponse = {
      success?: boolean;
      message?: string;
      errorCode?: string;
      timestamp?: number;
      clientError?: boolean;
      serverError?: boolean;
    };

    // default fallback error response
    let errorResponse: ErrorResponse = {
      success: false,
      message: 'An unexpected error occurred',
      errorCode: 'UNKNOWN_ERROR',
      clientError: true
    };

    // If this is an Axios error with a response payload, merge it into the fallback
    if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object' && err.response.data !== null) {
      errorResponse = { ...errorResponse, ...(err.response.data as ErrorResponse) };
    }

    return {
      success: false,
      message: errorResponse.message,
      errorCode: errorResponse.errorCode,
      timestamp: errorResponse.timestamp,
      clientError: errorResponse.clientError,
      serverError: errorResponse.serverError
    };
  }
}

/**
 * getBannerList
 * Fetches the list of banners for the home page.
 */
export const getBannerList = async (type: number = 1, quality: string = '720'): Promise<BannerVO[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/api-movie/v1/banner/list`, {
      params: { type, quality }
    });

    if (response.data?.success && Array.isArray(response.data?.data)) {
      return response.data.data as BannerVO[];
    }

    console.warn('Banner list returned empty or invalid data');
    return [];
  } catch (error) {
    console.error('Error fetching banner list:', error);
    return [];
  }
};

/**
 * getHomeSections
 * Fetches home page sections with their content.
 */
export const getHomeSections = async (
  categoryId?: string,
  type: string = '720',
  limit: number = 5,
  lang: string = 'en'
): Promise<HomeSectionVO[]> => {
  try {
    const params: Record<string, string | number> = { type, limit };
    if (categoryId) {
      params.categoryId = categoryId;
    }

    const response = await axios.get(`${BASE_URL}/api-movie/v1/home/sections/home`, {
      params,
      headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Language': lang
      }
    });

    if (response.data?.success && Array.isArray(response.data?.data)) {
      return response.data.data as HomeSectionVO[];
    }

    console.warn('Home sections returned empty or invalid data');
    return [];
  } catch (error) {
    console.error('Error fetching home sections:', error);
    return [];
  }
};

/**
 * loadMoreSectionContent
 * Loads more content for a specific home page section (pagination).
 */
export const loadMoreSectionContent = async (
  sectionId: string,
  categoryId: string,
  type: string = '720',
  page: number = 2,
  size: number = 10
): Promise<SectionContentVO | null> => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api-movie/v1/home/sections/${encodeURIComponent(sectionId)}/more`,
      {
        params: { categoryId, type, page, size },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    if (response.data?.success && response.data?.data) {
      return response.data.data as SectionContentVO;
    }

    console.warn('Section content returned empty or invalid data');
    return null;
  } catch (error) {
    console.error('Error fetching more section content:', error);
    return null;
  }
};

/**
 * loadMoreFromURL
 * Loads more content from a dynamic URL (pagination).
 */
export const loadMoreFromURL = async (
  url: string,
  type: string = '720',
  page: number = 2,
  size: number = 10
): Promise<SectionContentVO | null> => {
  try {
    const response = await axios.get(
      `${BASE_URL}${url}`,
      {
        params: {  type, page, size },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    if (response.data?.success && response.data?.data) {
      return response.data.data as SectionContentVO;
    }

    console.warn('Section content returned empty or invalid data');
    return null;
  } catch (error) {
    console.error('Error fetching more section content:', error);
    return null;
  }
};

// --------------------------------------------------------------------------
// EDIT/UPDATE APIS
// --------------------------------------------------------------------------

/**
 * getVideoForEdit
 * Fetches video edit information (with draft if exists) for a given video ID.
 */
export async function getVideoForEdit(videoId: string): Promise<VideoEditResponse | null> {
  try {
    const response = await axios.get(`${BASE_URL}/api-movie/v1/my-videos/uploads/${videoId}/edit`);
    if (response.data.success) {
      return response.data.data as VideoEditResponse;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch video for edit:', error);
    return null;
  }
}

/**
 * getEpisodeForEdit
 * Fetches episode edit information (with draft if exists) for a given episode ID.
 */
export async function getEpisodeForEdit(episodeId: string): Promise<EpisodeEditResponse | null> {
  try {
    const response = await axios.get(`${BASE_URL}/api-movie/v1/my-videos/episodes/${episodeId}/edit`);
    if (response.data.success) {
      return response.data.data as EpisodeEditResponse;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch episode for edit:', error);
    return null;
  }
}

// Interface for video edit responses
interface VideoEditResponse {
  videoId: string;
  hasDraft: boolean;
  title?: string;
  description?: string;
  fileName?: string;
  coverUrl?: string;
  customCoverUrl?: string;
  landscapeThumbnailUrl?: string;
  fileSize?: number;
  status?: string;
  categoryId?: string;
  region?: string;
  language?: string;
  year?: number;
  director?: string;
  actors?: string[];
  releaseRegions?: string;
  rating?: number;
  tags?: string[];
  sourceProvider?: string;
  isSeries?: boolean;
  seriesId?: string;
  seasonNumber?: number;
  totalEpisodes?: number;
  isCompleted?: boolean;
  createBy?: string;
  createTime?: string;
  updateTime?: string;
  sourceType?: string;
  episodes?: EpisodeVO[];
}

// Interface for episode edit responses
interface EpisodeEditResponse {
  episodeId: string;
  hasDraft: boolean;
  draftId?: string;
  draftVersion?: number;
  draftStatus?: string;
  auditStatus?: string;
  modificationNote?: string;
  draftCreateTime?: string;
  seriesId?: string;
  title?: string;
  description?: string;
  coverUrl?: string;
  episodeNumber?: number;
  duration?: number;
  m3u8Url?: string;
  quality?: string;
  price?: number;
  salePrice?: number;
  originalStatus?: string;
  originalCreateTime?: string;
  originalUpdateTime?: string;
}

// Define the update payload type for movies and series
export interface UpdateVideoDto {
  id: string;
  title?: string;
  description?: string;
  coverUrl?: string;
  customCoverUrl?: string;
  landscapeThumbnailUrl?: string;
  categoryId?: string;
  year?: number;
  region?: string;
  language?: string;
  director?: string;
  actors?: string;
  releaseRegions?: string;
  rating?: number;
  tags?: string[];
  sourceProvider?: string;
  seasonNumber?: number;
  totalEpisodes?: number;
  isCompleted?: boolean;
}

// Define the update payload type for episodes
export interface UpdateEpisodeDto {
  id: string;
  seriesId?: string;
  episodeNumber?: number;
  title?: string;
  description?: string;
  coverUrl?: string;
  customCoverUrl?: string;
  landscapeThumbnailUrl?: string;
  duration?: number;
  m3u8Url?: string;
  quality?: string;
  price?: number;
  salePrice?: number;
}

/**
 * updateMovie
 * Updates movie/video metadata for a given video ID.
 */
export async function updateMovie(videoId: string, data: UpdateVideoDto): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const response = await axios.post(
      `${BASE_URL}/api-movie/v1/my-videos/${videoId}/save`,
      data
    );
    return {
      success: response.data.success,
      message: response.data.message
    };
  } catch (error) {
    console.error('Failed to update movie:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Update failed'
    };
  }
}

/**
 * updateSeries
 * Updates series metadata for a given series ID.
 */
export async function updateSeries(seriesId: string, data: UpdateVideoDto): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const response = await axios.post(
      `${BASE_URL}/api-movie/v1/my-videos/${seriesId}/save`,
      data
    );
    return {
      success: response.data.success,
      message: response.data.message
    };
  } catch (error) {
    console.error('Failed to update series:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Update failed'
    };
  }
}

/**
 * updateEpisode
 * Updates episode metadata for a given episode ID.
 */
export async function updateEpisode(episodeId: string, data: UpdateEpisodeDto): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const response = await axios.put(`${BASE_URL}/api-movie/v1/my-videos/episodes/${episodeId}/save`, data);
    return {
      success: response.data.success,
      message: response.data.message
    };
  } catch (error) {
    console.error('Failed to update episode:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Update failed'
    };
  }
}

/**
 * deleteVideo
 * Deletes a video or series by ID.
 */
export async function deleteVideo(videoId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const response = await axios.delete(`${BASE_URL}/api-movie/v1/content/${videoId}`);
    return {
      success: response.data.success,
      message: response.data.message
    };
  } catch (error) {
    console.error('Failed to delete video:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Delete failed'
    };
  }
}

