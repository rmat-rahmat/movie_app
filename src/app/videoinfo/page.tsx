"use client";
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { getContentDetail } from '@/lib/movieApi';
import type { VideoDetails } from '@/types/Dashboard';
import LoadingPage from '@/components/ui/LoadingPage';
import Image from 'next/image';
import { FiArrowLeft, FiPlay } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

const VideoInfoPage: React.FC = () => {
  const { t } = useTranslation('common');
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const type = searchParams.get('type') || 'movie';
  
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (!id) {
        setError('No video ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const details = await getContentDetail(String(id));
        if (details) {
          setVideoDetails(details);
        } else {
          setError('Video not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video details');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDetails();
  }, [id]);

  const handleWatchNow = () => {
    if (id) {
      router.push(`/videoplayer?id=${encodeURIComponent(id)}`);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (error || !videoDetails) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-400 hover:text-white mb-6"
          >
            <FiArrowLeft className="mr-2" />
            {t('common.back', 'Back')}
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">{t('videoInfo.error', 'Error')}</h1>
            <p className="text-gray-400">{error || t('videoInfo.notFound', 'Video not found')}</p>
          </div>
        </div>
      </div>
    );
  }

  const backdropImage = videoDetails.imageQuality?.p720 || videoDetails.imageQuality?.p360 || '/fallback_poster/sample_poster.png';
  const portraitImage = videoDetails.imageQuality?.p360 || '/fallback_poster/sample_poster.png';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative h-96 overflow-hidden">
        <Image
          src={backdropImage}
          alt={videoDetails.title || ''}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        <div className="absolute top-6 left-6">
          <button
            onClick={handleGoBack}
            className="flex items-center text-white hover:text-[#fbb033] transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            {t('common.back', 'Back')}
          </button>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{videoDetails.title}</h1>
          <div className="flex items-center gap-4 mb-4">
            {videoDetails.year && (
              <span className="text-gray-300">{videoDetails.year}</span>
            )}
            {videoDetails.rating && videoDetails.rating > 0 && (
              <div className="flex items-center">
                <svg className="w-5 h-5 text-[#fbb033] mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                <span className="text-[#fbb033]">{videoDetails.rating.toFixed(1)}</span>
              </div>
            )}
            {videoDetails.isSeries && (
              <span className="bg-blue-600 px-3 py-1 rounded text-sm">
                {t('videoInfo.series', 'Series')}
              </span>
            )}
          </div>
          <button
            onClick={handleWatchNow}
            className="flex items-center px-6 py-3 bg-[#fbb033] text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
          >
            <FiPlay className="mr-2" />
            {t('videoInfo.watchNow', 'Watch Now')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid md:grid-cols-[300px_1fr] gap-8">
          {/* Poster */}
          <div className="hidden md:block">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
              <Image
                src={portraitImage}
                alt={videoDetails.title || ''}
                fill
                className="object-cover"
                sizes="300px"
              />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Description */}
            {videoDetails.description && (
              <div>
                <h2 className="text-xl font-semibold mb-3">{t('videoInfo.description', 'Description')}</h2>
                <p className="text-gray-300 leading-relaxed">{videoDetails.description}</p>
              </div>
            )}

            {/* Cast & Crew */}
            <div className="grid md:grid-cols-2 gap-6">
              {videoDetails.actors && videoDetails.actors.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t('videoInfo.cast', 'Cast')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {videoDetails.actors.map((actor, index) => (
                      <span key={index} className="bg-gray-800 px-3 py-1 rounded-full text-sm">
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {videoDetails.director && (
                  <div>
                    <span className="text-gray-400">{t('videoInfo.director', 'Director')}: </span>
                    <span className="text-white">{videoDetails.director}</span>
                  </div>
                )}
                {videoDetails.language && (
                  <div>
                    <span className="text-gray-400">{t('videoInfo.language', 'Language')}: </span>
                    <span className="text-white">{videoDetails.language}</span>
                  </div>
                )}
                {videoDetails.region && (
                  <div>
                    <span className="text-gray-400">{t('videoInfo.region', 'Region')}: </span>
                    <span className="text-white">{videoDetails.region}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {Array.isArray(videoDetails.tags) && videoDetails.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">{t('videoInfo.tags', 'Tags')}</h3>
                <div className="flex flex-wrap gap-2">
                  {videoDetails.tags.map((tag, index) => (
                    <span key={index} className="bg-[#fbb033] text-black px-3 py-1 rounded text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Episodes (for series) */}
            {videoDetails.isSeries && videoDetails.episodes && videoDetails.episodes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  {t('videoInfo.episodes', 'Episodes')} ({videoDetails.episodes.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {videoDetails.episodes.map((episode, index) => (
                    <div
                      key={episode.id || index}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          Episode {episode.episodeNumber} - {episode.title || 'Untitled'}
                        </div>
                        {episode.duration && (
                          <div className="text-sm text-gray-400">
                            {Math.floor(episode.duration / 60)}min
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => router.push(`/videoplayer?id=${encodeURIComponent(episode.uploadId || episode.id || '')}`)}
                        className="flex items-center px-3 py-1 bg-[#fbb033] text-black rounded hover:bg-yellow-500 transition-colors"
                      >
                        <FiPlay className="mr-1" />
                        {t('videoInfo.watch', 'Watch')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoInfoPage;
