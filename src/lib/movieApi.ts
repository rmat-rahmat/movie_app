import { transformEpisodesToSlides } from "@/utils/transformToSlides";
import { parseStringPromise } from 'xml2js';
import axios from 'axios';
import { BASE_URL } from '../config';
import type { VideoSrc } from "@/types/VideoSrc";
import type { DashboardApiResponse, DashboardItem, CategoryItem, VideosApiResponse, SearchApiResponse, RecommendationApiResponse } from '@/types/Dashboard';
import { parseJsonFile } from "next/dist/build/load-jsconfig";
import i18next, { t } from 'i18next';

// Build hierarchical category tree from flat list (parents contain `children` array)
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
export const getMovies = async (number: number): Promise<VideoSrc[]> => {
  const res = await axios.get(`https://jsonfakery.com/movies/random/${number}`);
  const movies = res.data;
  // Convert each movie to VideoSrc format
  return movies.map(movieToVideoSrc);
};

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

export const getSeries = async (country: string) => {
  const res = await axios.get(`https://api.tvmaze.com/schedule?country=${country}`);
  const episodes = res.data;
  return transformEpisodesToSlides(episodes, 10);
};


// Fetch live dashboard from backend and map to VideoSrc
// Simple module-level cache to support server/runtime environments where localStorage
// is not available. This is best-effort and will be overwritten by localStorage when
// available in the browser.
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

// Synchronous helper to get cached categories (in-memory or localStorage). Returns null when
// no categories are cached or when running outside the browser and no in-memory cache exists.
export const getCachedCategories = (): CategoryItem[] | null => {
  if (inMemoryCategoriesCache) return inMemoryCategoriesCache.categories;
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('seefu_dashboard_categories_v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    // If stored format is flat (items have parentId and no children), convert to tree
    const first = parsed[0];
    const isTree = first && Object.prototype.hasOwnProperty.call(first, 'children');
    const catsTree = isTree ? (parsed as CategoryItem[]) : buildCategoryTree(parsed as CategoryItem[]);
    inMemoryCategoriesCache = { timestamp: Date.now(), categories: catsTree };
    return catsTree;
    return parsed
  } catch (_e) {
    return null;
  }
};

export const getCategoryTree = async (): Promise<CategoryItem[] | null> => {
  const cats = await getCategoryList();
  if (!cats || !Array.isArray(cats)) return null;
  return buildCategoryTree(cats);
}
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

// Helper: convert featuredContent to VideoSrc[] when a VideoSrc view is needed
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

// Get videos by category ID with pagination
export async function getCategoryVideos(categoryId: string, page: number = 1, size: number = 20,type:string="p720"): Promise<VideosApiResponse | null> {
  try {
    const response = await axios.get(`${BASE_URL}/api-movie/v1/category/videos/${categoryId}`, {
      params: { page, size ,type},
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

// Get videos by category ID with pagination
export async function getGridVideos(src: string, page: number = 1, size: number = 20): Promise<VideosApiResponse | null> {
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

// Search videos with optional category filter and pagination
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

// Get search suggestions (array of strings)
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

// Get hot search keywords
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

// Fetch the main m3u8 (may require expires & signature)
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

// Fetch a variant m3u8 for specific resolution/type
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

// Get playback URL for a specific quality using the otaik.cc endpoint
export async function getPlaybackUrl(uploadId: string, quality: '144p' | '360p' | '720p' | '1080p', apiKey?: string): Promise<string | null> {
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

// Fetch content detail by contentId and return typed VideoDetails
export async function getContentDetail(contentId: string): Promise<import('@/types/Dashboard').VideoDetails | null> {
  try {
    const url = `${BASE_URL}/api-movie/v1/home/contents/${contentId}/detail`;
    const res = await axios.get(url, {
      headers: { 'Accept': '*/*' }
    });
    const json = res.data;
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
 * Get recommended videos based on a video ID
 * @param videoId - The video ID to get recommendations for
 * @param page - Page number (defaults to 1)
 * @param size - Page size (defaults to 20, max 100)
 * @returns Promise<RecommendationApiResponse | null>
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

export type { CategoryItem };

// Record watch history
export interface WatchHistoryDto {
  mediaId: string;
  episodeId: string;
  watchTime: number; // seconds watched this session
  duration?: number; // total duration in seconds
  progress: number; // current playhead in seconds
  source?: string;
}

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

// Get last watch position (in seconds) for a given media/episode
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
    console.error('Failed to fetch last watch position', err);
    return null;
  }
}

// Fetch paginated watch history list for the current user
export async function getWatchHistoryList(page: number = 0, size: number = 12,type: string='p720'): Promise<DashboardItem[] | null> {
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
    if (data && data.success && data.data && Array.isArray(data.data.contents)) {
      const contents = data.data.contents as unknown[];
      // Map API content shape to DashboardItem minimal fields
      const list: DashboardItem[] = contents.map((it) => {
        const record = it as Record<string, unknown>;
        const id = String(record.id ?? '');
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

// Clear all watch history for the current user
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

// Fetch simplified director list (returns array of names)
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

// Fetch simplified actor list (returns array of names)
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

// Fetch region list (returns array of names)
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