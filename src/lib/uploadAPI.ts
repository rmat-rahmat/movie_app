/**
 * uploadAPI.ts
 * 
 * This module provides helper functions for uploading movies, series, episodes, and images
 * to the Seefu TV backend. It handles:
 * - Initializing upload credentials for movies, series, and episodes
 * - Uploading files in chunks with progress tracking
 * - Uploading cover and landscape images
 * - Creating movie/series/episode records with metadata
 * 
 * Key conventions:
 * - All API calls are made using axios or fetch.
 * - Use the exported helpers in upload components for all upload-related operations.
 * - Progress is reported as a percentage (0-100) via callback.
 * 
 * To extend:
 * - Add new upload endpoints as async functions.
 * - Use debug logging for troubleshooting.
 * 
 * Function-level comments are provided below for maintainability.
 */

import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { BASE_URL } from '../config';
import { withTokenRefresh, useAuthStore } from '@/store/authStore';

// Debug logging utility
const debugLog = (message: string, data?: unknown) => {
  console.log(`[UploadAPI] ${message}`, data || '');
};

// Types for Movie Upload
export interface MovieUploadRequest {
  title: string;
  uploadType?: 'FILE_UPLOAD' | 'M3U8_URL';
  description?: string;
  coverUrl?: string;
  customCoverUrl?: string;
  landscapeThumbnailUrl?: string;
  duration?: number;
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
  // File upload method fields
  fileName?: string;
  fileSize?: number;
  totalParts?: number;
  // M3U8 method fields
  m3u8Url?: string;
}

export interface UploadCredential {
  uploadId: string;
  key: string;
}

// Types for Series Upload
export interface SeriesCreateRequest {
  title: string;
  description?: string;
  customCoverUrl?: string;
  categoryId?: string;
  year?: number;
  region?: string;
  language?: string;
  director?: string;
  actors?: string;
  landscapeThumbnailUrl?: string;
  releaseRegions?: string;
  sourceProvider?: string;
  rating?: number;
  tags?: string[];
  seasonNumber: number;
  totalEpisodes: number;
}

export interface EpisodeCreateRequest {
  seriesId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  episodeNumber: number;
  duration?: number;
}

export interface EpisodeUploadRequest {
  seriesId: string;
  episodeNumber: number;
  // File upload method fields
  fileName?: string;
  uploadType?: 'FILE_UPLOAD' | 'M3U8_URL';
  fileSize?: number;
  totalParts?: number;
  // M3U8 method fields
  m3u8Url?: string;
}

// Upload Part Types
export interface UploadPart {
  PartNumber: number;
  ETag: string;
}

export interface FileUploadCompleteRequest {
  uploadId: string;
  key: string;
  parts: UploadPart[];
}

export interface PartUploadResponse {
  url: string;
  partNumber: number;
  expires: number;
}

// Image upload init/result types
export interface ImageUploadInitResponse {
  id: string;
  uploadId: string;
  key: string;
}

export interface ImageVo {
  id: string;
  imageId?: string;
  title?: string;
  imageType?: string;
  tags?: string;
  status?: string;
  description?: string;
  url?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

export interface DirectImageUploadResponse {
  uploadId: string;
  key: string;
  imageUrl: string;
  fileSize: number;
  uploadTime?: string;
  timestamp?: number;
  traceId?: string;
}

interface StandardResponse<T> {
  status: number;
  code: string;
  success: boolean;
  message: string;
  data: T;
  timestamp: number;
  errorId?: string;
  path?: string;
  error?: {
    message: string;
    type: string;
    stackTrace: string;
    details: Record<string, unknown>;
  };
  validationErrors?: Array<{
    field: string;
    message: string;
    code: string;
    rejectedValue: unknown;
  }>;
  pageInfo?: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  metadata?: Record<string, unknown>;
  clientError: boolean;
  serverError: boolean;
}

// Get API headers
const getHeaders = ({ withApiKey = true }: { withApiKey?: boolean } = {}): Record<string, string> => {
  // Use token from Zustand store for immediate access to refreshed tokens
  const authToken = useAuthStore.getState().token;
  const apiKey = localStorage.getItem('api-key') || process.env.UPLOAD_API_KEY||"123";
  console.log('Using API Key:', apiKey);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
     'Authorization': authToken ? `Bearer ${authToken}` : '',
  };
  
  if (apiKey) {
    headers['api-key'] = apiKey;
  }
  
  debugLog('API Headers prepared', { hasApiKey: !!apiKey, hasAuthToken: !!authToken });
  return headers;
};

// Generic API call helper using axios
async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  debugLog(`Making ${method} request to: ${url}`, body);

  try {
    const headers = getHeaders({ withApiKey: method !== 'GET' });
    const axiosConfig: AxiosRequestConfig = {
      url,
      method: method.toLowerCase() as AxiosRequestConfig['method'],
      headers,
      data: body ?? undefined,
    };

    // Wrap the axios request with token refresh helper so 401 triggers refresh and retry
    const res: AxiosResponse<StandardResponse<T>> = await withTokenRefresh((newToken) => {
      // If a new token is provided (during retry), update the authorization header
      if (newToken) {
        console.log('[UploadAPI] Using refreshed token for retry:', newToken);
        axiosConfig.headers = {
          ...axiosConfig.headers,
          'Authorization': `Bearer ${newToken}`
        };
      }
      return axios.request<StandardResponse<T>>(axiosConfig);
    });
    debugLog(`Response status: ${res.status}`, { url, ok: res.status >= 200 && res.status < 300 });

    const data: StandardResponse<T> = res.data as StandardResponse<T>;
    debugLog('API Response received', data);

    // Caller expects the wrapped StandardResponse<T> (we often call apiCall with StandardResponse<...> as T)
    return data as unknown as T;
  } catch (error) {
    const message = axios.isAxiosError(error) ? (error.response?.data || error.message) : String(error);
    debugLog('API call failed', { error: message });
    throw error;
  }
}

// Movie Upload Functions
export async function createMovieUpload(request: MovieUploadRequest): Promise<UploadCredential | void> {
  debugLog('Creating movie upload', request);
  
  try {
    // Determine which endpoint to use based on the request type
    const endpoint = '/api-movie/v1/vod/upload'; // File upload method
    
    const response = await apiCall<StandardResponse<UploadCredential>>(
      endpoint,
      'POST',
      request
    );
    
    if (!response.success) {
      debugLog('Movie upload creation failed', response);
      throw new Error(response.message || 'Failed to create movie upload');
    }
    
    debugLog('Movie upload created successfully', response.data);
    // Only return upload credentials if it's a file upload method
    return response.data;
  } catch (error) {
    debugLog('Error creating movie upload', error);
    throw error;
  }
}

// Series Upload Functions
export async function createSeries(request: SeriesCreateRequest): Promise<{
  seriesId: string;
  title: string;
  description?: string;
  customCoverUrl?: string;
  coverUrl?: string;
  landscapeThumbnailUrl?: string;
  categoryId?: string;
  year?: number;
  region?: string;
  releaseRegions?: string;
  language?: string;
  director?: string;
  actors?: string;
  rating?: number;
  tags?: string[];
  seasonNumber: number;
  totalEpisodes: number;
  isCompleted: boolean;
  createTime: string;
  updateTime?: string;
  sourceProvider?: string;
}> {
  debugLog('Creating TV series', request);
  
  try {
    const response = await apiCall<StandardResponse<{
      seriesId: string;
      title: string;
      description?: string;
      customCoverUrl?: string;
      coverUrl?: string;
      landscapeThumbnailUrl?: string;
      categoryId?: string;
      year?: number;
      region?: string;
      releaseRegions?: string;
      language?: string;
      director?: string;
      actors?: string;
      rating?: number;
      tags?: string[];
      seasonNumber: number;
      totalEpisodes: number;
      isCompleted: boolean;
      sourceProvider?: string;
      createTime: string;
      updateTime?: string;
    }>>(
      '/api-movie/v1/vod/series/create',
      'POST',
      request
    );
    
    if (!response.success || !response.data) {
      debugLog('Series creation failed', response);
      throw new Error(response.message || 'Failed to create series');
    }
    
    debugLog('Series created successfully', response.data);
    return response.data;
  } catch (error) {
    debugLog('Error creating series', error);
    throw error;
  }
}

/**
 * Initialize an image upload. Returns { id, uploadId, key }.
 */
export async function initializeImageUpload(imageUploadDto: {
  title?: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  totalParts: number;
  imageType?: string;
  description?: string;
  tags?: string;
}): Promise<ImageUploadInitResponse> {
  debugLog('Initializing image upload', imageUploadDto);

  try {
    const response = await apiCall<StandardResponse<ImageUploadInitResponse>>(
      '/api-movie/v1/init',
      'POST',
      imageUploadDto
    );

    if (!response.success || !response.data) {
      debugLog('Image upload init failed', response);
      throw new Error(response.message || 'Failed to initialize image upload');
    }

    debugLog('Image upload initialized', response.data);
    return response.data;
  } catch (error) {
    debugLog('Error initializing image upload', error);
    throw error;
  }
}

/**
 * Get image metadata / access URL by image id.
 */
export async function getImageById(id: string, type: string): Promise<ImageVo> {
  debugLog('Getting image by id', { id, type });

  try {
    const endpoint = `/api-movie/v1/images/getImageById?id=${encodeURIComponent(id)}&type=${encodeURIComponent(type)}`;
    const response = await apiCall<StandardResponse<ImageVo>>(endpoint, 'GET');

    if (!response.success || !response.data) {
      debugLog('Get image by id failed', response);
      throw new Error(response.message || 'Failed to get image by id');
    }

    debugLog('Image metadata retrieved', response.data);
    return response.data;
  } catch (error) {
    debugLog('Error getting image by id', error);
    throw error;
  }
}


export async function getImageById2(id: string, type: string): Promise<string> {
  debugLog('Getting image by id', { id, type });

  try {
    const endpoint = `/api-movie/v1/images/getImageById?id=${encodeURIComponent(id)}&type=${encodeURIComponent(type)}`;
    const response = await apiCall<StandardResponse<unknown>>(endpoint, 'GET');

    if (!response.success || !response.data) {
      debugLog('Get image by id failed', response);
      throw new Error(response.message || 'Failed to get image by id');
    }

    debugLog('Image metadata retrieved', response.data);
    return typeof response?.data === 'string' ? response.data : '';
  } catch (error) {
    debugLog('Error getting image by id', error);
    throw error;
  }
}

/**
 * Direct image upload - uploads image file and returns image URL and uploadId
 * @param file - The image file to upload
 * @param businessPath - Business path (folder where file will be stored in S3)
 * @param accessLevel - Access level (e.g., "Public")
 * @param imageSizes - Image size (e.g., "800x600")
 * @returns Promise with uploadId, key, imageUrl, fileSize, etc.
 */
export async function directImageUpload(
  file: File,
  businessPath: string = 'avatars',
  accessLevel: string = 'Public',
  imageSizes: string = '800x600'
): Promise<DirectImageUploadResponse> {
  debugLog('Starting direct image upload', { 
    fileName: file.name, 
    fileSize: file.size, 
    businessPath, 
    accessLevel, 
    imageSizes 
  });

  try {
    const authToken = useAuthStore.getState().token;
    
    if (!authToken) {
      throw new Error('Authentication required for image upload');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('businessPath', businessPath);
    formData.append('accessLevel', accessLevel);
    formData.append('imageSizes', imageSizes);
    const url = `${BASE_URL}/api-net/Upload/direct-image-server`;
    
    const axiosConfig: AxiosRequestConfig = {
      url,
      method: 'post',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        // Note: Content-Type is automatically set by axios for FormData
      },
      data: formData,
    };

    // Wrap with token refresh to handle 401 errors
    const res: AxiosResponse<StandardResponse<DirectImageUploadResponse>> = await withTokenRefresh((newToken) => {
      if (newToken) {
        console.log('[UploadAPI] Using refreshed token for direct image upload retry:', newToken);
        axiosConfig.headers = {
          ...axiosConfig.headers,
          'Authorization': `Bearer ${newToken}`
        };
      }
      return axios.request<StandardResponse<DirectImageUploadResponse>>(axiosConfig);
    });

    debugLog(`Direct upload response status: ${res.status}`, res.data);

    const responseData: StandardResponse<DirectImageUploadResponse> = res.data;

    if (!responseData.success || !responseData.data) {
      debugLog('Direct image upload failed', responseData);
      throw new Error(responseData.message || 'Failed to upload image');
    }

    debugLog('Direct image upload successful', responseData.data);
    return responseData.data;
  } catch (error) {
    debugLog('Error during direct image upload', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data?.message || 'Failed to upload image');
    }
    throw error;
  }
}

export async function createEpisode(request: EpisodeCreateRequest): Promise<{
  id: string;
  uploadId: string;
  title: string;
  description?: string;
  episodeNumber: number;
  seriesId: string;
  duration?: number;
  fileSize?: number;
  customCoverUrl?: string;
  status: string;
  createTime: string;
  createBy: string;
  updateTime: string;
}> {
  debugLog('Creating episode', request);
  
  try {
    const response = await apiCall<StandardResponse<{
      id: string;
      uploadId: string;
      title: string;
      description?: string;
      episodeNumber: number;
      seriesId: string;
      duration?: number;
      fileSize?: number;
      customCoverUrl?: string;
      status: string;
      createTime: string;
      createBy: string;
      updateTime: string;
    }>>(
      '/api-movie/v1/vod/episodes/create',
      'POST',
      request
    );
    
    if (!response.success || !response.data) {
      debugLog('Episode creation failed', response);
      throw new Error(response.message || 'Failed to create episode');
    }
    
    debugLog('Episode created successfully', response.data);
    return response.data;
  } catch (error) {
    debugLog('Error creating episode', error);
    throw error;
  }
}

export async function initializeEpisodeUpload(request: EpisodeUploadRequest): Promise<UploadCredential | void> {
  debugLog('Initializing episode upload', request);
  
  try {
    // Determine which endpoint to use based on the request type
    const endpoint = '/api-movie/v1/vod/episodes/upload'; // File upload method

    const response = await apiCall<StandardResponse<UploadCredential>>(
      endpoint,
      'POST',
      request
    );
    
    if (!response.success || !response.data) {
      debugLog('Episode upload initialization failed', response);
      throw new Error(response.message || 'Failed to initialize episode upload');
    }
    
    debugLog('Episode upload initialized successfully', response.data);
    return response.data;
  } catch (error) {
    debugLog('Error initializing episode upload', error);
    throw error;
  }
}

// File Upload Functions (shared between movie and series)
export async function getPartUploadUrl(
  uploadId: string,
  key: string,
  partNumber: number
): Promise<PartUploadResponse> {
  debugLog(`Getting part upload URL for part ${partNumber}`, { uploadId, key });
  
  // Try default endpoint first, fallback to alternative
  const endpoints = [
    `/api-net/upload/part-url/?uploadId=${uploadId}&key=${encodeURIComponent(key)}&partNumber=${partNumber}`
  ];
  
  for (let i = 0; i < endpoints.length; i++) {
    try {
      debugLog(`Trying endpoint ${i + 1}/${endpoints.length}: ${endpoints[i]}`);
      
      const response = await apiCall<StandardResponse<PartUploadResponse>>(
        endpoints[i],
        'GET',

      );
      
      if (!response.success || !response.data) {
        debugLog(`Endpoint ${i + 1} failed`, response);
        if (i === endpoints.length - 1) {
          throw new Error(response.message || 'Failed to get part upload URL');
        }
        continue;
      }
      
      debugLog(`Part upload URL retrieved successfully from endpoint ${i + 1}`, response.data);

      // Normalize different response shapes:
      const respData = response.data as unknown;

      // If API returned a plain URL string, wrap it into PartUploadResponse
      if (typeof respData === 'string') {
        debugLog('Response data is string, wrapping into PartUploadResponse', respData);
        return {
          url: respData,
          partNumber,
          expires: 0, // unknown expiry — use 0 as fallback
        } as PartUploadResponse;
      }

      // If API returned an object, ensure it contains a url and partNumber (fill partNumber if missing)
      if (respData && typeof respData === 'object') {
        const obj = respData as Partial<PartUploadResponse>;
        if (typeof obj.url === 'string') {
          if (typeof obj.partNumber !== 'number') {
        obj.partNumber = partNumber;
          }
          if (typeof obj.expires !== 'number') {
        obj.expires = obj.expires ?? 0;
          }
          return obj as PartUploadResponse;
        }
      }

      // Unexpected format
      throw new Error('Unexpected response format for part upload URL');
      return response.data;
    } catch (error) {
      debugLog(`Endpoint ${i + 1} error`, error);
      if (i === endpoints.length - 1) {
        throw error;
      }
    }
  }
  
  throw new Error('All endpoints failed for part upload URL');
}

export async function uploadPart(
  url: string,
  file: File,
  start: number,
  end: number
): Promise<string> {
  debugLog(`Uploading part to: ${url}`, { start, end, size: end - start });
  
  try {
    // Create a Blob for the chunk (File.prototype.slice already returns a Blob)
    const chunkBlob = file.slice(start, end) as Blob;

    // Upload using fetch with PUT
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: chunkBlob,
      mode: 'cors',
    });

    debugLog(`Part upload response status: ${res.status}`, { url });

    if (res.status < 200 || res.status >= 300) {
      // Read response body as text for better debugging (Response has no .data)
      const bodyText = await res.text().catch(() => '<unavailable>');
      debugLog('Part upload failed', { status: res.status, body: bodyText });
      throw new Error(`Failed to upload part: ${res.status}`);
    }

    // Read ETag from Headers returned by fetch
    const etag = res.headers.get('etag') ?? res.headers.get('ETag') ?? undefined;
    if (!etag) {
      debugLog('Warning: No ETag received from part upload', { headers: Array.from(res.headers.entries()) });
      throw new Error('No ETag received from part upload');
    }

    debugLog('Part uploaded successfully', { etag });
    return etag;
  } catch (error) {
    const msg = axios.isAxiosError(error) ? (error.response?.data || error.message) : String(error);
    debugLog('Error uploading part', msg);
    throw error;
  }
}

export async function completeMultipartUpload(request: FileUploadCompleteRequest): Promise<boolean> {
  debugLog('Completing multipart upload', request);
  
  // Try default endpoint first, fallback to alternative
  const endpoints = [
    '/api-net/upload/complete'
  ];
  
  for (let i = 0; i < endpoints.length; i++) {
    try {
      debugLog(`Trying complete endpoint ${i + 1}/${endpoints.length}: ${endpoints[i]}`);
      
      const response = await apiCall<StandardResponse<boolean>>(
        endpoints[i],
        'POST',
        request
      );
      
      if (!response.success) {
        debugLog(`Complete endpoint ${i + 1} failed`, response);
        if (i === endpoints.length - 1) {
          throw new Error(response.message || 'Failed to complete multipart upload');
        }
        continue;
      }
      
      debugLog(`Multipart upload completed successfully via endpoint ${i + 1}`, response.data);
      return response.data;
    } catch (error) {
      debugLog(`Complete endpoint ${i + 1} error`, error);
      if (i === endpoints.length - 1) {
        throw error;
      }
    }
  }
  
  throw new Error('All endpoints failed for completing multipart upload');
}

/**
 * uploadFile
 * Uploads a file to the backend in one or more parts (chunks).
 * - Accepts a File object, upload credentials, and a progress callback.
 * - Splits the file into chunks if needed and uploads each part sequentially.
 * - Calls onProgress with the current upload percentage (0-100).
 * - Returns a Promise that resolves when the upload is complete.
 * 
 * @param file - The File object to upload
 * @param credential - UploadCredential object with uploadId, key, and (optionally) part URLs
 * @param onProgress - Callback function to report upload progress (0-100)
 * @returns Promise<void>
 */
export async function uploadFile(
  file: File,
  credential: UploadCredential,
  onProgress?: (progress: number) => void
): Promise<void> {
  debugLog('Starting file upload', { 
    fileName: file.name, 
    fileSize: file.size, 
  });
  
  const chunkSize = 10 * 1024 * 1024; // 10MB chunks
  const totalChunks = Math.ceil(file.size / chunkSize);
  const parts: UploadPart[] = [];
  
  debugLog(`File will be uploaded in ${totalChunks} chunks of ${chunkSize} bytes each`);
  
  try {
    // Upload each part
    for (let i = 0; i < totalChunks; i++) {
      const partNumber = i + 1;
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      
      debugLog(`Uploading part ${partNumber}/${totalChunks}`, { start, end });
      
      // Get presigned URL for this part
      const partUploadInfo = await getPartUploadUrl(
        credential.uploadId,
        credential.key,
        partNumber
      );
      
      // Upload the part
      const etag = await uploadPart(partUploadInfo.url, file, start, end);
      
      parts.push({
        PartNumber: partNumber,
        ETag: etag
      });
      
      // Update progress
      const progress = ((i + 1) / totalChunks) * 90; // Reserve 10% for completion
      debugLog(`Part ${partNumber} uploaded successfully. Progress: ${progress.toFixed(1)}%`);
      onProgress?.(progress);
    }
    
    debugLog('All parts uploaded, completing multipart upload', { partsCount: parts.length });
    
    // Complete the multipart upload
    await completeMultipartUpload({
      uploadId: credential.uploadId,
      key: credential.key,
      parts
    });
    
    debugLog('File upload completed successfully');
    onProgress?.(100);
    
  } catch (error) {
    debugLog('File upload failed', error);
    throw error;
  }
}

// Playback functions
export async function getPlaybackQualities(uploadId: string): Promise<string[]> {
  debugLog('Getting playback qualities', { uploadId });
  
  try {
    // Note: This would need actual expires and signature in production
    const url = `${BASE_URL}/api-net/play/${uploadId}?expires=9999999999&signature=dummy`;
    const res = await axios.get(url);

    if (res.status < 200 || res.status >= 300) {
      debugLog('Failed to get playback qualities', { status: res.status });
      throw new Error(`Failed to get playback qualities: ${res.status}`);
    }

    const data = res.data;
    debugLog('Playback qualities retrieved', data);

    return data.qualities || [];
  } catch (error) {
    debugLog('Error getting playback qualities', error);
    throw error;
  }
}

export function getPlaybackUrl(uploadId: string, quality: string): string {
  const url = `${BASE_URL}/api-net/play/${uploadId}/${quality}.m3u8`;
  debugLog('Generated playback URL', { uploadId, quality, url });
  return url;
}
