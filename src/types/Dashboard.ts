/* eslint-disable @typescript-eslint/no-explicit-any */
// Types for live dashboard API
export interface DashboardItem {
  id: string;
  title: string;
  description?: string;
  fileName?: string;
  coverUrl?: string | null;
  customCoverUrl?: string | null;
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
  [key: string]: any;
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
  [key: string]: any;
}

export interface ContentSection {
  id: string;
  title?: string;
  type?: string | null;
  contents?: DashboardItem[];
  limit?: number | null;
  hasMore?: boolean;
  [key: string]: any;
}

export interface DashboardData {
  featuredContent?: DashboardItem[];
  categories?: CategoryItem[];
  contentSections?: ContentSection[];
  [key: string]: any;
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
