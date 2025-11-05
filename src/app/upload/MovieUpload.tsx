"use client";

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiUpload, FiX, FiCheck, FiPlus, FiFile, FiLink } from 'react-icons/fi';
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
import DurationInput from '@/components/ui/DurationInput';
import { getCachedCategories, type CategoryItem } from '@/lib/movieApi';
import { getDirectorList, getActorList, getRegionList, getLanguageList } from '@/lib/movieApi';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import { getLocalizedCategoryName } from '@/utils/categoryUtils';
import Hls from 'hls.js';

const debugLog = (message: string, data?: unknown) => {
  console.log(`[MovieUpload] ${message}`, data || '');
};

export default function MovieUpload() {
  const { t } = useTranslation('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [moviePreviewUrl, setMoviePreviewUrl] = useState<string | null>(null);
  const [HLSPreviewUrl, setHLSPreviewUrl] = useState<string | null>(null);
  const [movieCoverPreviewUrl, setMovieCoverPreviewUrl] = useState<string | null>(null);
  const [movieLandscapePreviewUrl, setMovieLandscapePreviewUrl] = useState<string | null>(null);
  const [unsupportedFormatMsg, setUnsupportedFormatMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingLandscape, setIsUploadingLandscape] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ progress: 0, status: 'idle' as 'idle' | 'uploading' | 'success' | 'error', error: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadedMovieId, setUploadedMovieId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [categoryNameToIdMap, setCategoryNameToIdMap] = useState<Map<string, string>>(new Map());
  const [directorSuggestions, setDirectorSuggestions] = useState<string[]>([]);
  const [actorSuggestions, setActorSuggestions] = useState<string[]>([]);
  const [regionSuggestions, setRegionSuggestions] = useState<string[]>([]);
  const [languageSuggestions, setLanguageSuggestions] = useState<string[]>([]);
  const [fileMethod, setFileMethod] = useState<"UPLOAD" | "LINK">("UPLOAD");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    file: null as File | null,
    coverUrl: '',
    coverFile: null as File | null,
    customCoverUrl: '',
    landscapeFile: null as File | null,
    landscapeThumbnailUrl: '',
    releaseRegions: '',
    sourceProvider: '',
    categoryId: '',
    year: new Date().getFullYear(),
    region: '',
    language: '',
    director: '',
    actors: '',
    rating: 0, // Allow rating to be null or a number
    tags: [] as string[],
    duration: null as number | null, // Allow duration to be null or a number
    m3u8Url: '' as string
  });

  useEffect(() => {
    const loadCategories = async () => {
    const cachedCategories = await getCachedCategories();
    if (cachedCategories) {
      // console.log('Loaded cached categories', JSON.stringify(cachedCategories, null, 2));
      setCategories(cachedCategories);
      
      // Build category suggestions and name-to-id mapping
      const suggestions: string[] = [];
      const nameToIdMap = new Map<string, string>();
      
      cachedCategories.forEach(category => {
        // If category has children, add only children (parent not selectable)
        if (category.children && category.children.length > 0) {
          category.children.forEach(child => {
            const childName = getLocalizedCategoryName(child);
            suggestions.push(childName);
            nameToIdMap.set(childName, child.id);
          });
        } else {
          // No children - add the category itself
          const categoryName = getLocalizedCategoryName(category);
          suggestions.push(categoryName);
          nameToIdMap.set(categoryName, category.id);
        }
      });
      
      setCategorySuggestions(suggestions);
      setCategoryNameToIdMap(nameToIdMap);
    }
    else{
      
    }
    // preload director/actor/region suggestions
    (async () => {
      try {
        const [dirs, acts, regs, langs] = await Promise.all([
          getDirectorList('', undefined, 1, 50),
          getActorList('', undefined, 1, 50),
          getRegionList('', 1, 200),
          getLanguageList('', '', 1, 200)
        ]);
        if (Array.isArray(dirs)) setDirectorSuggestions(dirs.slice(0, 100));
        if (Array.isArray(acts)) setActorSuggestions(acts.slice(0, 200));
        if (Array.isArray(regs)) setRegionSuggestions(regs.slice(0, 200));
        if (Array.isArray(langs)) setLanguageSuggestions(langs.slice(0, 200));
      } catch (e) {
        console.warn('Failed to preload suggestions', e);
      }
    })();
  }
  loadCategories()
  }, []);

  useEffect(() => {
    return () => {
      if (moviePreviewUrl) {
        try { URL.revokeObjectURL(moviePreviewUrl); } catch { }
      }
      if (movieCoverPreviewUrl) {
        try { URL.revokeObjectURL(movieCoverPreviewUrl); } catch { }
      }
      if (movieLandscapePreviewUrl) {
        try { URL.revokeObjectURL(movieLandscapePreviewUrl); } catch { }
      }
    };
  }, [moviePreviewUrl, movieCoverPreviewUrl, movieLandscapePreviewUrl]);

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

  const handleLandscapeFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    const file = files[0];
    debugLog('Landscape file selected', { name: file.name, size: file.size });

    // store file in form state
    setMovieForm(prev => ({ ...prev, landscapeFile: file }));
    try {
      const url = URL.createObjectURL(file);
      if (movieLandscapePreviewUrl) URL.revokeObjectURL(movieLandscapePreviewUrl);
      setMovieLandscapePreviewUrl(url);
    } catch { }
  };

  const clearLandscapeFile = () => {
    debugLog('Clearing landscape file and preview');
    if (movieLandscapePreviewUrl) {
      try { URL.revokeObjectURL(movieLandscapePreviewUrl); } catch { }
    }
    setMovieLandscapePreviewUrl(null);
    setMovieForm(prev => ({ ...prev, landscapeFile: null }));

    const input = document.getElementById('movie-landscape-file') as HTMLInputElement;
    if (input) input.value = '';
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

  // Helper function to get category name from ID
  const getCategoryNameFromId = (categoryId: string): string => {
    if (!categoryId) return '';
    // Search in categories (including children)
    for (const category of categories) {
      if (category.id === categoryId) {
        return getLocalizedCategoryName(category);
      }
      if (category.children && category.children.length > 0) {
        const child = category.children.find(c => c.id === categoryId);
        if (child) {
          return getLocalizedCategoryName(child);
        }
      }
    }
    return categoryId; // fallback to ID if not found
  };

  // Helper function to handle category selection by name
  const handleCategoryChange = (categoryName: string) => {
    const categoryId = categoryNameToIdMap.get(categoryName) || categoryName;
    setMovieForm(prev => ({ ...prev, categoryId }));
  };

  const renderProgressBar = () => {
    if (uploadProgress.status === 'idle') return null;
    return (
      <div className="mt-6 p-4 rounded-3xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">
            {uploadProgress.status === 'uploading' && t('uploadForm.uploading', 'Uploading...')}
            {uploadProgress.status === 'success' && t('uploadForm.uploadSuccess', 'Upload Complete!')}
            {uploadProgress.status === 'error' && t('uploadForm.uploadFailed', 'Upload Failed')}
          </span>
          <span className="text-sm text-gray-400">{Math.round(uploadProgress.progress)}%</span>
        </div>
        <div className="w-full rounded-full h-2">
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
    if (!(movieForm.file || movieForm.m3u8Url) || !movieForm.coverFile) {
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
      let landscapeId: string | undefined;
      
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

      // If user selected a landscape thumbnail file, upload it the same way
      if (movieForm.landscapeFile) {
        try {
          setIsUploadingLandscape(true);
          const lInit = await initializeImageUpload({
            fileName: movieForm.landscapeFile.name,
            contentType: movieForm.landscapeFile.type || 'image/jpeg',
            fileSize: movieForm.landscapeFile.size,
            totalParts: 1,
            imageType: 'landscape',
          });

          await uploadFile(movieForm.landscapeFile, { uploadId: lInit.uploadId, key: lInit.key }, (p) => {
            // optional: integrate progress
          });

          if (lInit?.id) {
            setMovieForm(prev => ({ ...prev, landscapeThumbnailUrl: lInit.id || '' }));
            landscapeId = lInit.id;
          }
        } catch (lErr) {
          console.error('Landscape upload failed', lErr);
        } finally {
          setIsUploadingLandscape(false);
        }
      }


      if (fileMethod === "LINK" && movieForm.m3u8Url) {

        const movieRequest: MovieUploadRequest = {
          title: movieForm.title,
          uploadType: 'M3U8_URL',
          description: movieForm.description || undefined,
          coverUrl: movieForm.coverUrl || undefined,
          customCoverUrl: movieForm.customCoverUrl || coverUrl || undefined,
          landscapeThumbnailUrl: movieForm.landscapeThumbnailUrl || landscapeId || undefined,
          duration: movieForm.duration || 30000,
          categoryId: movieForm.categoryId,
          year: movieForm.year,
          region: movieForm.region || undefined,
          language: movieForm.language || undefined,
          director: movieForm.director || undefined,
          actors: movieForm.actors ? (movieForm.actors.startsWith('/') ? movieForm.actors : `/${movieForm.actors.split(',').map(a => a.trim()).join('/')}`) : undefined,
          releaseRegions: movieForm.releaseRegions || undefined,
          rating: movieForm.rating || 0,
          tags: movieForm.tags.length > 0 ? movieForm.tags : undefined,
          sourceProvider: movieForm.sourceProvider || undefined,
          m3u8Url: movieForm.m3u8Url
        };

        debugLog('Creating movie upload credential', movieRequest);
        const uploadCredential = await createMovieUpload(movieRequest);
        if (!uploadCredential) {
          throw new Error('Failed to obtain upload credentials');
        }
        setUploadProgress({ progress: 100, status: 'success', error: '' });
        setShowSuccessModal(true);
        return;
      }

      // Proceed with movie file upload
      if (!movieForm.file) {
        throw new Error('No movie file selected for upload');
      }
      const chunkSize = 10 * 1024 * 1024; // 10MB chunks
      const totalChunks = Math.ceil(movieForm.file.size / chunkSize);

      const movieRequest: MovieUploadRequest = {
        title: movieForm.title,
        uploadType: 'FILE_UPLOAD',
        fileName: movieForm.file.name,
        fileSize: movieForm.file.size,
        description: movieForm.description || undefined,
        coverUrl: movieForm.coverUrl || undefined,
        customCoverUrl: movieForm.customCoverUrl || coverUrl || undefined,
        landscapeThumbnailUrl: movieForm.landscapeThumbnailUrl || landscapeId || undefined,
        duration: movieForm.duration || 30000,
        categoryId: movieForm.categoryId,
        year: movieForm.year,
        region: movieForm.region || undefined,
        language: movieForm.language || undefined,
        director: movieForm.director || undefined,
        actors: movieForm.actors ? (movieForm.actors.startsWith('/') ? movieForm.actors : `/${movieForm.actors.split(',').map(a => a.trim()).join('/')}`) : undefined,
        releaseRegions: movieForm.releaseRegions || undefined,
        rating: movieForm.rating || 0,
        tags: movieForm.tags.length > 0 ? movieForm.tags : undefined,
        sourceProvider: movieForm.sourceProvider || undefined,
        totalParts: totalChunks
      };

      debugLog('Creating movie upload credential', movieRequest);
      const uploadCredential = await createMovieUpload(movieRequest);
      if (!uploadCredential) {
        throw new Error('Failed to obtain upload credentials');
      }

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
    setMovieForm({ 
      title: '', 
      description: '', 
      m3u8Url: '', 
      file: null, 
      coverUrl: '', 
      coverFile: null, 
      customCoverUrl: '', 
      landscapeFile: null,
      landscapeThumbnailUrl: '',
      releaseRegions: '',
      sourceProvider: '',
      categoryId: 'movie', 
      year: new Date().getFullYear(), 
      region: '', 
      language: '', 
      director: '', 
      actors: '', 
      rating: 0, 
      tags: [], 
      duration: 30000 
    });
    if (moviePreviewUrl) {
      try { URL.revokeObjectURL(moviePreviewUrl); } catch { }
    }
    if (movieCoverPreviewUrl) {
      try { URL.revokeObjectURL(movieCoverPreviewUrl); } catch { }
    }
    if (movieLandscapePreviewUrl) {
      try { URL.revokeObjectURL(movieLandscapePreviewUrl); } catch { }
    }
    setMoviePreviewUrl(null);
    setMovieCoverPreviewUrl(null);
    setMovieLandscapePreviewUrl(null);
    setUploadProgress({ progress: 0, status: 'idle', error: '' });
    setUploadedMovieId(null);
  };


  const handleHLSPreview = (url: string) => {
    console.log('Setting up HLS preview for URL:', url);
    const videoElement = videoRef.current;

    if (!videoElement) return;
    // Clean up existing HLS instance
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch (_e) { }
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr) => {
          // xhr.setRequestHeader('api-key', process.env.UPLOAD_API_KEY || '');
        }
      });

      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(videoElement);
      console.log('HLS instance created and source loaded', url);
      hls.on(Hls.Events.MANIFEST_PARSED, async () => {
        console.log('HLS manifest parsed, starting playback');
        videoElement.play().catch(console.error);

        if (videoElement.duration && !isNaN(videoElement.duration) && isFinite(videoElement.duration) && videoElement.duration > 0) {
          setMovieForm(prev => ({ ...prev, duration: Math.round(videoElement.duration * 1000) }));
        } else {
          const waitForMeta = () => new Promise<void>((resolve) => {
            if (!videoElement) return resolve();
            if (!isNaN(videoElement.duration) && isFinite(videoElement.duration)) return resolve();
            const onLoaded = () => { videoElement.removeEventListener('loadedmetadata', onLoaded); resolve(); };
            videoElement.addEventListener('loadedmetadata', onLoaded);
          });
          await waitForMeta();
          if (videoElement && !isNaN(videoElement.duration) && isFinite(videoElement.duration) && videoElement.duration > 0) {
            setMovieForm(prev => ({ ...prev, duration: Math.round(videoElement.duration * 1000) }));
          }
        }
      });

    }
  }

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
      <form onSubmit={handleMovieUpload} className=" rounded-xl md:p-8 p-1 shadow-2xl">
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">{t('uploadForm.videoFileLabel', 'Video File *')}</label>
          <div className="flex justify-center mb-8 w-full">
            <div className="p-1 flex md:gap-6 gap-2">

              <div onClick={() => setFileMethod("UPLOAD")}
                className={`cursor-pointer relative group rounded-lg overflow-hidden flex flex-col items-center justify-center md:justify-end p-2 md:p-8 bg-gradient-to-br from-gray-800 to-black hover:scale-105 transform transition duration-300 ${fileMethod === "UPLOAD" ? "ring-4 ring-[#fbb033]" : ""}`}
              >
                <div className="absolute inset-0 opacity-10 bg-[url('/images/hero-movie.jpg')] bg-cover bg-center"></div>
                <div className="z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <FiFile className="text-[#fbb033] md:text-3xl" />
                    <h2 className="md:text-2xl font-bold">{t('upload.upload', 'Upload')}</h2>
                  </div>
                </div>
              </div>

              <div onClick={() => setFileMethod("LINK")}
                className={`cursor-pointer relative group rounded-lg overflow-hidden flex flex-col items-center justify-center md:justify-end p-2 md:p-8 bg-gradient-to-br from-gray-800 to-black hover:scale-105 transform transition duration-300 ${fileMethod === "LINK" ? "ring-4 ring-[#fbb033]" : ""}`}
              >
                <div className="absolute inset-0 opacity-10 bg-[url('/images/hero-series.jpg')] bg-cover bg-center"></div>
                <div className="z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <FiLink className="text-[#fbb033] md:text-3xl" />
                    <h2 className="md:text-2xl font-bold">{t('upload.link', 'URL Link')}</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center w-full mb-4">
            {!moviePreviewUrl ?
              fileMethod === "UPLOAD" ?
                <label id="upload-video-box" htmlFor="movie-file-top" className="flex flex-col items-center justify-center w-full bg-[#fbb033]/[0.2] rounded-3xl cursor-pointer hover:bg-[#fbb033]/[0.1] transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-3 px-2">
                    <FiUpload className="w-12 h-12 mb-3 " />
                    <p className="mb-2 md:text-xl ">{movieForm.file ? movieForm.file.name : t('upload.clickOrDrag', 'Click to upload or drag and drop')}</p>
                    <p className="text-xs ">{t('upload.fileTypes', 'MP4, MOV, MKV, WEBM (MAX. 10GB)')}</p>
                    <p className="md:text-xl mt-3 mb-6 ">{t('upload.videoPrivacy', 'Your Video Will Remain Private Until It Is Published')}</p>
                    <span className="px-7 py-2 bg-[#fbb033] rounded-3xl mt-2">{t('uploadForm.chooseFile', 'Choose File')}</span>
                  </div>
                  <input
                    id="movie-file-top"
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-matroska,video/webm,.mp4,.mov,.mkv,.webm"
                    onChange={handleFileSelect}
                    className="visually-hidden opacity-0"
                    ref={fileInputRef}
                    required
                  />
                </label> :
                <div className="mb-6 w-full">
                  <label className="block text-lg font-medium mb-2">{t('upload.url', 'URL Link')}</label>
                  <input
                    type="url"
                    required
                    value={movieForm.m3u8Url}
                    onChange={(e) => {
                      setMovieForm(prev => ({ ...prev, m3u8Url: e.target.value }))
                      const url = e.target.value;
                      setMovieForm(prev => ({ ...prev, m3u8Url: url }));
                      // simple validation: must be a non-empty http/https URL
                      if (!url || url.trim() === '') {
                        setUploadProgress(prev => ({ ...prev, status: 'idle', error: '' }));
                        return;
                      }
                      try {
                        const parsed = new URL(url);
                        if (!['http:', 'https:'].includes(parsed.protocol)) {
                          throw new Error('invalid-protocol');
                        }
                        // valid URL
                        // setUploadProgress(prev => ({ ...prev, status: 'idle', error: '' }));
                        setHLSPreviewUrl(url);
                        handleHLSPreview(url);
                      } catch {
                        setUploadProgress({ progress: 0, status: 'error', error: t('uploadForm.invalidUrl', 'Please enter a valid http(s) URL') });
                      }
                    }}
                    className="w-full px-4 py-3 border border-[#fbb033] h-24 rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
                    placeholder={t('uploadForm.urlPlaceholder', 'Enter movie URL')}
                  />
                </div>

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
          {
            HLSPreviewUrl && fileMethod === "LINK" && (
              <div className="w-full flex items-center justify-between gap-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    // src={HLSPreviewUrl}
                    controls
                    className="w-full rounded bg-black"
                    onError={(error) => {
                      console.error('Video player error:', error);
                    }}
                  />
                </div>
              </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-lg font-medium mb-2">{t('movie.duration', 'Duration *')}</label>
            <DurationInput
              value={movieForm.duration}
              onChange={(durationMs) => setMovieForm(prev => ({ ...prev, duration: durationMs }))}
              required
              className="w-full"
              placeholder="Enter duration"
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-2">{t('upload.year', 'Year')}</label>
            <input
              type="number"
              required
              min="1900"
              max="2030"
              value={movieForm.year}
              onChange={(e) => setMovieForm(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
              className="w-full px-4 py-3  border border-[#fbb033] rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
          <div>
            <label className="block text-lg font-medium mb-2">{t('uploadForm.title', 'Title *')}</label>
            <input
              type="text"
              required
              value={movieForm.title}
              onChange={(e) => setMovieForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-[#fbb033] h-24 rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
              placeholder={t('uploadForm.titlePlaceholder', 'Enter movie title')}
            />
          </div>

        </div>

        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">{t('upload.description', 'Description')}</label>
          <textarea
            rows={4}
            required
            value={movieForm.description}
            onChange={(e) => setMovieForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-3  border border-[#fbb033] rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
            placeholder={t('uploadForm.descriptionPlaceholder', 'Enter movie description')}
          />
        </div>
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">{t('upload.tags', 'Tags')}</label>
          <TagSelector
            selectedTags={movieForm.tags}
            onTagsChange={handleTagsChange}
            placeholder={t('upload.searchTags', 'Search and select tags...')}
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="category" className="block text-lg font-medium mb-2">
            {t('uploadForm.categoryLabel', 'Category')}
          </label>
          <SearchableDropdown
            id="category"
            value={getCategoryNameFromId(movieForm.categoryId)}
            onChange={handleCategoryChange}
            suggestions={categorySuggestions}
            placeholder={t('uploadForm.categoryPlaceholder', 'Select category')}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">{t('uploadForm.coverImageLabel', 'Cover (Portrait) & Landscape')}</label>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Portrait Cover */}
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-2">{t('uploadForm.portraitCover', 'Portrait Cover')}</p>
              <div className="flex items-center gap-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  id="movie-cover-file" 
                  onChange={handleCoverFileSelect} 
                  className="visually-hidden opacity-0 absolute z-[-100]" 
                  required 
                />
                <label 
                  htmlFor="movie-cover-file" 
                  className="px-4 py-2 border border-[#fbb033] rounded-3xl cursor-pointer text-white text-sm whitespace-nowrap"
                >
                  {t('uploadForm.choosePortrait', 'Choose Portrait')}
                </label>
                {movieCoverPreviewUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={movieCoverPreviewUrl} alt="cover preview" className="w-24 h-36 object-cover rounded" />
                    <button 
                      type="button" 
                      onClick={clearCoverFile} 
                      className="px-2 py-1 bg-red-600 rounded text-white text-sm"
                    >
                      {t('uploadForm.remove', 'Remove')}
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">{t('uploadForm.noImageSelected', 'No image selected')}</span>
                )}
              </div>
            </div>

            {/* Landscape Thumbnail */}
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-2">{t('uploadForm.landscapeThumbnail', 'Landscape Thumbnail')}</p>
              <div className="flex items-center gap-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  id="movie-landscape-file" 
                  onChange={handleLandscapeFileSelect} 
                  className="visually-hidden opacity-0 absolute z-[-100]" 
                />
                <label 
                  htmlFor="movie-landscape-file" 
                  className="px-4 py-2 border border-[#fbb033] rounded-3xl cursor-pointer text-white text-sm whitespace-nowrap"
                >
                  {t('uploadForm.chooseLandscape', 'Choose Landscape')}
                </label>
                {movieLandscapePreviewUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={movieLandscapePreviewUrl} alt="landscape preview" className="w-48 h-28 object-cover rounded" />
                    <button 
                      type="button" 
                      onClick={clearLandscapeFile} 
                      className="px-2 py-1 bg-red-600 rounded text-white text-sm"
                    >
                      {t('uploadForm.remove', 'Remove')}
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">{t('uploadForm.optional', 'Optional')}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-lg font-medium mb-2">{t('upload.director', 'Director')}</label>
            <SearchableDropdown
              id="director"
              value={movieForm.director}
              onChange={(v) => setMovieForm(prev => ({ ...prev, director: v }))}
              suggestions={directorSuggestions}
              placeholder={t('upload.directorPlaceholder', 'Director Name')}
              required  
              multi
            />
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">{t('upload.actors', 'Actors')}</label>
            <SearchableDropdown
              id="actors"
              value={movieForm.actors}
              onChange={(v) => setMovieForm(prev => ({ ...prev, actors: v }))}
              suggestions={actorSuggestions}
              placeholder={t('upload.actorsPlaceholder', 'Actor Names')}
              multi
              required
            />

            <p className="text-sm text-gray-400 mt-2 ml-2">{t('uploadForm.actorSupportedFormats', 'Supported formats: /Actor1/Actor2/Actor3 or Actor1, Actor2, Actor3). Example: /Zhang Luyi/Yu Hewei/Chen Jin')}</p>
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">{t('upload.rating', 'Rating')}</label>
            <input
              type="number"
              required
              min="0"
              max="10"
              step="1"
              value={movieForm.rating ?? ''} // Show empty if null
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : Math.max(0, Math.min(10, parseFloat(e.target.value)));
                setMovieForm(prev => ({ ...prev, rating: value }));
              }}
              className="w-full px-4 py-3  border border-[#fbb033] rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
              placeholder="Enter rating (0-10)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-lg font-medium mb-2">{t('upload.region', 'Region')}</label>
            <SearchableDropdown
              id="region"
              value={movieForm.region}
              onChange={(v) => setMovieForm(prev => ({ ...prev, region: v }))}
              suggestions={regionSuggestions}
              placeholder={t('upload.regionPlaceholder', 'e.g., USA, China, etc.')}
              required
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-2">{t('upload.language', 'Language')}</label>
            <SearchableDropdown
              id="language"
              value={movieForm.language}
              onChange={(v) => setMovieForm(prev => ({ ...prev, language: v }))}
              suggestions={languageSuggestions}
              placeholder={t('upload.languagePlaceholder', 'e.g., English, Mandarin, etc.')}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-lg font-medium mb-2">{t('upload.releaseRegions', 'Release Regions')}</label>
           
            <SearchableDropdown
              id="releaseRegions"
              value={movieForm.releaseRegions}
              onChange={(v) => setMovieForm(prev => ({ ...prev, releaseRegions: v }))}
              suggestions={regionSuggestions}
              placeholder={t('uploadForm.releaseRegionsPlaceholder', 'e.g., United States, United Kingdom')}
              required
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-2">{t('upload.sourceProvider', 'Source Provider')}</label>
            <input
              type="text"
              required
              value={movieForm.sourceProvider}
              onChange={(e) => setMovieForm(prev => ({ ...prev, sourceProvider: e.target.value }))}
              className="w-full px-4 py-3 border border-[#fbb033] rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
              placeholder={t('uploadForm.sourceProviderPlaceholder', 'e.g., Warner Bros, Marvel Studios')}
            />
          </div>
        </div>

        {renderProgressBar()}

        <div className="flex justify-end mt-8">
          <button type="submit" disabled={isSubmitting || uploadProgress.status === 'uploading'} className="flex justify-center w-full  lg:w-auto  items-center px-8 py-4 bg-[#fbb033] text-black text-center font-semibold rounded-3xl hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
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
