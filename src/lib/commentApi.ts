import axios from 'axios';
import { BASE_URL } from '@/config';

// Types
export interface CommentVO {
  id: string;
  mediaId: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  likeCount: number;
  replyCount: number;
  parentId?: string;
  rootId?: string;
  level: number;
  mediaType: 'video' | 'episode';
  status: number;
  createdAt: string;
  updatedAt: string;
  replies?: CommentVO[];
  isLiked: boolean;
}

export interface CreateCommentDto {
  mediaId: string;
  mediaType: 'video' | 'episode';
  content: string;
  parentId?: string;
}

export interface PageResultCommentVO {
  records: CommentVO[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

interface StandardResponse<T> {
  status: number;
  code: string;
  success: boolean;
  message: string;
  data: T;
}

// Get authorization token from localStorage
const getAuthToken = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('authToken') || '';
};

/**
 * Create a new comment or reply
 */
export async function createComment(dto: CreateCommentDto): Promise<CommentVO> {
  const token = getAuthToken();
  const response = await axios.post<StandardResponse<CommentVO>>(
    `${BASE_URL}/api-movie/v1/comments/create`,
    dto,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to create comment');
}

/**
 * Get paginated list of comments (only top-level comments)
 */
export async function getCommentList(
  mediaId: string,
  mediaType: 'video' | 'episode',
  page: number = 1,
  size: number = 10
): Promise<PageResultCommentVO> {
  const token = getAuthToken();
  const response = await axios.get<StandardResponse<PageResultCommentVO>>(
    `${BASE_URL}/api-movie/v1/comments/list`,
    {
      params: { mediaId, mediaType, page, size },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch comments');
}

/**
 * Get replies for a specific comment
 */
export async function getCommentReplies(commentId: string): Promise<CommentVO[]> {
  const token = getAuthToken();
  const response = await axios.get<StandardResponse<CommentVO[]>>(
    `${BASE_URL}/api-movie/v1/comments/replies`,
    {
      params: { commentId },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch replies');
}

/**
 * Delete a comment (only user's own comments)
 */
export async function deleteComment(commentId: string): Promise<void> {
  const token = getAuthToken();
  const response = await axios.delete<StandardResponse<void>>(
    `${BASE_URL}/api-movie/v1/comments/delete`,
    {
      params: { commentId },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete comment');
  }
}

/**
 * Toggle like status for a comment
 */
export async function toggleCommentLike(commentId: string): Promise<void> {
  const token = getAuthToken();
  const response = await axios.post<StandardResponse<void>>(
    `${BASE_URL}/api-movie/v1/comments/like`,
    null,
    {
      params: { commentId },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to toggle like');
  }
}
