import axios from 'axios';
import { BASE_URL } from '../config';

// Types based on the API documentation
export type TagVo = {
  id: string;
  name: string;
  description?: string;
};

export type TagQueryDto = {
  page?: number;
  size?: number;
  name?: string;
};

export type PageInfo = {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type StandardResponseListTagVo = {
  status?: number;
  code?: string;
  success?: boolean;
  message?: string;
  data?: TagVo[];
  pageInfo?: PageInfo;
  [key: string]: unknown;
};

/**
 * Fetch tags with pagination and optional filtering
 * POST /api-movie/v1/tag/page
 */
export async function fetchTags(query: TagQueryDto = {}): Promise<{ tags: TagVo[]; pageInfo?: PageInfo }> {
  const url = `${BASE_URL}/api-movie/v1/tag/page`;
  
  const payload = {
    page: query.page || 1,
    size: query.size || 50, // Get more tags for better filtering
    name: query.name || ''
  };

  try {
    const response = await axios.post<StandardResponseListTagVo>(url, payload, {
      headers: {
        'Content-Type': 'application/json',
       'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    const body = response.data;
    if (!body || !body.success) {
      throw new Error(body?.message || 'Failed to fetch tags');
    }

    return {
      tags: body.data || [],
      pageInfo: body.pageInfo
    };
  } catch (err: unknown) {
    const message = axios.isAxiosError(err) 
      ? (err.response?.data as StandardResponseListTagVo)?.message || err.message 
      : String(err);
    throw new Error(`Failed to fetch tags: ${message}`);
  }
}

/**
 * Search tags by name
 */
export async function searchTags(name: string): Promise<TagVo[]> {
  const { tags } = await fetchTags({ name, size: 20 });
  return tags;
}

const tagAPI = {
  fetchTags,
  searchTags
};

export default tagAPI;
