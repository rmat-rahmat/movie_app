import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { BASE_URL } from '../config';

// Debug logging utility
const debugLog = (message: string, data?: unknown) => {
  console.log(`[UploadAPI] ${message}`, data || '');
};

// Types for Movie Upload
export interface MovieUploadRequest {
  title: string;
  fileName: string;
  fileSize?: number;
  description?: string;
  coverUrl?: string;
  customCoverUrl?: string;
  duration?: number;
  categoryId?: string;
  year?: number;
  region?: string;
  language?: string;
  director?: string;
  actors?: string;
  rating?: number;
  tags?: string[];
}

export interface UploadCredential {
  uploadId: string;
  key: string;
}

// Types for Series Upload
export interface SeriesCreateRequest {
  title: string;
  description?: string;
  coverUrl?: string;
  categoryId?: string;
  year?: number;
  region?: string;
  language?: string;
  director?: string;
  actors?: string;
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
  fileName: string;
  fileSize: number;
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
  const authToken = localStorage.getItem('auth_token');
  const apiKey = localStorage.getItem('api-key') || process.env.UPLOAD_API_KEY||"123";
  console.log('Using API Key:', apiKey);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
     'Authorization': authToken ? `Bearer ${authToken}` : '',
  };
  
  if (apiKey) {
    headers['api-key'] = apiKey;
  }
  
  debugLog('API Headers prepared', { hasApiKey: !!apiKey });
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

    const res: AxiosResponse<StandardResponse<T>> = await axios.request<StandardResponse<T>>(axiosConfig);
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
export async function createMovieUpload(request: MovieUploadRequest): Promise<UploadCredential> {
  debugLog('Creating movie upload', request);
  
  try {
    const response = await apiCall<StandardResponse<UploadCredential>>(
      '/api-movie/v1/vod/upload',
      'POST',
      request
    );
    
    if (!response.success || !response.data) {
      debugLog('Movie upload creation failed', response);
      throw new Error(response.message || 'Failed to create movie upload');
    }
    
    debugLog('Movie upload created successfully', response.data);
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
  coverUrl?: string;
  categoryId?: string;
  year?: number;
  region?: string;
  language?: string;
  director?: string;
  actors?: string;
  rating?: number;
  tags?: string[];
  seasonNumber: number;
  totalEpisodes: number;
  isCompleted: boolean;
  createTime: string;
}> {
  debugLog('Creating TV series', request);
  
  try {
    const response = await apiCall<StandardResponse<{
      seriesId: string;
      title: string;
      description?: string;
      coverUrl?: string;
      categoryId?: string;
      year?: number;
      region?: string;
      language?: string;
      director?: string;
      actors?: string;
      rating?: number;
      tags?: string[];
      seasonNumber: number;
      totalEpisodes: number;
      isCompleted: boolean;
      createTime: string;
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

export async function createEpisode(request: EpisodeCreateRequest): Promise<{
  id: string;
  uploadId: string;
  title: string;
  description?: string;
  episodeNumber: number;
  seriesId: string;
  duration?: number;
  fileSize?: number;
  coverUrl?: string;
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
      coverUrl?: string;
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

export async function initializeEpisodeUpload(request: EpisodeUploadRequest): Promise<UploadCredential> {
  debugLog('Initializing episode upload', request);
  
  try {
    const response = await apiCall<StandardResponse<UploadCredential>>(
      '/api-movie/v1/vod/episodes/upload',
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

// High-level file upload function
export async function uploadFile(
  file: File,
  uploadCredential: UploadCredential,
  onProgress?: (progress: number) => void
): Promise<void> {
  debugLog('Starting file upload', { 
    fileName: file.name, 
    fileSize: file.size, 
    uploadCredential 
  });
  
  const chunkSize = 8 * 1024 * 1024; // 8MB chunks
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
        uploadCredential.uploadId,
        uploadCredential.key,
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
      uploadId: uploadCredential.uploadId,
      key: uploadCredential.key,
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
