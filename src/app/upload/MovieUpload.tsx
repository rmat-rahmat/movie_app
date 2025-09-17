"use client";

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiUpload, FiX, FiCheck, FiPlus } from 'react-icons/fi';
import {
  createMovieUpload,
  uploadFile,
  initializeImageUpload,
  getImageById,
  type MovieUploadRequest,
  type UploadCredential
} from '@/lib/uploadAPI';
import UploadSuccessModal from '@/components/ui/UploadSuccessModal';
import TagSelector from '@/components/ui/TagSelector';
import VideoPlayer from '@/components/ui/VideoPlayer';
import { getCachedCategories, type CategoryItem } from '@/lib/movieApi';

const debugLog = (message: string, data?: unknown) => {
  console.log(`[MovieUpload] ${message}`, data || '');
};

export default function MovieUpload() {
  const { t } = useTranslation('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [moviePreviewUrl, setMoviePreviewUrl] = useState<string | null>(null);
  const [movieCoverPreviewUrl, setMovieCoverPreviewUrl] = useState<string | null>(null);
  const [unsupportedFormatMsg, setUnsupportedFormatMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ progress: 0, status: 'idle' as 'idle' | 'uploading' | 'success' | 'error', error: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadedMovieId, setUploadedMovieId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    file: null as File | null,
    coverUrl: '',
    coverFile: null as File | null,
    customCoverUrl: '',
    categoryId: 'movie',
    year: new Date().getFullYear(),
    region: '',
    language: '',
    director: '',
    actors: '',
    rating: 0,
    tags: [] as string[],
    duration: 30000 // default duration in ms
  });

  useEffect(() => {
    const cachedCategories = getCachedCategories();
    if (cachedCategories) {
      console.log('Loaded cached categories', JSON.stringify(cachedCategories, null, 2));
      setCategories(cachedCategories);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (moviePreviewUrl) {
        try { URL.revokeObjectURL(moviePreviewUrl); } catch { }
      }
      if (movieCoverPreviewUrl) {
        try { URL.revokeObjectURL(movieCoverPreviewUrl); } catch { }
      }
    };
  }, [moviePreviewUrl, movieCoverPreviewUrl]);

  const handleCoverFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    const file = files[0];
    debugLog('Cover file selected', { name: file.name, size: file.size });
    setMovieForm(prev => ({ ...prev, coverFile: file }));
    try {
      const url = URL.createObjectURL(file);
      if (movieCoverPreviewUrl) URL.revokeObjectURL(movieCoverPreviewUrl);
      setMovieCoverPreviewUrl(url);
    } catch { }
  };

  const clearCoverFile = () => {
    debugLog('Clearing cover file and preview');
    if (movieCoverPreviewUrl) {
      try { URL.revokeObjectURL(movieCoverPreviewUrl); } catch { }
    }
    setMovieCoverPreviewUrl(null);
    setMovieForm(prev => ({ ...prev, coverFile: null }));

    // Clear the input field for the image upload
    const coverInput = document.getElementById('movie-cover-file') as HTMLInputElement;
    if (coverInput) {
      coverInput.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    const file = files[0];
    debugLog('File selected', { name: file.name, size: file.size });
    // Check for unsupported formats (keep UI message box, no alerts)
    const fileName = file.name.toLowerCase();
    const unsupportedFormats = ['.flv', '.avi', '.wmv'];
    const isUnsupported = unsupportedFormats.some(format => fileName.endsWith(format));

    if (isUnsupported) {
      const format = fileName.split('.').pop()?.toUpperCase();
      setUnsupportedFormatMsg(t('unsupportedFormatMessage', `${format} format is not supported by this browser and is unavailable for preview.`));
      // Clear any existing selection
      // remove duration key from form state
      setMovieForm(prev => {
        const { duration, ...rest } = prev;
        return rest as typeof prev;
      });
    }
    else {
      setUnsupportedFormatMsg(null);
    }

    // Clear any previous unsupported-format message

    setMovieForm(prev => ({ ...prev, file }));
    try {
      const url = URL.createObjectURL(file);
      if (moviePreviewUrl) URL.revokeObjectURL(moviePreviewUrl);
      setMoviePreviewUrl(url);
    } catch { }
  };

  const clearMovieFile = () => {
    debugLog('Clearing movie file and preview');
    if (moviePreviewUrl) {
      try { URL.revokeObjectURL(moviePreviewUrl); } catch { }
    }
    setMoviePreviewUrl(null);
    setMovieForm(prev => ({ ...prev, file: null }));
  };

  const handleTagsChange = (tags: string[]) => {
    debugLog('Tags changed', { tags });
    setMovieForm(prev => ({ ...prev, tags }));
  };

  const renderProgressBar = () => {
    if (uploadProgress.status === 'idle') return null;
    return (
      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">
            {uploadProgress.status === 'uploading' && t('uploadForm.uploading', 'Uploading...')}
            {uploadProgress.status === 'success' && t('uploadForm.uploadSuccess', 'Upload Complete!')}
            {uploadProgress.status === 'error' && t('uploadForm.uploadFailed', 'Upload Failed')}
          </span>
          <span className="text-sm text-gray-400">{Math.round(uploadProgress.progress)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${uploadProgress.status === 'success' ? 'bg-green-500' :
              uploadProgress.status === 'error' ? 'bg-red-500' : 'bg-[#fbb033]'
              }`}
            style={{ width: `${uploadProgress.progress}%` }}
          />
        </div>

        {uploadProgress.status === 'success' && (
          <div className="flex items-center mt-2 text-green-400 text-sm">
            <FiCheck className="mr-2" />
            {t('uploadForm.uploadSuccess', 'Movie uploaded successfully!')}
          </div>
        )}

        {uploadProgress.status === 'error' && uploadProgress.error && (
          <div className="flex items-start mt-2 text-red-400 text-sm">
            <FiX className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{uploadProgress.error}</span>
          </div>
        )}
      </div>
    );
  };

  const handleMovieUpload = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!movieForm.file || !movieForm.coverFile) {
      console.log('Missing fields:', { file: movieForm.file, coverFile: movieForm.coverFile });
      const missingFields = [];
      if (!movieForm.file) {
        const box = document.getElementById('upload-video-box');
        if (box) {
          box.classList.add('border-red-500');
          try {
            box.scrollIntoView({ behavior: 'smooth', block: 'center' });
            (box as HTMLElement).tabIndex = -1;
            try {
              (box as HTMLElement).focus({ preventScroll: true });
            } catch (err) {
              console.error('Failed to focus upload box', err);
            }

          } catch (err) {
            console.error('Failed to focus upload box', err);
          }
        }
      }
      if (!movieForm.coverFile) {
        const box = document.getElementById('upload-cover-box');
        if (box) box.classList.add('border-red-500');
        missingFields.push(t('uploadForm.coverImageLabel', 'Cover Image'));
      }
      const errorMessage = t('uploadForm.missingFields', 'Please provide the following:') + ' ' + missingFields.join(', ');
      setUploadProgress({ progress: 0, status: 'error', error: errorMessage });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress({ progress: 0, status: 'uploading', error: '' });

    try {
      // If user selected a cover file, upload it first and set coverUrl
      let coverUrl: string | undefined;
      if (movieForm.coverFile) {
        try {
          setIsUploadingCover(true);
          const init = await initializeImageUpload({
            fileName: movieForm.coverFile.name,
            contentType: movieForm.coverFile.type || 'image/jpeg',
            fileSize: movieForm.coverFile.size,
            totalParts: 1,
            imageType: 'cover',
          });

          await uploadFile(movieForm.coverFile, { uploadId: init.uploadId, key: init.key }, (p) => {
            // optional: integrate into uploadProgress
          });

          // const imageMeta = await getImageById(init.id, '360');
          if (init?.id) setMovieForm(prev => ({ ...prev, customCoverUrl: init?.id || '' }));
          coverUrl = init?.id;
        } catch (imgErr) {
          console.error('Cover upload failed', imgErr);
        } finally {
          setIsUploadingCover(false);
        }
      }

      const chunkSize = 8 * 1024 * 1024; // 8MB chunks
      const totalChunks = Math.ceil(movieForm.file.size / chunkSize);

      const movieRequest: MovieUploadRequest = {
        title: movieForm.title,
        fileName: movieForm.file.name,
        fileSize: movieForm.file.size,
        description: movieForm.description || undefined,
        coverUrl: movieForm.coverUrl || undefined,
        customCoverUrl: movieForm.customCoverUrl || coverUrl || undefined,
        duration: movieForm.duration || 30000,
        categoryId: movieForm.categoryId,
        year: movieForm.year,
        region: movieForm.region || undefined,
        language: movieForm.language || undefined,
        director: movieForm.director || undefined,
        actors: movieForm.actors || undefined,
        rating: movieForm.rating || undefined,
        tags: movieForm.tags.length > 0 ? movieForm.tags : undefined,
        totalParts: totalChunks
      };

      debugLog('Creating movie upload credential', movieRequest);
      const uploadCredential: UploadCredential = await createMovieUpload(movieRequest);

      setUploadProgress(prev => ({ ...prev, progress: 10 }));

      await uploadFile(movieForm.file, uploadCredential, (progress) => {
        setUploadProgress(prev => ({ ...prev, progress: 10 + (progress * 0.9) }));
      });

      setUploadProgress({ progress: 100, status: 'success', error: '' });

      // Store the uploaded movie ID and title for the success modal
      setUploadedMovieId(uploadCredential.uploadId || uploadCredential.key || 'unknown');

      // Show success modal instead of resetting form immediately
      setShowSuccessModal(true);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      debugLog('Movie upload failed', { error: errorMessage });
      setUploadProgress({ progress: 0, status: 'error', error: errorMessage || t('uploadForm.uploadFailed', 'Upload failed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadMore = () => {
    // Reset form for new upload
    setMovieForm({ title: '', description: '', file: null, coverUrl: '', coverFile: null, customCoverUrl: '', categoryId: 'movie', year: new Date().getFullYear(), region: '', language: '', director: '', actors: '', rating: 0, tags: [], duration: 30000 });
    if (moviePreviewUrl) {
      try { URL.revokeObjectURL(moviePreviewUrl); } catch { }
    }
    if (movieCoverPreviewUrl) {
      try { URL.revokeObjectURL(movieCoverPreviewUrl); } catch { }
    }
    setMoviePreviewUrl(null);
    setMovieCoverPreviewUrl(null);
    setUploadProgress({ progress: 0, status: 'idle', error: '' });
    setUploadedMovieId(null);
  };

  return (
    <>
      <UploadSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        uploadedId={uploadedMovieId || undefined}
        title={movieForm.title}
        type="movie"
        onUploadMore={handleUploadMore}
      />
      <form onSubmit={handleMovieUpload} className="bg-gray-800 rounded-xl p-8 shadow-2xl">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">{t('uploadForm.videoFileLabel', 'Video File *')}</label>
          <div className="flex items-center justify-center w-full mb-4">
            {!moviePreviewUrl ? (

              <label id="upload-video-box" htmlFor="movie-file-top" className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FiUpload className="w-12 h-12 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-400">{movieForm.file ? movieForm.file.name : t('upload.clickOrDrag', 'Click to upload or drag and drop')}</p>
                  <p className="text-xs text-gray-500">{t('upload.fileTypes', 'MP4, MOV, AVI, MKV (MAX. 10GB)')}</p>
                </div>
                <input
                  id="movie-file-top"
                  type="file"
                  accept="video/*,video/x-flv,video/x-matroska,.flv,.mkv"
                  onChange={handleFileSelect}
                  className="visually-hidden opacity-0"
                  ref={fileInputRef}
                  required
                />
              </label>
            )
              : (
                <div className="w-full flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      {
                        unsupportedFormatMsg ? (
                          <div className="mt-3  p-3 bg-yellow-800 text-yellow-100 rounded">
                            <strong>{unsupportedFormatMsg}</strong>
                            <div className="text-sm mt-1">{t('uploadForm.unsupportedPreviewNote', 'This file will be uploaded normally but this file type cannot be previewed in the browser.')}</div>
                          </div>
                        ) : (
                          <VideoPlayer
                            src={moviePreviewUrl}
                            onDuration={(durationMs) => {
                              debugLog('Video duration loaded', { durationMs });
                              setMovieForm(prev => ({ ...prev, duration: durationMs }));
                            }}
                            className="w-full rounded bg-black"
                            onError={(error) => {
                              console.error('Video player error:', error);
                            }}
                          />
                        )
                      }
                      <button type="button" onClick={clearMovieFile} aria-label="Delete movie file" className="absolute top-2 right-2 z-10 p-2 bg-red-600/50 rounded-full text-white hover:bg-red-500 cursor-pointer">
                        <FiX className="w-4 h-4" />
                      </button>

                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">{t('uploadForm.titlePlaceholder', 'Title *')}</label>
            <input
              type="text"
              required
              value={movieForm.title}
              onChange={(e) => setMovieForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
              placeholder={t('uploadForm.titlePlaceholder', 'Enter movie title')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('upload.year', 'Year')}</label>
            <input
              type="number"
              required
              min="1900"
              max="2030"
              value={movieForm.year}
              onChange={(e) => setMovieForm(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">{t('upload.description', 'Description')}</label>
          <textarea
            rows={4}
            required
            value={movieForm.description}
            onChange={(e) => setMovieForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
            placeholder={t('uploadForm.descriptionPlaceholder', 'Enter movie description')}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="category" className="block text-sm font-medium mb-2">
            {t('uploadForm.categoryLabel', 'Category')}
          </label>
          <select
            required
            id="category"
            name="category"
            value={movieForm.categoryId}
            onChange={(e) => setMovieForm((prev) => ({ ...prev, categoryId: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
          >
            <option value="" >{t('uploadForm.selectCategory', 'Please select')}</option>
            {categories.map((category) => {
              // If category has children, render as an optgroup (parent not selectable)
              if (category.children && category.children.length > 0) {
                return (
                  <optgroup key={category.id} label={category.categoryName || category.categoryAlias || category.id}>
                    {category.children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.categoryName || child.categoryAlias || child.id}
                      </option>
                    ))}
                  </optgroup>
                );
              }

              // No children - render as a normal selectable option
              return (
                <option key={category.id} value={category.id}>
                  {category.categoryName || category.categoryAlias || category.id}
                </option>
              );
            })}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-6 mb-6">
          <label className="block text-sm font-medium mb-2">{t('uploadForm.coverImageLabel', 'Cover Image')}</label>
          <div className="flex items-center gap-4">
            <input type="file" accept="image/*" id="movie-cover-file" onChange={handleCoverFileSelect} className="visually-hidden opacity-0 absolute" required />
            <label htmlFor="movie-cover-file" className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer text-white">Choose Image</label>
            {movieCoverPreviewUrl ? (
              <div className="flex items-center gap-3">
                <img src={movieCoverPreviewUrl} alt="cover preview" className="w-28 h-16 object-cover rounded" />
                <button type="button" onClick={clearCoverFile} className="px-3 py-2 bg-red-600 rounded text-white">{t('uploadForm.clearCover', 'Remove')}</button>
              </div>
            ) : (
              <span className="text-sm text-gray-400">{t('upload.noCoverSelected', 'No cover selected. You may also paste an external URL into the coverUrl field later if needed.')}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">{t('upload.director', 'Director')}</label>
            <input required type="text" value={movieForm.director} onChange={(e) => setMovieForm(prev => ({ ...prev, director: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white" placeholder="Director name" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('upload.actors', 'Actors')}</label>
            <input required type="text" value={movieForm.actors} onChange={(e) => setMovieForm(prev => ({ ...prev, actors: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white" placeholder="Actor1, Actor2, Actor3" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('upload.rating', 'Rating')}</label>
            <input required type="number" min="1" max="10" step="1" value={movieForm.rating} onChange={(e) => setMovieForm(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white" placeholder="8.5" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">{t('upload.region', 'Region')}</label>
            <input
              type="text"
              required
              value={movieForm.region}
              onChange={(e) => setMovieForm(prev => ({ ...prev, region: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
              placeholder="e.g., USA, China, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('upload.language', 'Language')}</label>
            <input
              type="text"
              required
              value={movieForm.language}
              onChange={(e) => setMovieForm(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
              placeholder="e.g., English, Mandarin, etc."
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">{t('upload.tags', 'Tags')}</label>
          <TagSelector
            selectedTags={movieForm.tags}
            onTagsChange={handleTagsChange}
            placeholder={t('upload.searchTags', 'Search and select tags...')}
            required
          />
        </div>


        {renderProgressBar()}

        <div className="flex justify-end mt-8">
          <button type="submit" disabled={isSubmitting || uploadProgress.status === 'uploading'} className="flex items-center px-8 py-4 bg-[#fbb033] text-black font-semibold rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-3"></div>
                {t('uploadForm.uploading', 'Uploading Movie...')}
              </>
            ) : (
              <>
                <FiUpload className="mr-3" />
                {t('upload.uploadMovie', 'Upload Movie')}
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
