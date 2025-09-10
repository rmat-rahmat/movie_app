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

const debugLog = (message: string, data?: unknown) => {
  console.log(`[MovieUpload] ${message}`, data || '');
};

export default function MovieUpload() {
  const { t } = useTranslation('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [moviePreviewUrl, setMoviePreviewUrl] = useState<string | null>(null);
  const [movieCoverPreviewUrl, setMovieCoverPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ progress: 0, status: 'idle' as 'idle' | 'uploading' | 'success' | 'error', error: '' });

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
    tagInput: ''
  });

  useEffect(() => {
    return () => {
      if (moviePreviewUrl) {
        try { URL.revokeObjectURL(moviePreviewUrl); } catch {}
      }
      if (movieCoverPreviewUrl) {
        try { URL.revokeObjectURL(movieCoverPreviewUrl); } catch {}
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
    } catch {}
  };

  const clearCoverFile = () => {
    debugLog('Clearing cover file and preview');
    if (movieCoverPreviewUrl) {
      try { URL.revokeObjectURL(movieCoverPreviewUrl); } catch {}
    }
    setMovieCoverPreviewUrl(null);
    setMovieForm(prev => ({ ...prev, coverFile: null }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    const file = files[0];
    debugLog('File selected', { name: file.name, size: file.size });
    setMovieForm(prev => ({ ...prev, file }));
    try {
      const url = URL.createObjectURL(file);
      if (moviePreviewUrl) URL.revokeObjectURL(moviePreviewUrl);
      setMoviePreviewUrl(url);
    } catch {}
  };

  const clearMovieFile = () => {
    debugLog('Clearing movie file and preview');
    if (moviePreviewUrl) {
      try { URL.revokeObjectURL(moviePreviewUrl); } catch {}
    }
    setMoviePreviewUrl(null);
    setMovieForm(prev => ({ ...prev, file: null }));
  };

  const addTag = () => {
    if (movieForm.tagInput.trim() && !movieForm.tags.includes(movieForm.tagInput.trim())) {
      debugLog('Adding tag', { tag: movieForm.tagInput.trim() });
      setMovieForm(prev => ({ ...prev, tags: [...prev.tags, prev.tagInput.trim()], tagInput: '' }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    debugLog('Removing tag', { tag: tagToRemove });
    setMovieForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
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
            className={`h-2 rounded-full transition-all duration-300 ${
              uploadProgress.status === 'success' ? 'bg-green-500' :
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
    if (!movieForm.file || !movieForm.title.trim()) {
      setUploadProgress({ progress: 0, status: 'error', error: t('uploadForm.provideTitleAndFile', 'Please provide title and select a file') });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress({ progress: 0, status: 'uploading', error: '' });

    try {
      // If user selected a cover file, upload it first and set coverUrl
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

          const imageMeta = await getImageById(init.id, '360');
          if (imageMeta?.url) setMovieForm(prev => ({ ...prev, coverUrl: imageMeta.url || '' }));
        } catch (imgErr) {
          console.error('Cover upload failed', imgErr);
        } finally {
          setIsUploadingCover(false);
        }
      }

      const movieRequest: MovieUploadRequest = {
        title: movieForm.title,
        fileName: movieForm.file.name,
        fileSize: movieForm.file.size,
        description: movieForm.description || undefined,
        coverUrl: movieForm.coverUrl || undefined,
        customCoverUrl: movieForm.customCoverUrl || undefined,
        duration: undefined,
        categoryId: movieForm.categoryId,
        year: movieForm.year,
        region: movieForm.region || undefined,
        language: movieForm.language || undefined,
        director: movieForm.director || undefined,
        actors: movieForm.actors || undefined,
        rating: movieForm.rating || undefined,
        tags: movieForm.tags.length > 0 ? movieForm.tags : undefined
      };

      debugLog('Creating movie upload credential', movieRequest);
      const uploadCredential: UploadCredential = await createMovieUpload(movieRequest);

      setUploadProgress(prev => ({ ...prev, progress: 10 }));

      await uploadFile(movieForm.file, uploadCredential, (progress) => {
        setUploadProgress(prev => ({ ...prev, progress: 10 + (progress * 0.9) }));
      });

  setUploadProgress({ progress: 100, status: 'success', error: '' });
  setMovieForm({ title: '', description: '', file: null, coverUrl: '', coverFile: null, customCoverUrl: '', categoryId: 'movie', year: new Date().getFullYear(), region: '', language: '', director: '', actors: '', rating: 0, tags: [], tagInput: '' });
      if (moviePreviewUrl) {
        try { URL.revokeObjectURL(moviePreviewUrl); } catch {}
      }
      setMoviePreviewUrl(null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
  debugLog('Movie upload failed', { error: errorMessage });
  setUploadProgress({ progress: 0, status: 'error', error: errorMessage || t('uploadForm.uploadFailed', 'Upload failed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleMovieUpload} className="bg-gray-800 rounded-xl p-8 shadow-2xl">
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">{t('uploadForm.videoFileLabel', 'Video File *')}</label>
        <div className="flex items-center justify-center w-full mb-4">
          {!moviePreviewUrl ? (
            <label htmlFor="movie-file-top" className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FiUpload className="w-12 h-12 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-400">{movieForm.file ? movieForm.file.name : t('upload.clickOrDrag', 'Click to upload or drag and drop')}</p>
                <p className="text-xs text-gray-500">{t('upload.fileTypes', 'MP4, MOV, AVI, MKV (MAX. 10GB)')}</p>
              </div>
              <input id="movie-file-top" type="file" accept="video/*" onChange={handleFileSelect} className="hidden" ref={fileInputRef} required />
            </label>
          ) : (
            <div className="w-full flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <button type="button" onClick={clearMovieFile} aria-label="Delete movie file" className="absolute top-2 right-2 z-10 p-2 bg-red-600 rounded-full text-white hover:bg-red-500">
                    <FiX className="w-4 h-4" />
                  </button>
                  <video src={moviePreviewUrl} controls className="w-full rounded bg-black" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">{t('uploadForm.titlePlaceholder', 'Title *')}</label>
          <input type="text" required value={movieForm.title} onChange={(e) => setMovieForm(prev => ({ ...prev, title: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white" placeholder={t('uploadForm.titlePlaceholder', 'Enter movie title')} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t('upload.year', 'Year')}</label>
          <input type="number" min="1900" max="2030" value={movieForm.year} onChange={(e) => setMovieForm(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white" />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">{t('upload.description', 'Description')}</label>
        <textarea rows={4} value={movieForm.description} onChange={(e) => setMovieForm(prev => ({ ...prev, description: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white" placeholder={t('uploadForm.descriptionPlaceholder', 'Enter movie description')} />
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
  <label className="block text-sm font-medium mb-2">{t('uploadForm.coverImageLabel', 'Cover Image')}</label>
        <div className="flex items-center gap-4">
          <input type="file" accept="image/*" id="movie-cover-file" onChange={handleCoverFileSelect} className="hidden" />
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
          <input type="text" value={movieForm.director} onChange={(e) => setMovieForm(prev => ({ ...prev, director: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white" placeholder="Director name" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t('upload.actors', 'Actors')}</label>
          <input type="text" value={movieForm.actors} onChange={(e) => setMovieForm(prev => ({ ...prev, actors: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white" placeholder="Actor1, Actor2, Actor3" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t('upload.rating', 'Rating')}</label>
          <input type="number" min="0" max="10" step="0.1" value={movieForm.rating} onChange={(e) => setMovieForm(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white" placeholder="8.5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">{t('upload.region', 'Region')}</label>
          <input type="text" value={movieForm.region} onChange={(e) => setMovieForm(prev => ({ ...prev, region: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white" placeholder="e.g., USA, China, etc." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t('upload.language', 'Language')}</label>
          <input type="text" value={movieForm.language} onChange={(e) => setMovieForm(prev => ({ ...prev, language: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white" placeholder="e.g., English, Chinese, etc." />
        </div>
      </div>

      <div className="mb-6">
  <label className="block text-sm font-medium mb-2">{t('upload.tags', 'Tags')}</label>
        <div className="flex gap-2 mb-3">
          <input type="text" value={movieForm.tagInput} onChange={(e) => setMovieForm(prev => ({ ...prev, tagInput: e.target.value }))} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white" placeholder={t('uploadForm.addTag', 'Add a tag and press Enter')} />
          <button type="button" onClick={addTag} className="px-4 py-3 bg-[#fbb033] text-black rounded-lg hover:bg-yellow-500 transition-colors"><FiPlus /></button>
        </div>
        <div className="flex flex-wrap gap-2">
          {movieForm.tags.map((tag, index) => (
            <span key={index} className="flex items-center px-3 py-1 bg-gray-700 text-white rounded-full text-sm">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="ml-2 text-gray-400 hover:text-red-400"><FiX /></button>
            </span>
          ))}
        </div>
      </div>

      {renderProgressBar()}

      <div className="flex justify-end mt-8">
        <button type="submit" disabled={isSubmitting || uploadProgress.status === 'uploading'} className="flex items-center px-8 py-4 bg-[#fbb033] text-black font-semibold rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
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
  );
}
