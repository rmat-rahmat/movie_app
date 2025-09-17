"use client";

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiUpload, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import { createSeries, createEpisode, initializeEpisodeUpload, uploadFile, initializeImageUpload, getImageById, type SeriesCreateRequest, type EpisodeCreateRequest, type EpisodeUploadRequest } from '@/lib/uploadAPI';
import UploadSuccessModal from '@/components/ui/UploadSuccessModal';
import TagSelector from '@/components/ui/TagSelector';
import { getCachedCategories, type CategoryItem } from '@/lib/movieApi';

interface Episode {
  number: number;
  title: string;
  description: string;
  file: File | null;
  customCoverUrl?: string;
  duration?: number;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ progress: 0, status: 'idle' as 'idle' | 'uploading' | 'success' | 'error', error: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadedSeriesId, setUploadedSeriesId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  const [seriesForm, setSeriesForm] = useState({
    title: '',
    description: '',
    customCoverUrl: '',
    coverFile: null as File | null,
    categoryId: 'series',
    year: new Date().getFullYear(),
    region: '',
    language: '',
    director: '',
    actors: '',
    rating: 0,
    tags: [] as string[],
    seasonNumber: 1,
    totalEpisodes: 1,
    episodes: [
      { number: 1, title: 'Episode 1', description: '', file: null, customCoverUrl: '' }
    ] as Episode[]
  });

  useEffect(() => {
    const cachedCategories = getCachedCategories();
    if (cachedCategories) {
      setCategories(cachedCategories);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (episodePreviewUrl) try { URL.revokeObjectURL(episodePreviewUrl); } catch { }
      if (seriesCoverPreviewUrl) try { URL.revokeObjectURL(seriesCoverPreviewUrl); } catch { }
    };
  }, [episodePreviewUrl, seriesCoverPreviewUrl]);

  const addEpisode = () => {
    const newEpisodeNumber = seriesForm.episodes.length + 1;
    setSeriesForm(prev => ({ ...prev, episodes: [...prev.episodes, { number: newEpisodeNumber, title: `Episode ${newEpisodeNumber}`, description: '', file: null, customCoverUrl: '' }], totalEpisodes: newEpisodeNumber }));
  };

  const removeEpisode = (index: number) => {
    if (seriesForm.episodes.length <= 1) return;
    setSeriesForm(prev => ({ ...prev, episodes: prev.episodes.filter((_, idx) => idx !== index).map((ep, idx) => ({ ...ep, number: idx + 1, title: ep.title.includes('Episode') ? `Episode ${idx + 1}` : ep.title })), totalEpisodes: prev.episodes.length - 1 }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, episodeIndex: number) => {
    const files = event.target.files;
    if (!files?.length) return;
    const file = files[0];
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
          <div className={`h-2 rounded-full transition-all duration-300 ${uploadProgress.status === 'success' ? 'bg-green-500' : uploadProgress.status === 'error' ? 'bg-red-500' : 'bg-[#fbb033]'}`} style={{ width: `${uploadProgress.progress}%` }} />
        </div>
      </div>
    );
  };

  const handleSeriesUpload = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!seriesForm.coverFile || seriesForm.episodes.every(ep => !ep.file)) {
      const missingFields = [];
      if (!seriesForm.coverFile) missingFields.push(t('uploadForm.coverImageLabel', 'Cover Image'));
      if (seriesForm.episodes.every(ep => !ep.file)) missingFields.push(t('uploadForm.episodeFiles', 'Episode Files'));
      const errorMessage = t('uploadForm.missingFields', 'Please provide the following:') + ' ' + missingFields.join(', ');
      setUploadProgress({ progress: 0, status: 'error', error: errorMessage });
      return;
    }

    const episodesWithFiles = seriesForm.episodes.filter(ep => ep.file !== null);
    if (episodesWithFiles.length === 0) {
      setUploadProgress({ progress: 0, status: 'error', error: t('uploadForm.provideAtLeastOneEpisodeFile', 'Please select video files for at least one episode') });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress({ progress: 0, status: 'uploading', error: '' });

    try {
      // If user selected a local cover file, upload it first and set customCoverUrl
      let coverUrl = '';
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
      console.log('Cover URL after upload:', coverUrl);
      console.log('Final series form before submission', seriesForm);

      const seriesRequest: SeriesCreateRequest = {
        title: seriesForm.title,
        description: seriesForm.description || undefined,
        // The API accepts a customCoverUrl string. If the user selected a local file (coverFile)
        // we currently don't have an upload endpoint here, so only send customCoverUrl when present.
        customCoverUrl: seriesForm.customCoverUrl || coverUrl,
        categoryId: seriesForm.categoryId,
        year: seriesForm.year,
        region: seriesForm.region || undefined,
        language: seriesForm.language || undefined,
        director: seriesForm.director || undefined,
        actors: seriesForm.actors || undefined,
        rating: seriesForm.rating || undefined,
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
          coverUrl: episode.customCoverUrl || coverUrl|| undefined,
          episodeNumber: episode.number,
          duration: episode.duration || 30000
        };

        await createEpisode(episodeRequest);
        currentProgress += progressPerEpisode * 0.2;
        setUploadProgress(prev => ({ ...prev, progress: currentProgress }));

        const uploadRequest: EpisodeUploadRequest = {
          seriesId,
          episodeNumber: episode.number,
          fileName: episode.file!.name,
          fileSize: episode.file!.size
        };

        const uploadCredential = await initializeEpisodeUpload(uploadRequest);
        currentProgress += progressPerEpisode * 0.1;
        setUploadProgress(prev => ({ ...prev, progress: currentProgress }));

        await uploadFile(episode.file!, uploadCredential, (fileProgress) => {
          const fileProgressContribution = progressPerEpisode * 0.7 * (fileProgress / 100);
          setUploadProgress(prev => ({ ...prev, progress: currentProgress + fileProgressContribution }));
        });

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
    setSeriesForm({ title: '', description: '', customCoverUrl: '', coverFile: null, categoryId: 'series', year: new Date().getFullYear(), region: '', language: '', director: '', actors: '', rating: 0, tags: [], seasonNumber: 1, totalEpisodes: 1, episodes: [{ number: 1, title: 'Episode 1', description: '', file: null, customCoverUrl: '' }] });
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
      console.log('Detected video duration (ms):', durationMs);
      setSeriesForm(prev => ({ ...prev, episodes: prev.episodes.map((ep, idx) => idx === index ? { ...ep, duration: durationMs } : ep) }));
    }
  };

  return (
    <>
      <UploadSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        uploadedId={uploadedSeriesId || undefined}
        title={seriesForm.title}
        type="series"
        onUploadMore={handleUploadMore}
      />
      <form onSubmit={handleSeriesUpload} className="bg-gray-800 rounded-xl p-8 shadow-2xl">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">{t('uploadForm.seriesTitlePlaceholder', t('uploadForm.titlePlaceholder', 'Title *'))}</label>
          <input
            type="text"
            required
            value={seriesForm.title}
            onChange={(e) => setSeriesForm(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
            placeholder={t('uploadForm.seriesTitlePlaceholder', 'Enter series title')}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">{t('upload.description', 'Description')}</label>
          <textarea
            rows={4}
            required
            value={seriesForm.description}
            onChange={(e) => setSeriesForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
            placeholder={t('uploadForm.descriptionPlaceholder', 'Enter series description')}
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
            value={seriesForm.categoryId}
            onChange={(e) => setSeriesForm((prev) => ({ ...prev, categoryId: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
          >
            <option value="" >
              {t('uploadForm.selectCategoryPlaceholder', 'Select category')}
            </option>
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
            <input type="file" accept="image/*" id="series-cover-file" onChange={handleCoverFileSelect} className="visually-hidden opacity-0 absolute" required/>
            <label htmlFor="series-cover-file" className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer text-white">{t('uploadForm.selectCoverFile', 'Choose Image')}</label>
            {seriesCoverPreviewUrl ? (
              <div className="flex items-center gap-3">
                <img src={seriesCoverPreviewUrl} alt="cover preview" className="w-28 h-16 object-cover rounded" />
                <button type="button" onClick={clearCoverFile} className="px-3 py-2 bg-red-600 rounded text-white">{t('uploadForm.clearCover', 'Remove')}</button>
              </div>
            ) : (
              <span className="text-sm text-gray-400">{t('upload.noCoverSelected', 'No cover selected. You may also paste an external URL into the customCoverUrl field later if needed.')}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">{t('upload.director', 'Director')}</label>
            <input required type="text" value={seriesForm.director} onChange={(e) => setSeriesForm(prev => ({ ...prev, director: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white" placeholder="Director name" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('upload.actors', 'Actors')}</label>
            <input required type="text" value={seriesForm.actors} onChange={(e) => setSeriesForm(prev => ({ ...prev, actors: e.target.value }))} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white" placeholder="Actor1, Actor2, Actor3" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('upload.rating', 'Rating')}</label>
            <input
              type="number"
              required
              min="1"
              max="10"
              step="1"
              value={seriesForm.rating}
              onChange={(e) => setSeriesForm(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
              placeholder="8.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">{t('upload.region', 'Region')}</label>
            <input
              type="text"
              required
              value={seriesForm.region}
              onChange={(e) => setSeriesForm(prev => ({ ...prev, region: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
              placeholder="e.g., USA, China, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('upload.language', 'Language')}</label>
            <input
              type="text"
              required
              value={seriesForm.language}
              onChange={(e) => setSeriesForm(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
              placeholder="e.g., English, Mandarin, etc."
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">{t('upload.tags', 'Tags')}</label>
          <TagSelector
            required
            selectedTags={seriesForm.tags}
            onTagsChange={handleTagsChange}
            placeholder={t('upload.searchTags', 'Search and select tags...')}
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium">{t('upload.episodes', 'Episodes')}</h4>
            <button type="button" onClick={addEpisode} className="flex cursor-pointer ßitems-center px-4 py-2 bg-[#fbb033] text-black rounded-lg hover:bg-yellow-500 transition-colors"><FiPlus className="mr-2" />{t('uploadForm.addEpisode', 'Add Episode')}</button>
          </div>

          {seriesForm.episodes.map((episode, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-600 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium">{t('upload.episodeLabel', `Episode ${episode.number}`)}</h5>
                {seriesForm.episodes.length > 1 && (
                  <button type="button" onClick={() => removeEpisode(index)} className="text-red-400 hover:text-red-300 cursor-pointer"><FiTrash2 /></button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className='mb-4'> 
                  <label className="block text-sm font-medium mb-2">{t('upload.episodeTitle', 'Episode Title')}</label>
                  <input
                    type="text"
                    required
                    value={episode.title}
                    onChange={(e) => setSeriesForm(prev => ({ ...prev, episodes: prev.episodes.map((ep, idx) => idx === index ? { ...ep, title: e.target.value } : ep) }))}
                    className="w-full px-3 py-2 bg-gray-500 border border-gray-400 rounded focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
                    placeholder={`Episode ${episode.number} title`}
                  />
                  </div>
                   <div>
                  <label className="block text-sm font-medium mb-2">{t('upload.episodeDuration', 'Episode Duration')}</label>
                  <input
                    type="number"
                    required
                    value={episode.duration|| ''}
                    onChange={(e) => setSeriesForm(prev => ({ ...prev, episodes: prev.episodes.map((ep, idx) => idx === index ? { ...ep, duration: parseInt(e.target.value) || 0 } : ep) }))}
                    className="w-full px-3 py-2 bg-gray-500 border border-gray-400 rounded focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
                    placeholder={`Episode ${episode.number} duration`}
                  />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('uploadForm.videoFileLabel', 'Video File')}</label>
                  {!episode.file  ? (
                      <>
                        <input type="file" accept="video/*" onChange={(e) => handleFileSelect(e, index)} className="visually-hidden opacity-0 absolute" ref={index === 0 ? fileInputRef : undefined} id={`episode-file-${index}`} required/>
                        <label htmlFor={`episode-file-${index}`} className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-500 border border-gray-400 rounded cursor-pointer hover:bg-gray-400 transition-colors">
                          <FiUpload className="mr-2" />
                          {t('upload.selectVideoFile', 'Select video file')}
                        </label>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-between gap-4 relative">
                        <video onLoadedData={(e) => handleVideoLoad(e, index)} src={episodePreviewUrlList[index] as string} controls className="w-full rounded bg-black" />
                        <button type="button" onClick={() => clearEpisodeFile(index)} className="cursor-pointer p-2 bg-red-600/50 rounded-full text-white hover:bg-red-500 absolute top-2 right-2 z-10 cursor-pointer">
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('upload.episodeDescription', 'Episode Description')}</label>
                <textarea required rows={2} value={episode.description} onChange={(e) => setSeriesForm(prev => ({ ...prev, episodes: prev.episodes.map((ep, idx) => idx === index ? { ...ep, description: e.target.value } : ep) }))} className="w-full px-3 py-2 bg-gray-500 border border-gray-400 rounded focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white" placeholder={t('uploadForm.episodeDescriptionPlaceholder', `Episode ${episode.number} description`)} />
              </div>
            </div>
          ))}
        </div>

        {renderProgressBar()}

        <div className="flex justify-end mt-8">
          <button type="submit" disabled={isSubmitting || uploadProgress.status === 'uploading'} className="flex items-center cursor-pointer px-8 py-4 bg-[#fbb033] text-black font-semibold rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors disabled:bg-gray-500">
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
