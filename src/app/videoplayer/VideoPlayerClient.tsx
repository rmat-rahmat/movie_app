/**
 * VideoPlayerClient.tsx
 * 
 * This component handles the playback of videos (movies and series episodes) in the Seefu TV app.
 * It supports:
 * - Loading video sources by uploadId, m3u8 URL, or directId (resolves to episode/movie)
 * - HLS.js integration for adaptive streaming and quality selection
 * - Resume playback from last watched position
 * - Watch history recording (periodically and on pause/end)
 * - Favorite and like toggling, with UI feedback
 * - Comments and recommendations display
 * - Quality permission filtering and dynamic quality switching
 * - Series episode navigation
 * 
 * Key conventions:
 * - Uses `useState`, `useEffect`, and refs for state and side effects.
 * - Uses helpers from `@/lib/movieApi` for API calls.
 * - Uses `useVideoStore` and `useAuthStore` for global state.
 * - Follows project conventions in .github/copilot-instructions.md.
 * 
 * To extend:
 * - Add new metadata fields as needed.
 * - Update API calls if backend changes.
 * - Use debug logging for troubleshooting.
 * 
 * Function-level comments are provided below for maintainability.
 */

"use client";
import React, { useEffect, useState, useRef } from 'react';
import { getPlayMain, getPlaybackUrl, recordWatchHistory, getLastWatchPosition, toggleFavorite, checkFavorite, toggleVideoLike, checkVideoLike, getContentDetail } from '@/lib/movieApi';
import Hls from 'hls.js';
import { BASE_URL } from '@/config';
import { useVideoStore } from '@/store/videoStore';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import { FiPlay } from 'react-icons/fi';
import { FiHeart, FiMessageCircle, FiThumbsUp } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { formatDuration } from '@/utils/durationUtils';
import LoadingPage from '@/components/ui/LoadingPage';
import { type BufferAppendedData } from 'hls.js';
import StarRating from '@/components/ui/StarRating';
import RecommendationGrid from '@/components/movie/RecommendationGrid';
import CommentSection from '@/components/comment/CommentSection';
import { encryptUrl } from '@/utils/urlEncryption';
import ShareButton from '@/components/ui/ShareButton';
import { useAuthStore } from '@/store/authStore';
import { QualityPermission } from '@/types/Dashboard';

const readyStatus=['READY','AUDIT_PENDING','AUDIT_REJECTED','CAN_PUBLISH','PUBLISHED','OFFLINE'];

interface VideoPlayerClientProps {
  id?: string;
}

const VideoPlayerClient: React.FC<VideoPlayerClientProps> = ({ id: propId }) => {
  // For static export, read id from URL params client-side
  const searchParams = useSearchParams();
  const urlId = searchParams.get('id');
  const m3u8Url = searchParams.get('m3u8');
  const mediaID = searchParams.get('mediaid');
  const directId = searchParams.get('directid'); // New: video ID that needs to be resolved
  const owner = searchParams.get('self'); // New: video ID that needs to be resolved
  const id = propId || urlId || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [masterPlaylist, setMasterPlaylist] = useState<string | null>(null);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [filteredQuality, setFilteredQuality] = useState<QualityPermission[]>([]);
  const [currentlyPlayingQuality, setCurrentlyPlayingQuality] = useState<number>(-1);
  const [calcDuration, setCalcDuration] = useState<number>(0);
  const [tOffset, setTOffset] = useState<number>(0);
  const watchIntervalRef = useRef<number | null>(null);
  const sessionWatchTimeRef = useRef<number>(0); // seconds accumulated this session
  const hasSeekedRef = useRef<boolean>(false);
  const [actualUploadId, setActualUploadId] = useState<string>(''); // Store resolved uploadId from directId
  const { user } = useAuthStore();
  const [isFinishProcess, setIsFinishProcess] = useState<boolean>(true);

  // Favorite state
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  // Like state
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [showInfoAccordion, setShowInfoAccordion] = useState(false);


  const router = useRouter();

  // Get video metadata from store
  const { currentVideo, setCurrentEpisode, setVideoFromDetails } = useVideoStore();
  const { t } = useTranslation();

  // Effect to handle directId - fetch content details and resolve to uploadId
  useEffect(() => {

    let mounted = true;
    const fetchContentAndResolve = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching content details for directId:', directId);

        const contentDetails = await getContentDetail(directId || "", owner === "true");

        if (!mounted) return;

        if (!contentDetails) {
          throw new Error('Failed to fetch content details');
        }

        console.log('Content details fetched:', contentDetails);

        // Determine the uploadId to use
        let uploadIdToUse = '';

        if (contentDetails.episodes && contentDetails.episodes[0] && contentDetails.episodes[0].m3u8Url) {
          const m3u8Url = contentDetails.episodes[0].m3u8Url || '';
          const mediaID = contentDetails.episodes[0].id || '';
          console.log('M3U8 URL detected, using:', m3u8Url);
          if(readyStatus.includes(contentDetails.episodes[0].status?.toUpperCase()||"")){
            setIsFinishProcess(true);
          }
          else{
            alert(t('common:m3u8Url'));
            setIsFinishProcess(false);
          }
          router.replace(`/videoplayer?m3u8=${encodeURIComponent(m3u8Url)}&mediaid=${encodeURIComponent(mediaID)}`);
        }
        else if (contentDetails.episodes && contentDetails.episodes[0] && contentDetails.episodes[0].uploadId) {
          // For series, use the first episode's uploadId
           if(readyStatus.includes(contentDetails.episodes[0].status?.toUpperCase()||"")){
            setIsFinishProcess(true);
          }
          else{
            setIsFinishProcess(false);
          }
          uploadIdToUse = contentDetails.episodes[0].uploadId || '';
          console.log('Se`ries detected, using first episode uploadId:', uploadIdToUse);
        }
        else if (contentDetails.episodes && contentDetails.episodes[0] && contentDetails.episodes[0].playUrl) {
          const playUrl = contentDetails.episodes[0].playUrl || '';
          console.log('Play URL detected, using:', playUrl);
          const encryptedUrl = encryptUrl(playUrl);
          router.push(`/videoplayerExternal?url=${encodeURIComponent(encryptedUrl)}`);
        }
        else if(contentDetails.episodes && contentDetails.episodes.length===0){
          
        }
        else {
          throw new Error('No episode found in content details');
        }
        // } else if (contentDetails.uploadId) {
        //   // For movies, use the direct uploadId
        //   uploadIdToUse = contentDetails.uploadId;
        //   console.log('Movie detected, using uploadId:', uploadIdToUse);
        // } else {
        //   throw new Error('No uploadId found in content details');
        // }

        // Set the video details in store with the resolved uploadId
        setVideoFromDetails(contentDetails, uploadIdToUse);
        console.log('Video details set in store with uploadId:', uploadIdToUse);
        setActualUploadId(uploadIdToUse);
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : String(err);
        console.error('Failed to resolve directId:', message);
        setError(message);
        setLoading(false);
      }
    };


    if (!directId) {
      setActualUploadId('');
    } else {

      fetchContentAndResolve();
    }
    return () => { mounted = false; };
  }, [directId, setVideoFromDetails, setCurrentEpisode]);

  useEffect(() => {
    // If m3u8Url is provided, use it directly
    if (m3u8Url) {
      console.log('Loading video from direct m3u8 URL:', m3u8Url);
      loadFromDirectM3u8(decodeURIComponent(m3u8Url));
      return;
    }

    // Determine which ID to use: actualUploadId (from directId) or regular id
    const uploadIdToLoad = actualUploadId || id;

    if (!uploadIdToLoad) return;
    console.log('Loading video from uploadId:', uploadIdToLoad);
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // Note: getPlayMain result not used currently, focusing on quality variants

        if (currentVideo && currentVideo.isLiked) {
          setIsLiked(currentVideo.isLiked || false);
        }
        if (currentVideo && typeof currentVideo.likeCount === 'number') {
          setLikeCount(currentVideo.likeCount || 0);
        }

        if (currentVideo && currentVideo.isSeries && currentVideo.currentEpisode && currentVideo.currentEpisode.uploadId !== uploadIdToLoad) {
          setCurrentEpisode(uploadIdToLoad);
          setCalcDuration((currentVideo.currentEpisode.duration ?? 0) | 0);
        }

        await getPlayMain(uploadIdToLoad);
        if (!mounted) return;
        console.log("current video check", currentVideo);
        const qualities: ('360p' | '480p' | '720p' | '1080p')[] = ['1080p', '720p', '480p', '360p'];
        const bandwidthMap: Record<string, number> = {
          '360p': 800000,   // ~800 kbps
          '480p': 1500000,  // ~1.5 Mbps
          '720p': 1500000,  // ~1.5 Mbps
          '1080p': 3000000, // ~3 Mbps
        };
        const resolutionMap: Record<string, string> = {
          '360p': '640x360',
          '480p': '854x480',
          '720p': '1280x720',
          '1080p': '1920x1080',
        };
        let masterPlaylist: string = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

        const qualityPermissions = currentVideo?.currentEpisode?.qualityPermissions || null;
      setFilteredQuality(qualityPermissions||[]);
        console.log('Quality permissions:', qualityPermissions);
        for (const quality of qualities) {
          let permitted = false;
          if (qualityPermissions && qualityPermissions.length > 0) {
            permitted = !!qualityPermissions.find(qp => qp.qualityName?.toUpperCase() == quality.toUpperCase());
          }
          else if(owner === "true") {
            permitted = true; // Allow all qualities for own content
          }
          else {
            const v = await getPlaybackUrl(uploadIdToLoad, quality);
            permitted = v !== null;
          }


          console.log(`Quality ${quality} permitted:`, permitted);
          if (!mounted) return;
          console.log(`${BASE_URL}/api-net/play/${uploadIdToLoad}/${quality}.m3u8`);
          if (permitted) {
            masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidthMap[quality]},RESOLUTION=${resolutionMap[quality]}\n${BASE_URL}/api-net/play/${uploadIdToLoad}/${quality}.m3u8\n\n`;
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
  }, [actualUploadId, id, m3u8Url]);

  // Check favorite and like status when video loads
  useEffect(() => {
    if (!currentVideo?.id) return;

    const checkFavoriteStatus = async () => {
      try {
        const isFav = await checkFavorite(String(currentVideo.id));
        setIsFavorited(isFav);
      } catch (err) {
        console.error('Failed to check favorite status:', err);
      }
    };

    const checkLikeStatus = async () => {
      try {
        const liked = await checkVideoLike(String(currentVideo.id));
        setIsLiked(liked);
      } catch (err) {
        console.error('Failed to check like status:', err);
      }
    };

    checkFavoriteStatus();
    checkLikeStatus();
  }, [currentVideo?.id]);

  // Periodically record watch history when playing
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // Use actualUploadId if available (from directId), otherwise use id
    const currentUploadId = actualUploadId || id || currentVideo?.episodes?.[0]?.id || "";


    const sendRecord = async () => {
      if (!videoEl) return;
      const episode = currentVideo?.episodes?.find(ep => ep.uploadId === currentUploadId);
      console.log('Recording watch history for episode:', episode);
      try {
        const dto = {
          mediaId: currentVideo?.id ? String(currentVideo.id) : String(currentUploadId),
          episodeId: episode?.id || currentUploadId,
          watchTime: Math.floor(sessionWatchTimeRef.current),
          duration: Math.floor(calcDuration || videoEl.duration || 0),
          progress: Math.floor(videoEl.currentTime || 0),
          source: 'web'
        };
        // reset session counter after sending
        await recordWatchHistory(dto);
        sessionWatchTimeRef.current = 0;
      } catch (_e) {
        // ignore
      }
    };

    const onPlay = () => {
      // start counting watch time per second
      if (watchIntervalRef.current) window.clearInterval(watchIntervalRef.current);
      watchIntervalRef.current = window.setInterval(() => {
        sessionWatchTimeRef.current += 1;
      }, 1000);
    };

    const onPauseOrEnd = () => {
      if (watchIntervalRef.current) {
        window.clearInterval(watchIntervalRef.current);
        watchIntervalRef.current = null;
      }
      // flush record
      sendRecord().catch(() => { });
    };

    const onBeforeUnload = () => {
      if (watchIntervalRef.current) window.clearInterval(watchIntervalRef.current);
      // synchronous navigator.sendBeacon fallback could be used, but we'll try fetch
      sendRecord().catch(() => { });
    };

    videoEl.addEventListener('play', onPlay);
    videoEl.addEventListener('pause', onPauseOrEnd);
    videoEl.addEventListener('ended', onPauseOrEnd);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      videoEl.removeEventListener('play', onPlay);
      videoEl.removeEventListener('pause', onPauseOrEnd);
      videoEl.removeEventListener('ended', onPauseOrEnd);
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (watchIntervalRef.current) window.clearInterval(watchIntervalRef.current);
    };
  }, [actualUploadId, id, currentVideo, calcDuration]);


  /**
   * loadFromMaster
   * Loads a master HLS playlist into the video element using HLS.js.
   * Sets up quality selection, playback, and resume logic.
   */
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
          // xhr.setRequestHeader('api-key', process.env.UPLOAD_API_KEY || '');
        }
      });

      hlsRef.current = hls;
      hls.loadSource(masterUrl); ``
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Avoid duplicate qualities
        const uniqueQualities = Array.from(
          new Set(hlsRef.current?.levels.map(({ height }) => `${height}p`))
        );
        setAvailableQualities(uniqueQualities);
        setCurrentlyPlayingQuality(hlsRef.current?.currentLevel || 0);

        // Start playback
        setIsPlaying(true);
        videoElement.play().catch(console.error);

        // Load duration information
        loadPlayTime();
        // attempt resume: fetch last watch position and seek (once)
        (async () => {
          try {
            if (!hasSeekedRef.current) {
              let lastPos: number | null = null;

              const loadID = id || currentVideo?.episodes?.[0]?.id || "";
              try {
                lastPos = await getLastWatchPosition(currentVideo?.id ? String(currentVideo.id) : String(id), loadID);
              } catch (posError) {
                console.warn('Failed to fetch last watch position:', posError);
                // Continue without resuming - don't throw
                return;
              }

              if (typeof lastPos === 'number' && !isNaN(lastPos) && lastPos > 0) {
                // account for tOffset when seeking: stored progress is logical playhead (without offset),
                // so add tOffset to map to media timeline
                const seekTarget = lastPos + (tOffset || 0);
                // wait for metadata/duration to be available
                const waitForMeta = () => new Promise<void>((resolve) => {
                  if (!videoElement) return resolve();
                  if (!isNaN(videoElement.duration) && isFinite(videoElement.duration)) return resolve();
                  const onLoaded = () => { videoElement.removeEventListener('loadedmetadata', onLoaded); resolve(); };
                  videoElement.addEventListener('loadedmetadata', onLoaded);
                });
                await waitForMeta();
                // clamp seekTarget
                const maxSeek = (videoElement.duration && isFinite(videoElement.duration)) ? Math.max(0, videoElement.duration - 1) : seekTarget;
                const finalSeek = Math.min(seekTarget, maxSeek);
                if (!isNaN(finalSeek) && finalSeek > 0) {
                  try {
                    videoElement.currentTime = finalSeek;
                    console.log('Resumed playback at', finalSeek, 'seconds (lastPos', lastPos, 'tOffset', tOffset, ')');
                  } catch (e) {
                    console.warn('Failed to set currentTime for resume', e);
                  }
                }
                hasSeekedRef.current = true;
              }
            }
          } catch (e) {
            // ignore resume errors - don't let them break the page
            console.warn('Resume fetch failed', e);
          }
        })();
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
  };

  /**
   * loadFromDirectM3u8
   * Loads a direct m3u8 URL into the video element using HLS.js.
   * Handles quality permissions and resume logic.
   */
  const loadFromDirectM3u8 = (m3u8DirectUrl: string) => {
    if (!loading) setLoading(true);

    setCurrentEpisode(m3u8DirectUrl);
    console.log('Direct m3u8 url :', currentVideo)
    const episode = currentVideo?.episodes?.find(ep => ep.id === mediaID);
    const serverQualityPermissions = episode?.qualityPermissions || [];
    setFilteredQuality(serverQualityPermissions);
    console.log('Direct m3u8 episode :', episode)
    console.log('Direct m3u8 serverQualityPermissions :', serverQualityPermissions)

    const videoElement = videoRef.current;
    if (!videoElement || !m3u8DirectUrl) return;

    // Clean up existing HLS instance
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch (_e) { }
      hlsRef.current = null;
    }

    console.log('Loading direct m3u8 URL:', m3u8DirectUrl);

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr) => {
          // Add any necessary headers here if needed
        }
      });

      hlsRef.current = hls;
      hls.loadSource(m3u8DirectUrl);
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const availableLevels = hlsRef.current?.levels.map(({ height }) => `${height}p`) || []
        setAvailableQualities(availableLevels);

        if (serverQualityPermissions.length > 0) {
        const initialQualityIndex = hlsRef.current?.levels.findIndex(({ height }) => `${height}p`.toUpperCase() === serverQualityPermissions[0].qualityName?.toUpperCase()) || 0;

        if (hlsRef.current && initialQualityIndex > -1) {
          hlsRef.current.currentLevel = initialQualityIndex;
        }
        console.log('Initial quality index based on server permissions:', initialQualityIndex);
        setCurrentlyPlayingQuality(initialQualityIndex);
}
        // Start playback
        setIsPlaying(true);
        videoElement.play().catch(console.error);

        // Load duration information
        loadPlayTime();

        // Resume from last watch position if available
        (async () => {
          try {
            if (!hasSeekedRef.current && currentVideo?.id) {
              let lastPos: number | null = null;
              try {
                lastPos = await getLastWatchPosition(String(currentVideo.id), id || mediaID || "");
              } catch (posError) {
                console.warn('Failed to fetch last watch position:', posError);
                // Continue without resuming - don't throw
                return;
              }

              if (typeof lastPos === 'number' && !isNaN(lastPos) && lastPos > 0) {
                const seekTarget = lastPos + (tOffset || 0);
                const waitForMeta = () => new Promise<void>((resolve) => {
                  if (videoElement.readyState >= 1) return resolve();
                  const onLoadedMetadata = () => {
                    videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
                    resolve();
                  };
                  videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
                });
                await waitForMeta();
                const maxSeek = (videoElement.duration && isFinite(videoElement.duration)) ? Math.max(0, videoElement.duration - 1) : seekTarget;
                const finalSeek = Math.min(seekTarget, maxSeek);
                if (!isNaN(finalSeek) && finalSeek > 0) {
                  videoElement.currentTime = finalSeek;
                  console.log(`Resumed playback at ${finalSeek}s`);
                }
                hasSeekedRef.current = true;
              }
            }
          } catch (e) {
            console.warn('Resume fetch failed', e);
          }
        })();
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
          const { elementaryStreams } = frag;
          local_tOffset = elementaryStreams ? elementaryStreams.video ? elementaryStreams.video.startPTS - frag.start : 0 : 0;
          hls.off(Hls.Events.BUFFER_APPENDED, getAppendedOffset);
          console.log('video timestamp offset:', local_tOffset);

          setTOffset(local_tOffset);

          if (videoElement.duration && !isNaN(videoElement.duration) && isFinite(videoElement.duration)) {
            const calculatedDuration = Math.max(0, videoElement.duration - local_tOffset);
            setCalcDuration(calculatedDuration);
            console.log('Duration recalculated with offset:', calculatedDuration);
          }
        }
      };
      hls.on(Hls.Events.BUFFER_APPENDED, getAppendedOffset);

    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoElement.src = m3u8DirectUrl;
      videoElement.addEventListener('loadedmetadata', () => {
        setIsPlaying(true);
        videoElement.play().catch(console.error);
        loadPlayTime();
      });
    } else {
      setError('HLS is not supported in this browser');
    }

    setLoading(false);
  };

  /**
   * loadPlayTime
   * Loads and sets the video duration, accounting for timestamp offset.
   */
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

  /**
   * dynamicQualityChange
   * Switches the video quality in HLS.js to the selected level.
   */
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

  /**
   * handleAuthRequired
   * Prompts user to login and redirects to login page with return URL
   */
  const handleAuthRequired = (action: string) => {
    const currentPath = window.location.pathname + window.location.search;
    const returnUrl = encodeURIComponent(currentPath);
    
    if (confirm(t('auth.loginRequired', `You need to login to ${action}. Do you want to login now?`))) {
      router.push(`/auth/login?returnUrl=${returnUrl}`);
    }
  };

  /**
   * handleToggleFavorite
   * Toggles the favorite status for the current video and updates UI.
   */
  const handleToggleFavorite = async () => {
    if (!user) {
      handleAuthRequired(t('video.favorite', 'add to favorites'));
      return;
    }

    if (!currentVideo?.id) return;

    setIsFavoriteLoading(true);
    try {
      const result = await toggleFavorite(String(currentVideo.id));
      if (result.success) {
        setIsFavorited(result.isFavorited);
      } else {
        console.error('Failed to toggle favorite:', result.message);
        alert(result.message || t('video.favoriteError', 'Failed to update favorite status'));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert(t('video.favoriteError', 'Failed to update favorite status'));
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  /**
   * handleToggleLike
   * Toggles the like status for the current video and updates UI.
   */
  const handleToggleLike = async () => {
    if (!user) {
      handleAuthRequired(t('video.like', 'like this video'));
      return;
    }

    if (!currentVideo?.id) return;

    setIsLikeLoading(true);
    try {
      const result = await toggleVideoLike(String(currentVideo.id));

      if (result.success) {
        // setLikeCount(previous => isLiked ? previous + 1 : Math.max(0, previous - 1))
        setIsLiked(previous => !previous);
      } else {
        console.error('Failed to toggle like:', result.message);
        alert(result.message || t('video.likeError', 'Failed to update like status'));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      alert(t('video.likeError', 'Failed to update like status'));
    } finally {
      setIsLikeLoading(false);
    }
  };

  /**
   * handleCommentClick
   * Shows comments section or prompts login if not authenticated
   */
  const handleCommentClick = () => {
    if (!user) {
      handleAuthRequired(t('comments.title', 'view comments'));
      return;
    }
    setShowComments(!showComments);
  };

  /**
   * Effect: Cleans up HLS.js instance on unmount.
   */
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  /**
   * Effect: Sets default video volume on mount.
   */
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = 1; // Set default volume to 100%
    }
  }, []);

  /**
   * RenderQualityButtons
   * Renders quality selection buttons, filtered by permissions.
   */
  const RenderQualityButtons =
    ({
      list,
      filter,
      current,
      onQualityChange
    }: {
      list: string[];
      filter: QualityPermission[];
      current: number;
      onQualityChange: (qualityIndex: number) => void;
    }) => {
      {
        const uniqueFilter = [...filter];
        console.log('Rendering quality buttons with filter:', uniqueFilter);
        return list.map((quality, idx) => {
          // Check if quality is in filteredQuality (if applicable)
          let status = "DENY";
          console.log('Checking quality:', quality);
          if (filter.length > 0) {
            const qualityName = quality.toUpperCase();
            const filterIdx = uniqueFilter.findIndex(
              qp => qp.qualityName?.toUpperCase() === qualityName && qp.status === "ALLOW"
            );
            console.log('Filter index for', quality, ':', filterIdx);
            if (filterIdx === -1) {
              return null; // Skip rendering this quality button
            } else {
              status = uniqueFilter[filterIdx].status || "DENY";
              // Remove permitted quality from uniqueFilter
              uniqueFilter.splice(filterIdx, 1);
            }
          }
          return (
            <button
              key={idx}
              onClick={() => {
                if(owner === "true") {
                  dynamicQualityChange(idx);
                  return;
                }
                switch (status) {
                  case "ALLOW":
                    dynamicQualityChange(idx);
                    break;
                  case "REQUIRE_LOGIN":
                    confirm(t('video.qualityRequiresLogin', 'This quality requires you to be logged in. Do you want to log in now?')) && router.push('/login');
                    break;
                  case "DENY":
                    alert(t('video.qualityNotPermitted', 'You do not have permission to access this quality.'));
                    break;
                  default:
                    alert(t('video.qualityNotPermitted', 'You do not have permission to access this quality.'));
                }
              }}
              // disabled={!playlist || loading}
              className={`px-4 py-2 rounded font-medium transition-colors ${idx === current
                ? 'bg-[#fbb033] text-black'
                : true
                  ? 'bg-gray-700 hover:bg-gray-600 text-white cursor-pointer'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
            >
              {quality}{idx === current && isPlaying && `(${t('video.currentlyPlaying')})`}
            </button>)
        })
      }
    }

  // Show fallback when no video ID, m3u8Url, or directId is provided
  if (!id && !m3u8Url && !directId) {
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
            {isFinishProcess ?<div className="bg-black rounded-lg overflow-hidden mx-auto relative">
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
              {!isPlaying && (
                <button
                  type="button"
                  aria-label={t('video.play')}
                  onClick={() => {
                    // playVideo();
                    if (m3u8Url) {
                      console.log(currentVideo)
                      loadFromDirectM3u8(decodeURIComponent(m3u8Url));
                    } else {

                      loadFromMaster(masterPlaylist || '');
                    }

                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/25 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-center w-20 h-20 md:w-28 md:h-28 bg-white/95 text-black rounded-full shadow-lg cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 md:w-12 md:h-12 ml-1">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </button>
              )}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/25 transition-colors">
                  <LoadingPage message={t('video.loadingVideoPlayer')} className='relative bg-white/10 w-full h-full' />
                </div>
              )}

            </div>: <div className="flex flex-col items-center justify-center w-full h-64 bg-black rounded-lg">
            <p className="text-white mb-4">{t('video.processingVideo')}</p>
            {/* <LoadingPage message={t('video.processingVideo')} className='relative bg-white/10 w-full h-full' /> */}
          </div>}
            {currentVideo && (
              <div className="grid mt-6 h-full w-full md:grid-cols-[70%_30%] md:grid-rows-1 grid-cols-1 grid-rows-[70%_30%]">
                {/* Video Info Overlay */}
                <div className="w-full">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold flex-1">
                      {currentVideo.title}
                      {currentVideo.isSeries && currentVideo.currentEpisode && (
                        <span className="text-xl md:text-2xl text-gray-300 ml-2">
                          - Episode {currentVideo.currentEpisode.episodeNumber}
                          {currentVideo.currentEpisode.episodeTitle && `: ${currentVideo.currentEpisode.episodeTitle}`}
                        </span>
                      )}
                    </h1>


                  </div>

                  <div className="flex flex-wrap items-center gap-4 mb-3">
                    {currentVideo.releaseDate && (
                      <span className="text-gray-300">{currentVideo.releaseDate}</span>
                    )}
                    {typeof currentVideo.rating === 'number' && <StarRating rating={currentVideo.rating} size="sm" />}
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

                  {/* Interaction Buttons */}
                  <div className="flex items-center gap-4 mt-4">
                    {/* Like Button */}
                    <button
                      onClick={handleToggleLike}
                      disabled={isLikeLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        isLiked
                          ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      } disabled:opacity-50`}
                    >
                      <FiThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="hidden md:block text-sm font-medium">
                        {`${isLiked ? t('video.liked', 'Liked') : t('video.like', 'Like')}`}
                      </span>
                    </button>

                    {/* Comments Button */}
                    <button
                      onClick={handleCommentClick}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${
                        showComments
                          ? 'bg-[#fbb033]/20 text-[#fbb033] hover:bg-[#fbb033]/30'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <FiMessageCircle className="w-5 h-5" />
                      <span className="hidden md:block text-sm font-medium">
                        {t('comments.title', 'Comments')} {commentCount > 0 && `(${commentCount})`}
                      </span>
                    </button>

                    {/* Favorite Button */}
                    <button
                      onClick={handleToggleFavorite}
                      disabled={isFavoriteLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        isFavorited
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      } disabled:opacity-50`}
                    >
                      <FiHeart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                      <span className="hidden md:block text-sm font-medium">
                        {isFavorited ? t('video.favorited', 'Favorited') : t('video.favorite', 'Favorite')}
                      </span>
                    </button>

                    {/* Share Button */}
                    {currentVideo?.id && (
                      <ShareButton
                        targetId={String(currentVideo.id)}
                        contentType={currentVideo.isSeries && currentVideo.currentEpisode ? 'episode' : 'video'}
                        title={currentVideo.title}
                      />
                    )}
                  </div>
                </div>
                {/* Quality Selection */}
                {isPlaying && <div className="mt-4 mx-auto w-full">
                  <h3 className="text-lg font-semibold mb-2">{t('video.selectQuality')}</h3>
                  <div className="flex gap-2 flex-wrap">
                    <RenderQualityButtons
                      list={availableQualities}
                      current={currentlyPlayingQuality}
                      filter={filteredQuality}
                      onQualityChange={dynamicQualityChange}
                    />
                  </div>
                </div>}
              </div>
            )}
          </div>

        </section>

        {/* Additional Video Information */}
        {currentVideo && (
          <div className="w-full lg:w-[60vw] mx-auto space-y-3 ">
            {/* Accordion trigger */}
            <button
              className="w-full flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer text-left font-semibold text-sm text-white hover:bg-gray-700 transition-colors"
              onClick={() => setShowInfoAccordion((prev) => !prev)}
              aria-expanded={showInfoAccordion}
              aria-controls="video-info-accordion"
            >
              <span>{t('upload.viewDetails', 'Additional Video Information')}</span>
              <svg
                className={`w-6 h-6 transform transition-transform ${showInfoAccordion ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* Accordion content */}
            <div
              id="video-info-accordion"
              className={`overflow-hidden transition-all duration-300 ${showInfoAccordion ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
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

            </div>

            {/* Episodes List for Series - horizontal grid, only episode number */}
            {currentVideo.isSeries && currentVideo.episodes && currentVideo.episodes.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-3">{`${currentVideo.episodes.length > 1 && `${currentVideo.episodes.length} `}${t('video.episodes')}`}</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {currentVideo.episodes.map((episode) => (
                    <button
                      key={episode.id || episode.uploadId}
                      onClick={() => {
                        setCurrentEpisode(episode.uploadId || episode.id || episode.m3u8Url || episode.playUrl || '');
                        if (episode.m3u8Url) {
                          router.push(`/videoplayer?m3u8=${encodeURIComponent(episode.m3u8Url)}&mediaid=${encodeURIComponent(episode.id || '')}`)
                        }
                        else if (episode.playUrl) {
                          console.log('Play URL detected, using:', episode.playUrl);
                          const encryptedUrl = encryptUrl(episode.playUrl);
                          router.push(`/videoplayerExternal?url=${encodeURIComponent(encryptedUrl)}`);
                        } else {
                          router.push(`/videoplayer?id=${encodeURIComponent(episode.uploadId || episode.id || '')}`)
                        }
                      }}
                      className={`min-w-[56px] h-14 flex items-center justify-center rounded-lg font-bold text-lg transition-colors cursor-pointer
                          ${(currentVideo.currentEpisode?.uploadId === (episode.uploadId))||(currentVideo.currentEpisode?.id === episode.id)||(currentVideo.currentEpisode?.m3u8Url === episode.m3u8Url)
                          ? ' text-[#fbb033] border border-[#fbb033]'
                          : 'bg-gray-800 text-white hover:bg-gray-700'
                        }`}
                      style={{ flex: '0 0 auto' }}
                    >
                      {episode.episodeNumber || '-'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comments Section */}
        {currentVideo?.id && (
          <div className="mt-8 w-full lg:w-[60vw] mx-auto">
            <CommentSection
              isauth={user !== null}
              showComments={showComments}
              mediaId={String(currentVideo.id)}
              mediaType={'video'}
              className="bg-gray-900/50 rounded-lg p-6"
              onCommentCountChange={setCommentCount}
            />
          </div>
        )}

        {/* Recommended Videos Section */}
        {currentVideo?.id &&
          <div className="mt-8 w-full lg:w-[60vw] mx-auto">
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
        }
      </div>
    </div>
  );
};

export default VideoPlayerClient;
