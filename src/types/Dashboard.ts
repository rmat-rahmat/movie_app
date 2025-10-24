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
  tags?: string | string[] | Record<string, string>;
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
  url?: string;
}

export interface BannerVO {
  title: string;
  imageUrl: string;
  type: number; // 1-PC端，2-移动端
  linkType: number; // 1-内链（视频详情），2-外链
  videoId?: string; // 内链：视频ID
  externalUrl?: string; // 外链：外部链接地址
  sortOrder: number; // 排序权重
}

export interface categoryLangLabel {
  [key: string]: string;
}
export interface CategoryItem {
  id: string;
  parentId?: string | null;
  categoryName?: string;
  categoryAlias?: string;
  categoryIcon?: string;
  categoryCover?: string;
  categoryLangLabel?: categoryLangLabel;
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

// Content List VO for recommendation API
export interface ContentListVO {
  page: number;
  size: number;
  contents: VideoVO[];
  errorMessage?: string;
  hasError?: boolean;
}

// Recommendation API response
export interface RecommendationApiResponse {
  status: number;
  code?: string;
  success: boolean;
  message?: string;
  data: ContentListVO;
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

// Video VO type for category videos API
export interface VideoVO {
  id: string; // Make id mandatory to align with DashboardItemType
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
  actors?: string[]; // Update actors to match DashboardItem
  rating?: number;
  tags?: string[];
  createBy?: string;
  createTime?: string;
  views?: number; // Add views property to align with DashboardItem
  hlsUrl?: string; // Added for HLS source
  source?: string; // Added for video source
}

// Episode details returned from content detail endpoint
export interface Episode {
  id?: string;
  uploadId?: string;
  playUrl?: string;
  title?: string;
  description?: string;
  episodeNumber?: number;
  seriesId?: string;
  duration?: number;
  fileSize?: number;
  coverUrl?: string;
  imageQuality?: ImageItem | null;
  status?: string;
  createTime?: string | null;
  createBy?: string | null;
  updateTime?: string | null;
  m3u8Url?: string | null;
}

// Rich content detail type that extends the lighter DashboardItem
export interface VideoDetails extends DashboardItem {
  fileName?: string;
  fileSize?: number | null;
  coverUrl?: string | null;
  imageQuality?: ImageItem | null;
  isSeries?: boolean;
  episodes?: Episode[];
  likeCount?: number | null;
  totalEpisodes?: number | null;
  seasonNumber?: number | null;
  uploadId?: string | null;
}

// Page info for pagination
export interface PageInfo {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  getTotalPages?: number; // Some APIs use getTotalPages
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
interface searchResult {
  contents: VideoVO[];
  page: number;
  size: number;
  total: number;
  getTotalPages: number;
}
export interface SearchApiResponse {
  status: number;
  code?: string;
  success: boolean;
  message?: string;
  data: searchResult;
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
