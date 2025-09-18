"use client";
import React, { useEffect, useState, useRef } from 'react';
import { getPlayMain, getPlaybackUrl } from '@/lib/movieApi';
import Hls from 'hls.js';
import { BASE_URL } from '@/config';
import { useVideoStore } from '@/store/videoStore';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import { FiPlay } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import VideoPlayer from '@/components/ui/VideoPlayer';

interface VideoPlayerClientProps {
  id?: string;
}

const VideoPlayerClient: React.FC<VideoPlayerClientProps> = ({ id: propId }) => {
  // For static export, read id from URL params client-side
  const searchParams = useSearchParams();
  const urlId = searchParams.get('id');
  const id = propId || urlId || '';
  const [variants, setVariants] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>('720p');
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const loadedQualityRef = useRef<string | null>(null);

    const router = useRouter();

  // Get video metadata from store
  const { currentVideo,setCurrentEpisode } = useVideoStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // Note: getPlayMain result not used currently, focusing on quality variants
        if(currentVideo && currentVideo.isSeries && currentVideo.currentEpisode && currentVideo.currentEpisode.uploadId !== id ){
          setCurrentEpisode(id);
        }
        await getPlayMain(id);
        if (!mounted) return;
        const qualities: ('144p' | '360p' | '720p' | '1080p')[] = ['1080p', '720p', '360p', '144p'];
        const results: Record<string, string | null> = {};
        for (const quality of qualities) {
          const v = await getPlaybackUrl(id, quality);
          if (!mounted) return;
          if (v !== null) {
            results[quality] = v;
          }
        }
        setVariants(results);
        // pick a sensible default quality for the UI (do not autoplay)
        const defaultQ = results['720p'] ? '720p' : (results['1080p'] ? '1080p' : (results['360p'] ? '360p' : ''));
        if (defaultQ) {
          setSelectedQuality(defaultQ);
          // prepare player for the default quality without autoplay
          console.log('Preparing player for default quality:', defaultQ);
          preparePlayer(defaultQ, false);
        }
      } catch (err: unknown) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    return () => { mounted = false; };
  }, [id]);

  // HLS playback function
  const playVideo = (quality: string) => {
    // If we've already prepared this quality, just play
    if (loadedQualityRef.current === quality && hlsRef.current && videoRef.current) {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
      setSelectedQuality(quality);
      return;
    }

    // otherwise prepare and autoplay
    preparePlayer(quality, true);
  };

  // preparePlayer: loads HLS source and optionally autoplay when ready
  const preparePlayer = (quality: string, autoplay: boolean) => {
    const videoElement = videoRef.current;
    if (!videoElement || !variants[quality]) return;

    // Clean up existing HLS instance
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch (_e) { }
      hlsRef.current = null;
    }

    const playlistUrl = `${BASE_URL}/api-net/play/${id}/${quality}.m3u8`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr) => {
          xhr.setRequestHeader('api-key', process.env.UPLOAD_API_KEY || '');
        }
      });

      hlsRef.current = hls;
      hls.loadSource(playlistUrl);
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        loadedQualityRef.current = quality;
        setSelectedQuality(quality);
        if (autoplay) {
          setIsPlaying(true);
          videoElement.play().catch(console.error);
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          setError(`Playback error: ${data.details}`);
        }
      });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = playlistUrl;
      videoElement.addEventListener('loadedmetadata', () => {
        loadedQualityRef.current = quality;
        setSelectedQuality(quality);
        if (autoplay) {
          setIsPlaying(true);
          videoElement.play().catch(console.error);
        }
      });
    } else {
      setError('HLS is not supported in this browser');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  // Set default volume programmatically
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = 1; // Set default volume to 100%
    }
  }, []);

  // Show fallback when no video ID is provided
  if (!id) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-2xl font-bold mb-4">Video Player</h1>
        <p className="text-sm text-gray-400">No video selected. Click a Watch button to open the player.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen  text-white">
      {/* Video Header with Metadata */}


      <div className="p-6">
        {!currentVideo && (
          <h1 className="text-2xl font-bold mb-4">{t('video.playerTitle', { id })}</h1>
        )}

        {loading && <p>{t('video.loadingPlaylists')}</p>}
        {error && <p className="text-red-400">{error}</p>}

        {/* Video Player */}
        <section className="mb-6">

          <div className="w-full lg:w-[60vw] mx-auto pb-6">
            <div className="bg-black rounded-lg overflow-hidden mx-auto relative">
              <video
                ref={videoRef}
                className="w-full h-auto bg-black max-h-[70vh]"
                controls
                preload="metadata"
                poster={currentVideo?.backdropImage || "/fallback_poster/sample_poster.png"}
                muted={false} // Ensure the video is not muted
              >
                {t('video.browserNotSupported')}
              </video>

              {/* Large centered play overlay when not playing */}
              {!isPlaying && (
                <button
                  type="button"
                  aria-label={t('video.play')}
                  onClick={() => {
                    const q = selectedQuality || Object.keys(variants)[0];
                    if (q) playVideo(q);
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/25 transition-colors"
                >
                  <div className="flex items-center justify-center w-20 h-20 md:w-28 md:h-28 bg-white/95 text-black rounded-full shadow-lg cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 md:w-12 md:h-12 ml-1">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </button>
              )}

            </div>
            {currentVideo && (
              <div className="grid mt-6 h-full w-full md:grid-cols-[70%_30%] md:grid-rows-1 grid-cols-1 grid-rows-[70%_30%]">
                {/* Video Info Overlay */}
                <div className="w-full">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    {currentVideo.title}
                    {currentVideo.currentEpisode && (
                      <span className="text-xl md:text-2xl text-gray-300 ml-2">
                        - Episode {currentVideo.currentEpisode.episodeNumber}
                        {currentVideo.currentEpisode.episodeTitle && `: ${currentVideo.currentEpisode.episodeTitle}`}
                      </span>
                    )}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 mb-3">
                    {currentVideo.releaseDate && (
                      <span className="text-gray-300">{currentVideo.releaseDate}</span>
                    )}
                    {currentVideo.rating && currentVideo.rating > 0 && (
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-[#fbb033] mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <span className="text-[#fbb033]">{currentVideo.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {currentVideo.isSeries && (
                      <span className="bg-blue-600 px-2 py-1 rounded text-xs">Series</span>
                    )}
                    {currentVideo.currentEpisode?.duration && (
                      <span className="text-gray-300">{Math.floor(currentVideo.currentEpisode.duration / 60)}min</span>
                    )}
                  </div>

                  {currentVideo.description && (
                    <p className="text-gray-200 text-sm md:text-base max-w-3xl">
                      {currentVideo.description.length > 200
                        ? `${currentVideo.description.substring(0, 200)}...`
                        : currentVideo.description}
                    </p>
                  )}
                </div>
                {/* Quality Selection */}
                <div className="mt-4 mx-auto w-full">
                  <h3 className="text-lg font-semibold mb-2">{t('video.selectQuality')}</h3>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(variants).map(([quality, playlist]) => (
                      <button
                        key={quality}
                        onClick={() => playVideo(quality)}
                        disabled={!playlist || loading}
                        className={`px-4 py-2 rounded font-medium transition-colors ${selectedQuality === quality
                          ? 'bg-[#fbb033] text-black'
                          : playlist
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        {quality} {selectedQuality === quality && isPlaying && `(${t('video.currentlyPlaying')})`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </section>

        {/* Additional Video Information */}
        {currentVideo && (
          <div className="w-full lg:w-[60vw] mx-auto space-y-6">
            {/* Cast and Crew */}
            <div className="grid md:grid-cols-[40%_30%_30%] gap-6">
              {currentVideo.actors && currentVideo.actors.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">{t('video.cast')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentVideo.actors.slice(0, 8).map((actor, index) => (
                      <span key={index} className="bg-gray-800 px-3 py-1 rounded-full text-sm">
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {currentVideo.director && (
                  <div>
                    <span className="text-gray-400">{t('video.director')}: </span>
                    <span className="text-white">{currentVideo.director}</span>
                  </div>
                )}
                {currentVideo.language && (
                  <div>
                    <span className="text-gray-400">{t('video.language')}: </span>
                    <span className="text-white">{currentVideo.language}</span>
                  </div>
                )}
                {currentVideo.region && (
                  <div>
                    <span className="text-gray-400">{t('video.region')}: </span>
                    <span className="text-white">{currentVideo.region}</span>
                  </div>
                )}
              </div>
              {currentVideo.tags && currentVideo.tags.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">{t('video.tags')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentVideo.tags.map((tag, index) => (
                      <span key={index} className="bg-[#fbb033] text-black px-3 py-1 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Tags */}

            {/* Episodes List for Series */}
            {currentVideo.isSeries && currentVideo.episodes && currentVideo.episodes.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-3">{t('video.episodes')}</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {currentVideo.episodes.map((episode) => (
                    <div
                      key={episode.id || episode.uploadId}
                      className={`flex items-center justify-between p-3 rounded transition-colors ${currentVideo.currentEpisode?.uploadId === (episode.uploadId || episode.id)
                        ? 'bg-[#fbb033]/20 border border-[#fbb033]/50'
                        : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {t('video.episodes')} {episode.episodeNumber || ''} - {episode.title || t('common.other')}
                        </div>
                        <div className="text-sm text-gray-400">
                          {t('video.duration')}: {episode.duration ? `${Math.floor(episode.duration / 60)}min` : 'N/A'}
                        </div>
                      </div>
                      {id === episode.uploadId ? (
                        <span className="text-[#fbb033] text-sm font-medium">{isPlaying ? `(${t('video.currentlyPlaying')})` : ''}</span>
                      ) :
                        <button
                          onClick={() => router.push(`/videoplayer?id=${encodeURIComponent(episode.uploadId || episode.id || '')}`)}
                          className="flex items-center px-3 py-1 bg-[#fbb033] text-black rounded hover:bg-yellow-500 transition-colors cursor-pointer"
                        >
                          <FiPlay className="mr-1" />
                          {t('videoInfo.watch', 'Watch')}
                        </button>
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerClient;
