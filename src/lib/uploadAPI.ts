import axios from 'axios';
import { BASE_URL } from '../config';

// Types for video upload based on the API documentation
export interface VideoUploadProgress {
  percentage: number;
  uploadedBytes: number;
  totalBytes: number;
  chunkIndex?: number;
  totalChunks?: number;
}

export interface VideoMetadata {
  title: string;
  description: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  thumbnail?: File;
}

export interface UploadInitResponse {
  uploadId: string;
  key: string;
}

export interface UploadPart {
  partNumber: number;
  eTag: string;
}

export interface VideoUploadResponse {
  success: boolean;
  uploadId: string;
  message: string;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface UploadStatusResponse {
  uploadId: string;
  createdAt: string;
  sliceStatus: number; // -1 Failed; 0 Pending; 2 Processing; 3 Completed; 4 No slicing required
  sliceError: string;
  imageSizes: string;
}

// Helper function to get authorization headers
const getAuthHeaders = () => {
  // Based on API doc, we need api-key header
  const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'OMpqVWAH.UC80wyXTtPwhDgAUdCTx6';
  return { 'api-key': apiKey };
};

// Step 1: Initialize S3 upload based on API documentation
export const initializeS3Upload = async (
  fileName: string, 
  fileSize: number, 
  contentType: string,
  totalParts: number
): Promise<UploadInitResponse> => {
  try {
    const response = await axios.post(`${BASE_URL}/api/file/upload/init`, {
      fileName,
      fileSize,
      contentType,
      fileType: 'video',
      businessPath: 'video',
      md5: '', // Optional
      totalParts,
      isPublic: 1
    }, {
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*',
        ...getAuthHeaders()
      }
    });

    if (response.data.success) {
      return {
        uploadId: response.data.data.uploadId,
        key: response.data.data.key
      };
    } else {
      throw new Error(response.data.message || 'Failed to initialize upload');
    }
  } catch (error) {
    console.error('S3 upload initialization failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to initialize upload');
  }
};

// Step 2: Get pre-signed upload URL for a specific part
export const getPreSignedUrl = async (
  uploadId: string, 
  key: string, 
  partNumber: number
): Promise<string> => {
  try {
    const response = await axios.get(`${BASE_URL}/api/file/upload/part-url/`, {
      params: {
        uploadId,
        key,
        partNumber
      },
      headers: {
        'accept': '*/*',
        ...getAuthHeaders()
      }
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to get upload URL');
    }
  } catch (error) {
    console.error('Failed to get pre-signed URL:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get upload URL');
  }
};

// Step 3: Upload file chunk to S3 using pre-signed URL
export const uploadChunkToS3 = async (
  uploadUrl: string, 
  chunk: Blob, 
  onProgress?: (progress: { loaded: number; total: number }) => void
): Promise<string> => {
  try {
    const response = await axios.put(uploadUrl, chunk, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total
          });
        }
      }
    });

    // Extract ETag from response headers
    const etag = response.headers.etag || response.headers.ETag;
    if (!etag) {
      throw new Error('No ETag received from S3');
    }

    return etag.replace(/"/g, ''); // Remove quotes from ETag
  } catch (error) {
    console.error('Chunk upload failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Chunk upload failed');
  }
};

// Step 4: Complete multipart upload
export const completeMultipartUpload = async (
  uploadId: string,
  key: string,
  parts: UploadPart[]
): Promise<VideoUploadResponse> => {
  try {
    const response = await axios.post(`${BASE_URL}/api/file/upload/complete`, {
      uploadId,
      key,
      parts: parts.map(part => ({
        partNumber: part.partNumber,
        eTag: part.eTag
      }))
    }, {
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*',
        ...getAuthHeaders()
      }
    });

    if (response.data.success) {
      return {
        success: true,
        uploadId: uploadId,
        message: response.data.message,
        processingStatus: 'pending'
      };
    } else {
      throw new Error(response.data.message || 'Failed to complete upload');
    }
  } catch (error) {
    console.error('Complete upload failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to complete upload');
  }
};

// Step 5: Cancel upload if needed
export const cancelUpload = async (uploadId: string, key: string): Promise<boolean> => {
  try {
    const response = await axios.post(`${BASE_URL}/api/file/upload/abort`, null, {
      params: {
        uploadId,
        key
      },
      headers: {
        'accept': '*/*',
        ...getAuthHeaders()
      }
    });

    return response.data.success;
  } catch (error) {
    console.error('Cancel upload failed:', error);
    return false;
  }
};

// Get file access URL after upload
export const getFileAccessUrl = async (uploadId: string): Promise<string> => {
  try {
    const response = await axios.get(`${BASE_URL}/api/file/upload/${uploadId}`, {
      headers: {
        'accept': '*/*',
        ...getAuthHeaders()
      }
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to get file URL');
    }
  } catch (error) {
    console.error('Failed to get file URL:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get file URL');
  }
};

// Check upload status
export const checkUploadStatus = async (uploadId: string): Promise<UploadStatusResponse> => {
  try {
    const response = await axios.get(`${BASE_URL}/api/file/upload/uploadlog`, {
      params: {
        uploadId
      },
      headers: {
        'accept': '*/*',
        ...getAuthHeaders()
      }
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to check status');
    }
  } catch (error) {
    console.error('Status check failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to check status');
  }
};

// Generate video cover image
export const generateVideoCover = async (uploadId: string): Promise<boolean> => {
  try {
    const response = await axios.post(`${BASE_URL}/api/file/GenerateImage/generateimage`, null, {
      params: {
        uploadId
      },
      headers: {
        'accept': '*/*',
        ...getAuthHeaders()
      }
    });

    return response.data.success;
  } catch (error) {
    console.error('Generate cover failed:', error);
    return false;
  }
};

// Main upload function that orchestrates the entire process
export const uploadVideo = async (
  file: File,
  metadata: VideoMetadata,
  onProgress?: (progress: VideoUploadProgress) => void
): Promise<VideoUploadResponse> => {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  let uploadedBytes = 0;

  try {
    // Step 1: Initialize upload
    const uploadInfo = await initializeS3Upload(file.name, file.size, file.type, totalChunks);
    const uploadedParts: UploadPart[] = [];

    // Step 2: Upload chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const partNumber = i + 1;

      // Get pre-signed URL for this part
      const uploadUrl = await getPreSignedUrl(uploadInfo.uploadId, uploadInfo.key, partNumber);

      // Upload the chunk with progress tracking
      const eTag = await uploadChunkToS3(uploadUrl, chunk, (progressEvent) => {
        const chunkProgress = (progressEvent.loaded / progressEvent.total) * 100;
        const overallProgress = ((uploadedBytes + progressEvent.loaded) / file.size) * 100;
        
        onProgress?.({
          percentage: overallProgress,
          uploadedBytes: uploadedBytes + progressEvent.loaded,
          totalBytes: file.size,
          chunkIndex: i + 1,
          totalChunks
        });
      });

      uploadedParts.push({ partNumber, eTag });
      uploadedBytes += chunk.size;

      // Update overall progress
      onProgress?.({
        percentage: (uploadedBytes / file.size) * 100,
        uploadedBytes,
        totalBytes: file.size,
        chunkIndex: i + 1,
        totalChunks
      });
    }

    // Step 3: Complete the upload
    const result = await completeMultipartUpload(uploadInfo.uploadId, uploadInfo.key, uploadedParts);

    // Step 4: Generate video cover
    try {
      await generateVideoCover(uploadInfo.uploadId);
    } catch (coverError) {
      console.warn('Video cover generation failed:', coverError);
      // Don't fail the entire upload if cover generation fails
    }

    return result;

  } catch (error) {
    console.error('Video upload failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Video upload failed');
  }
};

// Function to get supported video formats
export const getSupportedFormats = (): string[] => {
  return [
    'video/mp4',
    'video/quicktime', // .mov
    'video/x-msvideo', // .avi
    'video/webm',
    'video/x-ms-wmv', // .wmv
    'video/x-flv', // .flv
    'video/3gpp', // .3gp
    'video/x-matroska' // .mkv
  ];
};

// Function to validate file before upload
export const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
  const supportedFormats = getSupportedFormats();
  const maxSize = 500 * 1024 * 1024; // 500MB

  if (!supportedFormats.includes(file.type)) {
    return { valid: false, error: 'Unsupported file format' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 500MB limit' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  return { valid: true };
};
