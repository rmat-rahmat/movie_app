"use client";

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiUpload, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import { createSeries, createEpisode, initializeEpisodeUpload, uploadFile, initializeImageUpload, getImageById, type SeriesCreateRequest, type EpisodeCreateRequest, type EpisodeUploadRequest } from '@/lib/uploadAPI';
import UploadSuccessModal from '@/components/ui/UploadSuccessModal';
import TagSelector from '@/components/ui/TagSelector';
import VideoPlayer from '@/components/ui/VideoPlayer';
import DurationInput from '@/components/ui/DurationInput';
import { getCachedCategories, type CategoryItem, getLanguageList, getDirectorList, getActorList, getRegionList } from '@/lib/movieApi';
import { getLocalizedCategoryName } from '@/utils/categoryUtils';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import EpisodeFile from './EpisodeFile';

interface Episode {
  number: number;
  title: string;
  description: string;
  file: File | null;
  customCoverUrl?: string;
  duration?: number | null;
  m3u8Url?: string | null;


}

const debugLog = (message: string, data?: unknown) => {
  console.log(`[SeriesUpload] ${message}`, data || '');
};

export default function SeriesUpload() {
  const { t } = useTranslation('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [episodePreviewUrl, setEpisodePreviewUrl] = useState<string | null>(null);
  const [episodePreviewUrlList, setEpisodePreviewUrlList] = useState<string[]>([]);
  const [seriesPreviewIndex, setSeriesPreviewIndex] = useState<number>(0);
  const [seriesCoverPreviewUrl, setSeriesCoverPreviewUrl] = useState<string | null>(null);
  const [seriesLandscapePreviewUrl, setSeriesLandscapePreviewUrl] = useState<string | null>(null);
  const [unsupportedFormatsMsg, setUnsupportedFormatsMsg] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingLandscape, setIsUploadingLandscape] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ progress: 0, status: 'idle' as 'idle' | 'uploading' | 'success' | 'error', error: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadedSeriesId, setUploadedSeriesId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [categoryNameToIdMap, setCategoryNameToIdMap] = useState<Map<string, string>>(new Map());
  const [languageSuggestions, setLanguageSuggestions] = useState<string[]>([]);
  const [directorSuggestions, setDirectorSuggestions] = useState<string[]>([]);
  const [actorSuggestions, setActorSuggestions] = useState<string[]>([]);
  const [regionSuggestions, setRegionSuggestions] = useState<string[]>([]);

  interface SeriesForm {
    title: string;
    description: string;
    customCoverUrl: string;
    coverFile: File | null;
    landscapeFile?: File | null;
    categoryId: string;
    year: number;
    region: string;
    language: string;
    director: string;
    actors: string;
    landscapeThumbnailUrl?: string;
    releaseRegions?: string;
    sourceProvider?: string;
    rating: number | null;
    tags: string[];
    seasonNumber: number;
    totalEpisodes: number;
    episodes: Episode[];
  }

  const [seriesForm, setSeriesForm] = useState<SeriesForm>({
    title: '',
    description: '',
    customCoverUrl: '',
    coverFile: null,
    categoryId: '',
    year: new Date().getFullYear(),
    region: '',
    language: '',
    director: '',
    actors: '',
    landscapeThumbnailUrl: '',
    landscapeFile: null,
    releaseRegions: '',
    sourceProvider: '',
    rating: 0,
    tags: [],
    seasonNumber: 1,
    totalEpisodes: 1,
    episodes: [
      { number: 1, title: 'Episode 1', description: '', file: null, customCoverUrl: '', duration: null, m3u8Url: null }
    ]
  });

  useEffect(() => {
    const loadCategoriesAndSuggestions = async () => {
      const cachedCategories = await getCachedCategories();
      if (cachedCategories) {
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
    // preload director/actor/region/language suggestions
    (async () => {
      try {
        const [dirs, acts, regs, langs] = await Promise.all([
          getDirectorList('', undefined, 1, 50),
          getActorList('', undefined, 1, 50),
          getRegionList('', 1, 200),
          getLanguageList('', '', 1, 200)
        ]);
        if (Array.isArray(dirs)) setDirectorSuggestions(dirs.slice(1, 100));
        if (Array.isArray(acts)) setActorSuggestions(acts.slice(1, 200));
        if (Array.isArray(regs)) setRegionSuggestions(regs.slice(1, 200));
        if (Array.isArray(langs)) setLanguageSuggestions(langs.slice(1, 200));
      } catch (e) {
        console.warn('Failed to preload suggestions', e);
      }
    })();
  }
  loadCategoriesAndSuggestions();
  }, []);

  useEffect(() => {
    return () => {
      if (episodePreviewUrl) try { URL.revokeObjectURL(episodePreviewUrl); } catch { }
      if (seriesCoverPreviewUrl) try { URL.revokeObjectURL(seriesCoverPreviewUrl); } catch { }
    };
  }, [episodePreviewUrl, seriesCoverPreviewUrl]);

  const addEpisode = () => {
    const newEpisodeNumber = seriesForm.episodes.length + 1;
    setSeriesForm(prev => ({ ...prev, episodes: [...prev.episodes, { number: newEpisodeNumber, title: `Episode ${newEpisodeNumber}`, description: '', file: null, customCoverUrl: '', duration: null, m3u8Url: null }], totalEpisodes: newEpisodeNumber }));
  };

  const removeEpisode = (index: number) => {
    if (seriesForm.episodes.length <= 1) return;
    setSeriesForm(prev => ({ ...prev, episodes: prev.episodes.filter((_, idx) => idx !== index).map((ep, idx) => ({ ...ep, number: idx + 1, title: ep.title })), totalEpisodes: prev.episodes.length - 1 }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, episodeIndex: number) => {
    const files = event.target.files;
    if (!files?.length) return;
    const file = files[0];

    // Check for unsupported formats
    const fileName = file.name.toLowerCase();
    const unsupportedFormats = ['.flv', '.avi', '.wmv'];
    const isUnsupported = unsupportedFormats.some(format => fileName.endsWith(format));

    if (isUnsupported) {
      const format = fileName.split('.').pop()?.toUpperCase();
      // Set episode-level unsupported format message (do not alert)
      setUnsupportedFormatsMsg(prev => ({ ...prev, [episodeIndex]: `${format} format is not supported by this browser and is unavailable for preview.` }));
      // Clear any existing selection for this episode
      setSeriesForm(prev => ({
        ...prev, episodes: prev.episodes.map((ep, idx) => {
          if (idx !== episodeIndex) return ep;
          const { duration, ...rest } = ep;
          return { ...rest };
        })
      }));

    } else {
      // Clear any previous unsupported-format message for this episode
      setUnsupportedFormatsMsg(prev => {
        const copy = { ...prev };
        delete copy[episodeIndex];
        return copy;
      });
    }

    setSeriesForm(prev => ({ ...prev, episodes: prev.episodes.map((ep, idx) => idx === episodeIndex ? { ...ep, file } : ep) }));
    try {
      const url = URL.createObjectURL(file);
      if (episodePreviewUrlList[episodeIndex]) URL.revokeObjectURL(episodePreviewUrlList[episodeIndex]);
      setEpisodePreviewUrlList(prev => {
        const newList = [...prev];
        newList[episodeIndex] = url;
        return newList;
      });
      setSeriesPreviewIndex(episodeIndex);
    } catch { }
  };

  const clearEpisodeFile = (index: number) => {
    if (episodePreviewUrl) try { URL.revokeObjectURL(episodePreviewUrl); } catch { }
    setEpisodePreviewUrl(null);
    setSeriesForm(prev => ({ ...prev, episodes: prev.episodes.map((ep, idx) => idx === index ? { ...ep, file: null } : ep) }));
    if (seriesPreviewIndex === index) setSeriesPreviewIndex(0);
  };

  const handleTagsChange = (tags: string[]) => {
    debugLog('Series tags changed', { tags });
    setSeriesForm(prev => ({ ...prev, tags }));
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
    setSeriesForm(prev => ({ ...prev, categoryId }));
  };

  const handleCoverFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    const file = files[0];
    // store file in form state
    setSeriesForm(prev => ({ ...prev, coverFile: file }));
    try {
      const url = URL.createObjectURL(file);
      if (seriesCoverPreviewUrl) URL.revokeObjectURL(seriesCoverPreviewUrl);
      setSeriesCoverPreviewUrl(url);
    } catch { }
  };

  const handleLandscapeFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    const file = files[0];

    // store file in form state
    setSeriesForm(prev => ({ ...prev, landscapeFile: file }));
    try {
      const url = URL.createObjectURL(file);
      if (seriesLandscapePreviewUrl) URL.revokeObjectURL(seriesLandscapePreviewUrl);
      setSeriesLandscapePreviewUrl(url);
    } catch { }
  };

  const clearLandscapeFile = () => {
    if (seriesLandscapePreviewUrl) try { URL.revokeObjectURL(seriesLandscapePreviewUrl); } catch { }
    setSeriesLandscapePreviewUrl(null);
    setSeriesForm(prev => ({ ...prev, landscapeFile: null }));

    const input = document.getElementById('series-landscape-file') as HTMLInputElement;
    if (input) input.value = '';
  };

  const clearCoverFile = () => {
    if (seriesCoverPreviewUrl) try { URL.revokeObjectURL(seriesCoverPreviewUrl); } catch { }
    setSeriesCoverPreviewUrl(null);
    setSeriesForm(prev => ({ ...prev, coverFile: null }));

    // Clear the input field for the image upload
    const coverInput = document.getElementById('series-cover-file') as HTMLInputElement;
    if (coverInput) {
      coverInput.value = '';
    }
  };

  const removeTag = (tagToRemove: string) => {
    debugLog('Removing series tag', { tag: tagToRemove });
    setSeriesForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
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
        <div className="w-full  rounded-full h-2">
          <div className={`h-2 rounded-full transition-all duration-300 ${uploadProgress.status === 'success' ? 'bg-green-500' : uploadProgress.status === 'error' ? 'bg-red-500' : 'bg-[#fbb033]'}`} style={{ width: `${uploadProgress.progress}%` }} />
        </div>
      </div>
    );
  };

  const handleSeriesUpload = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const episodesWithInvalidDuration = seriesForm.episodes.filter(
      (ep) => ep.duration === null || ep.duration === undefined || ep.duration <= 0
    );

    console.log('Episodes with invalid duration:', episodesWithInvalidDuration);
    if (episodesWithInvalidDuration.length > 0) {
      setUploadProgress({
        progress: 0,
        status: 'error',
        error: t('uploadForm.invalidDuration', 'Please ensure all episode durations are valid'),
      });
      return;
    }
    console.log('Proceeding with upload...');
    // Require a cover file and at least one episode media (file or m3u8Url)
    const hasEpisodeMedia = seriesForm.episodes.some(ep => ep.file || ep.m3u8Url);
    if (!seriesForm.coverFile || !hasEpisodeMedia) {
      const missingFields = [];
      if (!seriesForm.coverFile) missingFields.push(t('uploadForm.coverImageLabel', 'Cover Image'));
      if (!hasEpisodeMedia) missingFields.push(t('uploadForm.episodeFiles', 'Episode Files'));
      const errorMessage = t('uploadForm.missingFields', 'Please provide the following:') + ' ' + missingFields.join(', ');
      setUploadProgress({ progress: 0, status: 'error', error: errorMessage });
      return;
    }
    console.log('Episodes with files:', seriesForm.episodes.filter(ep => ep.file));
    const episodesWithFiles = seriesForm.episodes.filter(ep => ep.file !== null || ep.m3u8Url !== null);
    if (episodesWithFiles.length === 0) {
      setUploadProgress({ progress: 0, status: 'error', error: t('uploadForm.provideAtLeastOneEpisodeFile', 'Please select video files for at least one episode') });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress({ progress: 0, status: 'uploading', error: '' });

    try {
      // If user selected a local cover file, upload it first and set customCoverUrl
      let coverUrl = '';
      let landscapeId = '';
      if (seriesForm.coverFile) {
        try {
          setIsUploadingCover(true);
          // initialize image upload
          const init = await initializeImageUpload({
            fileName: seriesForm.coverFile.name,
            contentType: seriesForm.coverFile.type || 'image/jpeg',
            fileSize: seriesForm.coverFile.size,
            totalParts: 1,
            imageType: 'cover',
          });

          // upload the file using existing uploadFile helper
          await uploadFile(seriesForm.coverFile, { uploadId: init.uploadId, key: init.key }, (p) => {
            // optional: integrate progress into uploadProgress
          });

          // After upload, the backend should have an image id in init.id; retrieve full metadata
          // const imageMeta = await getImageById(init.id, '360');
          if (init?.id) {
            setSeriesForm(prev => ({ ...prev, customCoverUrl: init.id || '' }));
            coverUrl = init.id;
          }
        } catch (imgErr) {
          console.error('Cover upload failed', imgErr);
        } finally {
          setIsUploadingCover(false);
        }

      }
      // If user selected a landscape thumbnail file, upload it the same way and set landscapeThumbnailUrl
      if (seriesForm.landscapeFile) {
        try {
          setIsUploadingLandscape(true);
          const lInit = await initializeImageUpload({
            fileName: seriesForm.landscapeFile.name,
            contentType: seriesForm.landscapeFile.type || 'image/jpeg',
            fileSize: seriesForm.landscapeFile.size,
            totalParts: 1,
            imageType: 'landscape',
          });

          await uploadFile(seriesForm.landscapeFile, { uploadId: lInit.uploadId, key: lInit.key }, (p) => { });
          if (lInit?.id) {
            setSeriesForm(prev => ({ ...prev, landscapeThumbnailUrl: lInit.id || '' }));
            landscapeId = lInit.id;
          }
        } catch (landErr) {
          console.error('Landscape upload failed', landErr);
        } finally {
          setIsUploadingLandscape(false);
        }
      }
      // console.log('Cover URL after upload:', coverUrl);
      // console.log('Final series form before submission', seriesForm);

      const seriesRequest: SeriesCreateRequest = {
        title: seriesForm.title,
        description: seriesForm.description || undefined,
        // The API accepts a customCoverUrl string. If the user selected a local file (coverFile)
        // we currently don't have an upload endpoint here, so only send customCoverUrl when present.
        customCoverUrl: seriesForm.customCoverUrl || coverUrl,
        landscapeThumbnailUrl: landscapeId || undefined,
        categoryId: seriesForm.categoryId,
        year: seriesForm.year,
        region: seriesForm.region || undefined,
        language: seriesForm.language || undefined,
        director: seriesForm.director || undefined,
        actors: seriesForm.actors || undefined,
        releaseRegions: seriesForm.releaseRegions || undefined,
        sourceProvider: seriesForm.sourceProvider || undefined,
        rating: seriesForm.rating || 0,
        tags: seriesForm.tags.length > 0 ? seriesForm.tags : undefined,
        seasonNumber: seriesForm.seasonNumber,
        totalEpisodes: seriesForm.totalEpisodes
      };

      debugLog('Creating series', seriesRequest);
      const seriesResult = await createSeries(seriesRequest);
      const seriesId = seriesResult.seriesId;
      setUploadProgress(prev => ({ ...prev, progress: 10 }));

      const progressPerEpisode = 80 / episodesWithFiles.length;
      let currentProgress = 10;

      for (let i = 0; i < episodesWithFiles.length; i++) {
        const episode = episodesWithFiles[i];
        const episodeRequest: EpisodeCreateRequest = {
          seriesId,
          title: episode.title,
          description: episode.description || undefined,
          coverUrl: episode.customCoverUrl || coverUrl || undefined,
          episodeNumber: episode.number,
          duration: episode.duration || 30000
        };
        debugLog(`Creating episode ${episode.number}`, episodeRequest);
        await createEpisode(episodeRequest);
        currentProgress += progressPerEpisode * 0.2;
        setUploadProgress(prev => ({ ...prev, progress: currentProgress }));


        let uploadRequest: EpisodeUploadRequest;
        if (episode.m3u8Url) {
          uploadRequest = {
            seriesId,
            episodeNumber: episode.number,
            uploadType: "M3U8_URL",
            m3u8Url: episode.m3u8Url || undefined,
          };
          const uploadCredential = await initializeEpisodeUpload(uploadRequest);
          if (!uploadCredential || typeof uploadCredential === 'undefined') {
            throw new Error('Failed to initialize episode upload credentials');
          }
          currentProgress += progressPerEpisode * 0.1;
          setUploadProgress(prev => ({ ...prev, progress: currentProgress }));

        }
        else {

          const chunkSize = 10 * 1024 * 1024; // 10MB chunks
          const totalChunks = Math.ceil(episode.file!.size / chunkSize);
          uploadRequest = {
            seriesId,
            episodeNumber: episode.number,
            uploadType: "FILE_UPLOAD",
            fileName: episode.file!.name,
            fileSize: episode.file!.size,
            totalParts: totalChunks || undefined,
          };

          debugLog(`Initializing upload for episode ${episode.number}`, uploadRequest);
          const uploadCredential = await initializeEpisodeUpload(uploadRequest);
          if (!uploadCredential || typeof uploadCredential === 'undefined') {
            throw new Error('Failed to initialize episode upload credentials');
          }
          currentProgress += progressPerEpisode * 0.1;
          setUploadProgress(prev => ({ ...prev, progress: currentProgress }));

          await uploadFile(episode.file!, uploadCredential, (fileProgress) => {
            const fileProgressContribution = progressPerEpisode * 0.7 * (fileProgress / 100);
            setUploadProgress(prev => ({ ...prev, progress: currentProgress + fileProgressContribution }));
          });
        }


        currentProgress += progressPerEpisode * 0.7;
        setUploadProgress(prev => ({ ...prev, progress: currentProgress }));
      }

      setUploadProgress({ progress: 100, status: 'success', error: '' });

      // Store the uploaded series ID for the success modal
      setUploadedSeriesId(seriesId || 'unknown');

      // Show success modal instead of resetting form immediately
      setShowSuccessModal(true);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('uploadForm.seriesUploadFailed', 'Series upload failed');
      debugLog('Series upload failed', { error: errorMessage });
      setUploadProgress({ progress: 0, status: 'error', error: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadMore = () => {
    // Reset form for new upload
    setSeriesForm({ title: '', description: '', customCoverUrl: '', coverFile: null, categoryId: 'series', year: new Date().getFullYear(), region: '', language: '', director: '', actors: '', rating: 0, tags: [], seasonNumber: 1, totalEpisodes: 1, episodes: [{ number: 1, title: 'Episode 1', description: '', file: null, customCoverUrl: '', duration: null, m3u8Url: null }] });
    if (episodePreviewUrl) {
      try { URL.revokeObjectURL(episodePreviewUrl); } catch { }
    }
    if (seriesCoverPreviewUrl) {
      try { URL.revokeObjectURL(seriesCoverPreviewUrl); } catch { }
    }
    setEpisodePreviewUrl(null);
    setSeriesCoverPreviewUrl(null);
    setUploadProgress({ progress: 0, status: 'idle', error: '' });
    setUploadedSeriesId(null);
  };

  const handleVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement, Event>, index: number) => {
    const video = e.currentTarget;
    if (video && video.duration) {
      const durationMs = Math.round(video.duration * 1000);
      // console.log('Detected video duration (ms):', durationMs);
      setSeriesForm(prev => ({ ...prev, episodes: prev.episodes.map((ep, idx) => idx === index ? { ...ep, duration: durationMs } : ep) }));
    }
  };

  const handleDurationDetected = (durationMs: number, index: number) => {
    setSeriesForm(prev => ({
      ...prev,
      episodes: prev.episodes.map((ep, idx) =>
        idx === index ? { ...ep, duration: durationMs } : ep
      )
    }));
  };

  return (
    <>
      <UploadSuccessModal
        sourceType={seriesForm.episodes[0].m3u8Url ? 'LINK' : 'UPLOAD'}
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        uploadedId={uploadedSeriesId || undefined}
        title={seriesForm.title}
        type="series"
        onUploadMore={handleUploadMore}
      />
      <form onSubmit={handleSeriesUpload} className="rounded-xl p-8 shadow-2xl">
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">{t('uploadForm.seriesTitlePlaceholder', t('uploadForm.titlePlaceholder', 'Title *'))}</label>
          <input
            type="text"
            required
            value={seriesForm.title}
            onChange={(e) => setSeriesForm(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-3  border border-[#fbb033] rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
            placeholder={t('uploadForm.seriesTitlePlaceholder', 'Enter series title')}
          />
        </div>

        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">{t('upload.description', 'Description')}</label>
          <textarea
            rows={4}
            required
            value={seriesForm.description}
            onChange={(e) => setSeriesForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-3  border border-[#fbb033] rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
            placeholder={t('uploadForm.descriptionPlaceholder', 'Enter series description')}
          />
        </div>
        <div className="mb-6">
          <label htmlFor="category" className="block text-lg font-medium mb-2">
            {t('uploadForm.categoryLabel', 'Category')}
          </label>
          <SearchableDropdown
            id="category"
            value={getCategoryNameFromId(seriesForm.categoryId)}
            onChange={handleCategoryChange}
            suggestions={categorySuggestions}
            placeholder={t('uploadForm.categoryPlaceholder', 'Select category')}
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-6 mb-6">
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
                  className="visually-hidden opacity-0 absolute z-[-1]"
                  required
                />
                <label
                  htmlFor="movie-cover-file"
                  className="px-4 py-2 border border-[#fbb033] rounded-3xl cursor-pointer text-white text-sm whitespace-nowrap"
                >
                  {t('uploadForm.choosePortrait', 'Choose Portrait')}
                </label>
                {seriesCoverPreviewUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={seriesCoverPreviewUrl} alt="cover preview" className="w-24 h-36 object-cover rounded" />
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
                  className="visually-hidden opacity-0 absolute absolute z-[-1]" 
                />
                <label 
                  htmlFor="movie-landscape-file" 
                  className="px-4 py-2 border border-[#fbb033] rounded-3xl cursor-pointer text-white text-sm whitespace-nowrap"
                >
                  {t('uploadForm.chooseLandscape', 'Choose Landscape')}
                </label>
                {seriesLandscapePreviewUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={seriesLandscapePreviewUrl} alt="landscape preview" className="w-48 h-28 object-cover rounded" />
                    <button 
                      type="button" 
                      onClick={clearLandscapeFile} 
                      className="px-2 py-1 bg-red-600 rounded text-white text-sm"
                    >
                      {t('uploadForm.remove', 'Remove')}
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">{t('upload.optional', 'Optional')}</span>
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
              value={seriesForm.director}
              onChange={(v) => setSeriesForm(prev => ({ ...prev, director: v }))}
              suggestions={directorSuggestions}
              placeholder={t('upload.directorPlaceholder', 'Director name')}
              required
              allowCustom
            />
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">{t('upload.actors', 'Actors')}</label>
            <SearchableDropdown
              id="actors"
              value={seriesForm.actors}
              onChange={(v) => setSeriesForm(prev => ({ ...prev, actors: v }))}
              suggestions={actorSuggestions}
              placeholder={t('upload.actorsPlaceholder', 'Actor names, separated by commas')}
              multi
              required
              allowCustom
            />
            <p className="text-sm text-gray-400 mb-2">{t('uploadForm.actorSupportedFormats', 'Supported formats: /Actor1/Actor2/Actor3 or Actor1, Actor2, Actor3). Example: /Zhang Luyi/Yu Hewei/Chen Jin')}</p>
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">{t('upload.rating', 'Rating')}</label>
            <input
              type="number"
              required
              min="0"
              max="10"
              step="1"
              value={seriesForm.rating ?? ''}
              onChange={(e) => setSeriesForm(prev => ({ ...prev, rating: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
              className="w-full px-4 py-3  border border-[#fbb033] rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
              placeholder="8.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-lg font-medium mb-2">{t('upload.region', 'Region')}</label>
            <SearchableDropdown
              id="region"
              value={seriesForm.region}
              onChange={(v) => setSeriesForm(prev => ({ ...prev, region: v }))}
              suggestions={regionSuggestions}
              placeholder={t('upload.regionPlaceholder', 'e.g., USA, China, etc.')}
              required
              allowCustom
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-2">{t('upload.language', 'Language')}</label>
            <SearchableDropdown
              id="language"
              value={seriesForm.language}
              onChange={(v) => setSeriesForm(prev => ({ ...prev, language: v }))}
              suggestions={languageSuggestions}
              placeholder={t('upload.languagePlaceholder', 'e.g., English, Mandarin, etc.')}
              required
              allowCustom
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">


          <div>
            <label className="block text-lg font-medium mb-2">{t('upload.sourceProvider', 'Source Provider')}</label>
            <input
              type="text"
              required
              value={seriesForm.sourceProvider || ''}
              onChange={(e) => setSeriesForm(prev => ({ ...prev, sourceProvider: e.target.value }))}
              className="w-full px-4 py-3  border border-[#fbb033] rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
              placeholder={t('upload.sourceProvider', 'e.g., HBO')}
            />
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">{t('upload.releaseRegions', 'Release Regions')}</label>

            <SearchableDropdown
              id="releaseRegions"
              value={seriesForm.releaseRegions || ''}
              onChange={(v) => setSeriesForm(prev => ({ ...prev, releaseRegions: v }))}
              suggestions={regionSuggestions}
              placeholder={t('upload.releaseRegionsPlaceholder', 'e.g., United States, United Kingdom')}
              required
              allowCustom
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">{t('upload.tags', 'Tags')}</label>
          <TagSelector
            required
            selectedTags={seriesForm.tags}
            onTagsChange={handleTagsChange}
            placeholder={t('upload.searchTags', 'Search and select tags...')}
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium">{t('upload.episodes', 'Episodes')}</h4>
            <button type="button" onClick={addEpisode} className="flex cursor-pointer ßitems-center px-4 py-2 bg-[#fbb033] text-black rounded-3xl hover:bg-yellow-500 transition-colors"><FiPlus className="mr-2" />{t('uploadForm.addEpisode', 'Add Episode')}</button>
          </div>

          {seriesForm.episodes.map((episode, index) => (
            <div key={index} className="mb-4 p-4  rounded-3xl">
              <hr className="border-none bg-[#fbb033]/[0.8] my-4 w-[90%] mx-auto rounded-full h-[5px]" />
              <div className="flex text-lg font-bold items-center justify-between mb-3">
                <h5 className="font-medium">{t('upload.episodeLabel', `Episode`) + " " + episode.number}</h5>
                {seriesForm.episodes.length > 1 && (
                  <button type="button" onClick={() => removeEpisode(index)} className="text-red-400 hover:text-red-300 cursor-pointer"><FiTrash2 /></button>
                )}
              </div>

              <EpisodeFile
                episode={episode}
                index={index}
                episodePreviewUrl={episodePreviewUrlList[index]}
                unsupportedFormatMsg={unsupportedFormatsMsg[index]}
                fileInputRef={index === 0 ? fileInputRef : undefined}
                onFileSelect={handleFileSelect}
                onClearFile={clearEpisodeFile}
                onDurationDetected={handleDurationDetected}
                setSeriesForm={setSeriesForm}
              />
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                <div>
                  <div className='mb-4'>
                    <label className="block text-lg font-medium mb-2">{t('upload.episodeTitle', 'Episode Title')}</label>
                    <input
                      type="text"
                      required
                      value={episode.title}
                      onChange={(e) => setSeriesForm(prev => ({ ...prev, episodes: prev.episodes.map((ep, idx) => idx === index ? { ...ep, title: e.target.value } : ep) }))}
                      className="w-full px-3 py-2  border border-[#fbb033] rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
                      placeholder={`${t('navigation.upload')} ${episode.number} : ${t('upload.episodeTitle', 'Title')}`}
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-medium mb-2">{t('upload.episodeDuration', 'Episode Duration')}</label>
                    <DurationInput
                      value={episode.duration}
                      onChange={(durationMs) => setSeriesForm(prev => ({ ...prev, episodes: prev.episodes.map((ep, idx) => idx === index ? { ...ep, duration: durationMs } : ep) }))}
                      required
                      className="w-full"
                      placeholder={`Episode ${episode.number} duration`}
                    />
                  </div>
                </div>

              </div>

              <div>
                <label className="block text-lg font-medium mb-2">{t('upload.episodeDescription', 'Episode Description')}</label>
                <textarea required rows={2} value={episode.description} onChange={(e) => setSeriesForm(prev => ({ ...prev, episodes: prev.episodes.map((ep, idx) => idx === index ? { ...ep, description: e.target.value } : ep) }))} className="w-full px-3 py-2  border border-[#fbb033] rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white" placeholder={t('uploadForm.episodeDescriptionPlaceholder', `Episode ${episode.number} description`)} />
              </div>
            </div>
          ))}
        </div>

        {renderProgressBar()}

        <div className="flex justify-end mt-8">
          <button type="submit" disabled={isSubmitting || uploadProgress.status === 'uploading'} className="flex justify-center w-full  lg:w-auto  items-center px-8 py-4 bg-[#fbb033] text-black text-center font-semibold rounded-3xl hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-3"></div>
                {t('uploadForm.uploading', 'Uploading Series...')}
              </>
            ) : (
              <>
                <FiUpload className="mr-3" />
                {t('upload.uploadSeries', 'Upload Series')}
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
