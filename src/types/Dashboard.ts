// Types for live dashboard API
export interface DashboardItem {
  id: string;
  title: string;
  description?: string;
  fileName?: string;
  coverUrl?: string | null;
  imageQuality?: ImageItem | null;
  fileSize?: number | null;
  status?: string | null;
  createBy?: string | null;
  createTime?: string | null;
  updateTime?: string | null;
  categoryId?: string | null;
  region?: string | null;
  language?: string | null;
  year?: number | null;
  director?: string | null;
  actors?: string[];
  rating?: number | null;
  tags?: string[];
  isSeries?: boolean;
  seriesId?: string | null;
  seasonNumber?: number | null;
  totalEpisodes?: number | null;
  isCompleted?: boolean;
  popularity?: number | string | null;
  views?: number | string | null;
}

export interface ImageItem {
  customCoverUrl: string;
  p144: string;
  p360: string;
  p720: string;
}

export interface CategoryItem {
  id: string;
  parentId?: string | null;
  categoryName?: string;
  categoryAlias?: string;
  categoryIcon?: string;
  categoryCover?: string;
  sortWeight?: string | number;
  state?: string;
  description?: string;
  createTime?: string | null;
  createBy?: string | null;
  updateTime?: string | null;
  updateBy?: string | null;
  children?: CategoryItem[];
  depth?: number;
}

export interface ContentSection {
  id: string;
  title?: string;
  type?: string | null;
  contents?: DashboardItem[];
  limit?: number | null;
  hasMore?: boolean;
}

export interface DashboardData {
  featuredContent?: DashboardItem[];
  categories?: CategoryItem[];
  contentSections?: ContentSection[];
}

export interface DashboardApiResponse {
  status: number;
  code?: string;
  success?: boolean;
  message?: string;
  data?: DashboardData;
  timestamp?: number;
  clientError?: boolean;
  serverError?: boolean;
}

// Video VO type for category videos API
export interface VideoVO {
  title: string;
  description?: string;
  fileName?: string;
  coverUrl?: string;
  imageQuality?: ImageItem;
  status?: string;
  isSeries?: boolean;
  seriesId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  totalEpisodes?: number;
  isCompleted?: boolean;
  categoryId?: string;
  year?: number;
  region?: string;
  language?: string;
  director?: string;
  actors?: string;
  rating?: number;
  tags?: string[];
  createBy?: string;
  createTime?: string;
  id?: string; // Adding id for consistency
}

// Page info for pagination
export interface PageInfo {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Error detail type
export interface ErrorDetail {
  message?: string;
  type?: string;
  stackTrace?: string;
  details?: Record<string, unknown>;
}

// Validation error type
export interface ValidationError {
  field?: string;
  message?: string;
  code?: string;
  rejectedValue?: unknown;
}

// Videos API response
export interface VideosApiResponse {
  status: number;
  code?: string;
  success: boolean;
  message?: string;
  data: VideoVO[];
  timestamp?: number;
  errorId?: string;
  path?: string;
  error?: ErrorDetail;
  validationErrors?: ValidationError[];
  pageInfo?: PageInfo;
  metadata?: Record<string, unknown>;
  clientError?: boolean;
  serverError?: boolean;
}

// Search API response
export interface SearchApiResponse {
  status: number;
  code?: string;
  success: boolean;
  message?: string;
  data: VideoVO[];
  timestamp?: number;
  errorId?: string;
  path?: string;
  error?: ErrorDetail;
  validationErrors?: ValidationError[];
  pageInfo?: PageInfo;
  metadata?: Record<string, unknown>;
  clientError?: boolean;
  serverError?: boolean;
}
