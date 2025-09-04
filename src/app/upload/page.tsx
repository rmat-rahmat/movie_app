"use client";

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { 
  uploadVideo, 
  VideoUploadProgress, 
  VideoMetadata, 
  validateVideoFile,
  checkUploadStatus,
  UploadStatusResponse 
} from '@/lib/uploadAPI';
import { useRouter } from 'next/navigation';
import { 
  FiUpload, 
  FiX, 
  FiPlay, 
  FiPause, 
  FiCheck, 
  FiAlertCircle, 
  FiVideo,
  FiImage,
  FiPlus
} from 'react-icons/fi';

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  error?: string;
  uploadId?: string;
}

export default function UploadPage() {
  const { t } = useTranslation('common');
  const { user } = useAuthStore();
  const router = useRouter();
  
  // State for file and upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle', progress: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Form data
  const [metadata, setMetadata] = useState<VideoMetadata>({
    title: '',
    description: '',
    category: '',
    tags: [],
    isPublic: true,
    thumbnail: undefined
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Categories for video classification
  const categories = [
    'Entertainment',
    'Education',
    'Music',
    'Gaming',
    'Sports',
    'News',
    'Technology',
    'Travel',
    'Cooking',
    'Other'
  ];

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  // Process selected file (from input or drag & drop)
  const processSelectedFile = (file: File) => {
    // Validate the file
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      setUploadState({ status: 'error', progress: 0, error: validation.error });
      return;
    }

    setSelectedFile(file);
    setMetadata((prev: VideoMetadata) => ({ 
      ...prev, 
      title: file.name.replace(/\.[^/.]+$/, '') 
    }));
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
    setUploadState({ status: 'idle', progress: 0 });
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  // Handle thumbnail selection
  const handleThumbnailSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadState({ 
        status: 'error', 
        progress: 0, 
        error: t('upload.invalidThumbnailType', 'Please select a valid image file (JPG, PNG, etc.)') 
      });
      return;
    }

    setMetadata((prev: VideoMetadata) => ({ ...prev, thumbnail: file }));
  };

  // Handle video play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Monitor upload status
  const monitorUploadStatus = async (uploadId: string) => {
    const maxAttempts = 30; // Max 5 minutes (30 * 10 seconds)
    let attempts = 0;

    const checkStatus = async (): Promise<void> => {
      try {
        const status: UploadStatusResponse = await checkUploadStatus(uploadId);
        
        // sliceStatus: -1 Failed; 0 Pending; 2 Processing; 3 Completed; 4 No slicing required
        switch (status.sliceStatus) {
          case 3: // Completed
          case 4: // No slicing required
            setUploadState({ 
              status: 'success', 
              progress: 100, 
              uploadId 
            });
            return;
          case -1: // Failed
            setUploadState({ 
              status: 'error', 
              progress: 0, 
              error: status.sliceError || 'Video processing failed',
              uploadId 
            });
            return;
          case 0: // Pending
          case 2: // Processing
            setUploadState(prev => ({ 
              ...prev, 
              status: 'processing',
              uploadId 
            }));
            break;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(() => checkStatus(), 10000); // Check every 10 seconds
        } else {
          setUploadState({ 
            status: 'error', 
            progress: 0, 
            error: 'Upload processing timeout',
            uploadId 
          });
        }
      } catch (error) {
        // Log error for debugging but don't expose to user
        if (process.env.NODE_ENV === 'development') {
          console.error('Status check failed:', error);
        }
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(() => checkStatus(), 10000);
        }
      }
    };

    checkStatus();
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    // Validate required fields
    if (!metadata.title.trim()) {
      setUploadState({ 
        status: 'error', 
        progress: 0, 
        error: t('upload.titleRequired', 'Video title is required') 
      });
      return;
    }

    if (!metadata.category) {
      setUploadState({ 
        status: 'error', 
        progress: 0, 
        error: t('upload.categoryRequired', 'Please select a category') 
      });
      return;
    }

    setUploadState({ status: 'uploading', progress: 0 });

    try {
      const progressCallback = (progress: VideoUploadProgress) => {
        setUploadState(prev => ({ ...prev, progress: progress.percentage }));
      };

      const result = await uploadVideo(selectedFile, metadata, progressCallback);
      
      if (result.success) {
        // Start monitoring the upload status
        setUploadState({ 
          status: 'processing', 
          progress: 100,
          uploadId: result.uploadId 
        });
        
        // Monitor processing status
        monitorUploadStatus(result.uploadId);
      } else {
        setUploadState({ 
          status: 'error', 
          progress: 0, 
          error: result.message 
        });
      }
      
    } catch (error) {
      // Log error for debugging but don't expose to user
      if (process.env.NODE_ENV === 'development') {
        console.error('Upload failed:', error);
      }
      setUploadState({ 
        status: 'error', 
        progress: 0, 
        error: error instanceof Error ? error.message : t('upload.uploadFailed', 'Upload failed. Please try again.') 
      });
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedFile(null);
    setVideoPreview(null);
    setUploadState({ status: 'idle', progress: 0 });
    setIsDragOver(false);
    setMetadata({
      title: '',
      description: '',
      category: '',
      tags: [],
      isPublic: true,
      thumbnail: undefined
    });
    setNewTag('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  // Add tag
  const addTag = () => {
    if (newTag.trim() && !metadata.tags.includes(newTag.trim())) {
      setMetadata((prev: VideoMetadata) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setMetadata((prev: VideoMetadata) => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUpload();
  };

  // Redirect if not authenticated
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('upload.title', 'Upload Video')}
          </h1>
          <p className="text-gray-400 text-lg">
            {t('upload.subtitle', 'Share your content with the world')}
          </p>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          {!selectedFile ? (
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
                isDragOver 
                  ? 'border-[#fbb033] bg-[#fbb033]/10' 
                  : 'border-gray-600 hover:border-[#fbb033]'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FiVideo className={`mx-auto h-16 w-16 mb-4 transition-colors ${
                isDragOver ? 'text-[#fbb033]' : 'text-gray-400'
              }`} />
              <h3 className="text-xl font-semibold text-white mb-2">
                {isDragOver 
                  ? t('upload.dropFile', 'Drop your video file here') 
                  : t('upload.selectVideo', 'Select Video File')
                }
              </h3>
              <p className="text-gray-400 mb-4">
                {t('upload.dragDrop', 'Drag and drop or click to browse')}
              </p>
              <p className="text-sm text-gray-500">
                {t('upload.supportedFormats', 'Supported: MP4, MOV, AVI, WebM (Max 500MB)')}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Upload video file"
              />
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-6">
              {/* Video Preview */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      src={videoPreview || undefined}
                      className="w-full h-full object-contain"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      {isPlaying ? (
                        <FiPause className="h-16 w-16 text-white" />
                      ) : (
                        <FiPlay className="h-16 w-16 text-white" />
                      )}
                    </button>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      <p>{selectedFile.name}</p>
                      <p>{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Upload Form Fields */}
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('upload.videoTitle', 'Video Title')} *
                    </label>
                    <input
                      type="text"
                      value={metadata.title}
                      onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#fbb033] focus:border-transparent"
                      placeholder={t('upload.titlePlaceholder', 'Enter video title')}
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('upload.category', 'Category')} *
                    </label>
                    <select
                      value={metadata.category}
                      onChange={(e) => setMetadata(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#fbb033] focus:border-transparent"
                      required
                    >
                      <option value="">{t('upload.selectCategory', 'Select Category')}</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {t(`upload.categories.${category.toLowerCase()}`, category)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Public/Private */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={metadata.isPublic}
                      onChange={(e) => setMetadata(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="h-4 w-4 text-[#fbb033] focus:ring-[#fbb033] border-gray-600 rounded"
                    />
                    <label htmlFor="isPublic" className="text-sm text-gray-300">
                      {t('upload.makePublic', 'Make this video public')}
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('upload.description', 'Description')}
                </label>
                <textarea
                  value={metadata.description}
                  onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#fbb033] focus:border-transparent"
                  placeholder={t('upload.descriptionPlaceholder', 'Describe your video...')}
                />
              </div>

              {/* Tags */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('upload.tags', 'Tags')}
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {metadata.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#fbb033] text-black"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-black hover:text-gray-700"
                      >
                        <FiX className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#fbb033] focus:border-transparent"
                    placeholder={t('upload.addTag', 'Add a tag...')}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                  >
                    <FiPlus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('upload.thumbnail', 'Custom Thumbnail')} ({t('upload.optional', 'Optional')})
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                  >
                    <FiImage className="h-4 w-4 mr-2" />
                    {t('upload.chooseThumbnail', 'Choose Image')}
                  </button>
                  {metadata.thumbnail && (
                    <span className="text-sm text-gray-400">
                      {metadata.thumbnail.name}
                    </span>
                  )}
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploadState.status !== 'idle' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                {uploadState.status === 'uploading' && (
                  <>
                    <FiUpload className="h-5 w-5 text-[#fbb033] mr-2 animate-spin" />
                    <span className="text-white">{t('upload.uploading', 'Uploading...')}</span>
                  </>
                )}
                {uploadState.status === 'processing' && (
                  <>
                    <FiVideo className="h-5 w-5 text-[#fbb033] mr-2 animate-pulse" />
                    <span className="text-white">{t('upload.processing', 'Processing...')}</span>
                  </>
                )}
                {uploadState.status === 'success' && (
                  <>
                    <FiCheck className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-white">{t('upload.success', 'Upload Successful!')}</span>
                  </>
                )}
                {uploadState.status === 'error' && (
                  <>
                    <FiAlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-white">{t('upload.error', 'Upload Failed')}</span>
                  </>
                )}
              </div>

              {(uploadState.status === 'uploading' || uploadState.status === 'processing') && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-300 mb-2">
                    <span>Progress</span>
                    <span>{uploadState.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-[#fbb033] h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadState.progress}%` }}
                      role="progressbar"
                      aria-valuenow={uploadState.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Upload progress: ${uploadState.progress}%`}
                    />
                  </div>
                </div>
              )}

              {uploadState.error && (
                <p className="text-red-400 text-sm">{uploadState.error}</p>
              )}

              {uploadState.status === 'success' && (
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => router.push('/profile')}
                    className="px-6 py-2 bg-[#fbb033] text-black font-medium rounded-lg hover:bg-[#e09f2d] focus:bg-[#e09f2d] focus:outline-none focus:ring-2 focus:ring-[#fbb033] focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200"
                  >
                    {t('upload.viewInProfile', 'View in Profile')}
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="px-6 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-500 focus:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200"
                  >
                    {t('upload.uploadAnother', 'Upload Another')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          {selectedFile && uploadState.status === 'idle' && (
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={!metadata.title.trim() || !metadata.category}
                className="group px-8 py-3 bg-[#fbb033] text-black font-semibold rounded-lg hover:bg-[#e09f2d] focus:bg-[#e09f2d] focus:outline-none focus:ring-2 focus:ring-[#fbb033] focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-600"
                aria-label={t('upload.startUpload', 'Start Upload')}
              >
                <span className="flex items-center">
                  <FiUpload className="h-5 w-5 mr-2 group-disabled:opacity-50" />
                  {t('upload.startUpload', 'Start Upload')}
                </span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
