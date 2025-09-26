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
import { formatDuration } from '@/utils/durationUtils';
import LoadingPage from '@/components/ui/LoadingPage';
import { type BufferAppendedData } from 'hls.js';
import StarRating from '@/components/ui/StarRating';
import RecommendationGrid from '@/components/movie/RecommendationGrid';


interface VideoPlayerClientProps {
  id?: string;
}

const VideoPlayerClient: React.FC<VideoPlayerClientProps> = ({ id: propId }) => {
  // For static export, read id from URL params client-side
  const searchParams = useSearchParams();
  const urlId = searchParams.get('id');
  const id = propId || urlId || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [masterPlaylist, setMasterPlaylist] = useState<string | null>(null);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [currentlyPlayingQuality, setCurrentlyPlayingQuality] = useState<number>(-1);
  const [calcDuration, setCalcDuration] = useState<number>(0);
  const [tOffset, setTOffset] = useState<number>(0);


  const router = useRouter();

  // Get video metadata from store
  const { currentVideo, setCurrentEpisode } = useVideoStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // Note: getPlayMain result not used currently, focusing on quality variants
        if (currentVideo && currentVideo.isSeries && currentVideo.currentEpisode && currentVideo.currentEpisode.uploadId !== id) {
          setCurrentEpisode(id);
          setCalcDuration((currentVideo.currentEpisode.duration ?? 0) | 0);
        }
        await getPlayMain(id);
        if (!mounted) return;
        const qualities: ('144p' | '360p' | '720p' | '1080p')[] = ['1080p', '720p', '360p', '144p'];
        const bandwidthMap: Record<string, number> = {
          '144p': 150000,   // ~150 kbps
          '360p': 800000,   // ~800 kbps
          '720p': 1500000,  // ~1.5 Mbps
          '1080p': 3000000, // ~3 Mbps
        };
        const resolutionMap: Record<string, string> = {
          '144p': '256x144',
          '360p': '640x360',
          '720p': '1280x720',
          '1080p': '1920x1080',
        };
        let masterPlaylist: string = '#EXTM3U\n#EXT-X-VERSION:3\n\n';
        for (const quality of qualities) {
          const v = await getPlaybackUrl(id, quality);
          if (!mounted) return;
          if (v !== null) {
            masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidthMap[quality]},RESOLUTION=${resolutionMap[quality]}\n${BASE_URL}/api-net/play/${id}/${quality}.m3u8\n\n`;
          }
        }
        loadFromMaster(masterPlaylist);
        setMasterPlaylist(masterPlaylist);

      } catch (err: unknown) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        // if (mounted) setLoading(false);
      }
    };

    fetchAll();
    return () => { mounted = false; };
  }, [id]);


  const loadFromMaster = (masterplaylist: string) => {
    if (!loading) setLoading(true);

    const videoElement = videoRef.current;
    if (!videoElement || !masterplaylist) return;

    // Clean up existing HLS instance
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch (_e) { }
      hlsRef.current = null;
    }

    // const playlistUrl = `${BASE_URL}/api-net/play/${id}/${quality}.m3u8`;
    const blob = new Blob([masterplaylist], { type: 'application/vnd.apple.mpegurl' });
    const masterUrl = URL.createObjectURL(blob);

    console.log('master url :', masterUrl)
    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr) => {
          xhr.setRequestHeader('api-key', process.env.UPLOAD_API_KEY || '');
        }
      });

      hlsRef.current = hls;
      hls.loadSource(masterUrl); ``
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setAvailableQualities(hlsRef.current?.levels.map(({ height }) => `${height}p`) || []);
        setCurrentlyPlayingQuality(hlsRef.current?.currentLevel || 0);
        
        // Start playback
        setIsPlaying(true);
        videoElement.play().catch(console.error);
        
        // Load duration information
        loadPlayTime();
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, () => {
        setCurrentlyPlayingQuality(hlsRef.current?.currentLevel || 0);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          setError(`Playback error: ${data.details}`);
        }
      });

      let local_tOffset = 0;
      const getAppendedOffset = (eventName: string, bufferData: BufferAppendedData) => {
        const { frag } = bufferData;
        if (frag.type === 'main' && frag.sn !== 'initSegment' && frag.elementaryStreams.video) {
          const { start, startDTS, startPTS, maxStartPTS, elementaryStreams } = frag;
          local_tOffset = elementaryStreams ? elementaryStreams.video ? elementaryStreams.video.startPTS - start : 0 : 0;
          hls.off(Hls.Events.BUFFER_APPENDED, getAppendedOffset);
          console.log('video timestamp offset:', local_tOffset, { start, startDTS, startPTS, maxStartPTS, elementaryStreams });
          
          // Update global tOffset and recalculate duration
          setTOffset(local_tOffset);
          
          // Recalculate duration now that we have the offset
          if (videoElement.duration && !isNaN(videoElement.duration) && isFinite(videoElement.duration)) {
            const calculatedDuration = Math.max(0, videoElement.duration - local_tOffset);
            setCalcDuration(calculatedDuration);
            console.log('Duration recalculated with offset:', calculatedDuration);
          }
        }
      }
      hls.on(Hls.Events.BUFFER_APPENDED, getAppendedOffset);
      // and account for this offset, for example like this:


      // const getDuration = () => videoElement.duration - tOffset;
      // const seek = (t) => videoElement.currentTime = t + tOffset;

    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = masterUrl;
      videoElement.addEventListener('loadedmetadata', () => {
        setIsPlaying(true);
        videoElement.play().catch(console.error);
        loadPlayTime();
      });
    } else {
      alert('HLS is not supported in this browser');
    }

    setLoading(false);
  }
  const loadPlayTime = () => {
    if (videoRef.current) {
      const videoElement = videoRef.current;
      
      // Wait for loadedmetadata event to ensure duration is available
      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded. Duration:', videoElement.duration, 'tOffset:', tOffset);
        if (!isNaN(videoElement.duration) && isFinite(videoElement.duration)) {
          const calculatedDuration = Math.max(0, videoElement.duration - tOffset);
          setCalcDuration(calculatedDuration);
          console.log('Calculated duration set to:', calculatedDuration);
        }
        // Remove this event listener once we have the duration
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };

      const handleDurationChange = () => {
        console.log('Duration changed:', videoElement.duration, 'tOffset:', tOffset);
        if (!isNaN(videoElement.duration) && isFinite(videoElement.duration)) {
          const calculatedDuration = Math.max(0, videoElement.duration - tOffset);
          setCalcDuration(calculatedDuration);
          console.log('Duration updated to:', calculatedDuration);
        }
      };

      // Check if duration is already available
      if (!isNaN(videoElement.duration) && isFinite(videoElement.duration)) {
        const calculatedDuration = Math.max(0, videoElement.duration - tOffset);
        setCalcDuration(calculatedDuration);
        console.log('Duration immediately available:', calculatedDuration);
      } else {
        // Wait for metadata to load
        videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.addEventListener('durationchange', handleDurationChange);
      }
    }
  };

  const dynamicQualityChange = (newQuality: number) => {
    console.log('Requested quality change to:', newQuality);
    console.log('currentQuality:', hlsRef.current?.currentLevel);
    console.log('AvailableQualities:', hlsRef.current?.levels);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = newQuality;
    }
    // if (newQuality === selectedQuality) return;
    // if (!variants[newQuality]) {
    //   setError(`Quality ${newQuality} not available`);
    //   return;
    // }
  }

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

        {/* {loading && <p>{t('video.loadingPlaylists')}</p>} */}
        {error && <p className="text-red-400">{error}</p>}
        
        {/* Debug info - remove this in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-800 p-4 rounded mb-4 text-sm">
            <p>Debug Info:</p>
            <p>calcDuration: {calcDuration}</p>
            <p>tOffset: {tOffset}</p>
            <p>video.duration: {videoRef.current?.duration || 'N/A'}</p>
            <p>isPlaying: {isPlaying.toString()}</p>
          </div>
        )}

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
                onEnded={() => {
                  setIsPlaying(false);
                  // Reload the video element to reset its state
                  videoRef.current?.load();
                }}
                onLoadedMetadata={() => {
                  // Fallback for non-HLS scenarios
                  if (!hlsRef.current) {
                    loadPlayTime();
                  }
                }}
                muted={false} // Ensure the video is not muted
              >
                {t('video.browserNotSupported')}
              </video>

              {/* Large centered play overlay when not playing */}
              {/* {!isPlaying && (
                <button
                  type="button"
                  aria-label={t('video.play')}
                  onClick={() => {
                    playVideo();
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/25 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-center w-20 h-20 md:w-28 md:h-28 bg-white/95 text-black rounded-full shadow-lg cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 md:w-12 md:h-12 ml-1">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </button>
              )} */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/25 transition-colors">
                  <LoadingPage message={t('video.loadingVideoPlayer')} className='relative bg-white/10 w-full h-full' />
                </div>
              )}

            </div>
            {currentVideo && (
              <div className="grid mt-6 h-full w-full md:grid-cols-[70%_30%] md:grid-rows-1 grid-cols-1 grid-rows-[70%_30%]">
                {/* Video Info Overlay */}
                <div className="w-full">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    {currentVideo.title}
                    {currentVideo.isSeries && currentVideo.currentEpisode && (
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
                    {typeof currentVideo.rating === 'number' &&  <StarRating rating={currentVideo.rating} size="sm" />}
                    {currentVideo.isSeries && (
                      <span className="bg-blue-600 px-2 py-1 rounded text-xs">Series</span>
                    )}
                    {calcDuration && (
                      <span className="text-gray-300">{formatDuration(calcDuration)}</span>
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
                    {availableQualities.map((quality, idx) => (
                      <button
                        key={idx}
                        onClick={() => dynamicQualityChange(idx)}
                        // disabled={!playlist || loading}
                        className={`px-4 py-2 rounded font-medium transition-colors ${idx === currentlyPlayingQuality
                          ? 'bg-[#fbb033] text-black'
                          : true
                            ? 'bg-gray-700 hover:bg-gray-600 text-white cursor-pointer'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        {quality}{idx === currentlyPlayingQuality && isPlaying && `(${t('video.currentlyPlaying')})`}
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
          <div className="w-full lg:w-[60vw] mx-auto space-y-6 ">
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
                {calcDuration > 0 && (
                  <div>
                    <span className="text-gray-400">{t('video.duration')}: </span>
                    <span className="text-white">{formatDuration(calcDuration)}</span>
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
                          {t('video.duration')}: {episode.duration ? `${Math.floor(episode.duration / 60)} min` : 'N/A'}
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

        {/* Recommended Videos Section */}
        {currentVideo?.id && (
          <div className="mt-8">
            <RecommendationGrid
              videoId={String(currentVideo.id)}
              title={t('video.recommendedVideos', 'Recommended Videos')}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-[#fbb033]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerClient;
