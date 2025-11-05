"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { decryptUrl, encryptUrl } from '@/utils/urlEncryption';
import LoadingPage from '@/components/ui/LoadingPage';
import { useVideoStore } from '@/store/videoStore';
import { useAuthStore } from '@/store/authStore';
import { formatDuration } from '@/utils/durationUtils';
import StarRating from '@/components/ui/StarRating';
import RecommendationGrid from '@/components/movie/RecommendationGrid';
import { FiPlay, FiHeart, FiMessageCircle, FiThumbsUp } from 'react-icons/fi';
import { toggleFavorite, checkFavorite, toggleVideoLike, checkVideoLike } from '@/lib/movieApi';
import CommentSection from '@/components/comment/CommentSection';
import ShareButton from '@/components/ui/ShareButton';

interface VideoPlayerClientProps {
  url?: string;
}

const VideoPlayerClient: React.FC<VideoPlayerClientProps> = ({ url: propUrl }) => {
  const searchParams = useSearchParams();
  const urlParam = searchParams.get('url');
  const encryptedUrl = propUrl || urlParam || '';
  
  const [externalUrl, setExternalUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();

  // Get video metadata from store
  const { currentVideo } = useVideoStore();

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

  // Add accordion state
  const [showInfoAccordion, setShowInfoAccordion] = useState(false);

  useEffect(() => {
    if (!encryptedUrl) {
      setError('No video URL provided');
      setLoading(false);
      return;
    }

    try {
      const decryptedUrl = decryptUrl(encryptedUrl);
      if (!decryptedUrl) {
        throw new Error('Failed to decrypt URL');
      }
      
      // Validate URL
      try {
        new URL(decryptedUrl);
        setExternalUrl(decryptedUrl);
      } catch {
        throw new Error('Invalid URL format');
      }
      
      setError(null);
    } catch (err) {
      console.error('Error decrypting URL:', err);
      setError('Failed to load video');
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Ad blocking and iframe security
  useEffect(() => {
    if (!externalUrl) return;

    const blockAds = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      // Add security attributes
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups allow-forms');
      iframe.setAttribute('referrerPolicy', 'no-referrer');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
      
      // Try to inject ad-blocking CSS when iframe loads
      iframe.onload = () => {
        try {
          if (iframe.contentDocument) {
            const head = iframe.contentDocument.head;
            const adBlockCSS = document.createElement('style');
            adBlockCSS.textContent = `
              /* Hide common ad containers */
              [id*="ad"], [class*="ad"], [id*="banner"], [class*="banner"],
              [id*="popup"], [class*="popup"], [id*="overlay"], [class*="overlay"],
              .advertisement, .ads, .ad-container, .banner-ad, .ad-overlay,
              iframe[src*="googleads"], iframe[src*="doubleclick"],
              iframe[src*="googlesyndication"], iframe[src*="adsystem"],
              div[class*="ad"], div[id*="ad"], span[class*="ad"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                width: 0 !important;
                height: 0 !important;
                position: absolute !important;
                left: -9999px !important;
              }
              
              /* Ensure video takes full space */
              body { 
                margin: 0 !important; 
                padding: 0 !important; 
                background: black !important; 
                overflow: hidden !important;
              }
              video { 
                width: 100% !important; 
                height: 100% !important; 
                object-fit: contain !important;
              }
              
              /* Hide skip ads buttons and overlays */
              button[class*="skip"], button[id*="skip"],
              .skip-ad, .ytp-ad-skip-button, .video-ads,
              .ad-showing, .ad-interrupting { 
                display: none !important; 
              }
            `;
            
            if (head) {
              head.appendChild(adBlockCSS);
            }
          }
        } catch (e) {
          // Cross-origin restrictions prevent access
          console.log('Cannot inject ad-blocking CSS due to CORS');
        }
      };
    };

    blockAds();
  }, [externalUrl]);

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

  // Initialize like count from store
  useEffect(() => {
    if (currentVideo) {
      if (currentVideo.isLiked !== undefined) {
        setIsLiked(currentVideo.isLiked);
      }
      if (typeof currentVideo.likeCount === 'number') {
        setLikeCount(currentVideo.likeCount);
      }
    }
  }, [currentVideo]);

  // Toggle favorite status
  const handleToggleFavorite = async () => {
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

  // Toggle like status
  const handleToggleLike = async () => {
    if (!currentVideo?.id) return;

    setIsLikeLoading(true);
    try {
      const result = await toggleVideoLike(String(currentVideo.id));
    
      if (result.success) {
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

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Error Loading Video</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => router.back()}
            className="bg-[#fbb033] text-black px-6 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <div className="p-6">
        {!currentVideo && (
          <h1 className="text-2xl font-bold mb-4">{t('video.externalPlayerTitle', 'External Video Player')}</h1>
        )}

        {error && <p className="text-red-400 mb-4">{error}</p>}
        
        {/* Video Player */}
        <section className="mb-6">
          <div className="w-full lg:w-[60vw] mx-auto pb-6">
            <div className="bg-black rounded-lg overflow-hidden mx-auto relative">
              {/* Back button and controls */}
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <button
                  onClick={() => router.back()}
                  className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
                  title="Go back"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                
                <button
                  onClick={toggleFullscreen}
                  className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9v-4.5M15 9h4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15v4.5M15 15h4.5m0 0l5.25 5.25" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15m-5.25 5.25v-4.5m0 4.5h4.5m-4.5 0L9 15" />
                    </svg>
                  )}
                </button>
              </div>

              {/* External video iframe */}
              <div 
                ref={containerRef}
                className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'w-full aspect-video'}`}
              >
                <iframe
                  ref={iframeRef}
                  src={externalUrl}
                  className="w-full h-full border-0"
                  allowFullScreen
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  title="External Video Player"
                  style={{ border: 'none', backgroundColor: 'black' }}
                />
                
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <LoadingPage message={t('video.loadingVideoPlayer')} className="relative bg-white/10 w-full h-full" />
                  </div>
                )}
              </div>
            </div>

            {/* Video Information */}
            {currentVideo && (
              <div className="grid mt-6 h-full w-full md:grid-cols-[70%_30%] md:grid-rows-1 grid-cols-1 grid-rows-[70%_30%]">
                {/* Video Info */}
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
                      <span className="bg-blue-600 px-2 py-1 rounded text-xs">{t('video.series', 'Series')}</span>
                    )}
                    <span className="bg-red-600 px-2 py-1 rounded text-xs">{t('video.external', 'External')}</span>
                    {currentVideo.currentEpisode?.duration && (
                      <span className="text-gray-300">{formatDuration(currentVideo.currentEpisode.duration)}</span>
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
                    {user && <button
                      onClick={handleToggleLike}
                      disabled={isLikeLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isLiked
                          ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        } disabled:opacity-50`}
                    >
                      <FiThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="hidden md:block text-sm font-medium">
                        {`${isLiked ? t('video.liked', 'Liked') : t('video.like', 'Like')}`}
                      </span>
                    </button>}

                    {/* Comments Button */}
                    <button
                      onClick={() => setShowComments(!showComments)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${showComments
                          ? 'bg-[#fbb033]/20 text-[#fbb033] hover:bg-[#fbb033]/30'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }
                        ${commentCount === 0 && !user ? 'hidden' : ''}
                        `}
                    >
                      <FiMessageCircle className="w-5 h-5" />
                      <span className="hidden md:block text-sm font-medium">
                        {t('comments.title', 'Comments')} {commentCount > 0 && `(${commentCount})`}
                      </span>
                    </button>

                    {/* Favorite Button */}
                    {user && <button
                      onClick={handleToggleFavorite}
                      disabled={isFavoriteLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isFavorited
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        } disabled:opacity-50`}
                    >
                      <FiHeart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                      <span className="hidden md:block text-sm font-medium">
                        {isFavorited ? t('video.favorited', 'Favorited') : t('video.favorite', 'Favorite')}
                      </span>
                    </button>}

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

                {/* External Source Info */}
                <div className="mt-4 mx-auto w-full">
                  <h3 className="text-lg font-semibold mb-2">{t('video.externalSource', 'External Source')}</h3>
                  <div className="bg-gray-800 p-3 rounded">
                    <p className="text-sm text-gray-400 mb-2">
                      {t('video.externalSourceInfo', 'This video is hosted externally')}
                    </p>
                    <div className="text-xs text-gray-500">
                      {t('video.externalSourceDomain', 'Source')}: {externalUrl ? new URL(externalUrl).hostname : 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Additional Video Information */}
        {currentVideo && (
          <div className="w-full lg:w-[60vw] mx-auto space-y-3">
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
                  {currentVideo.currentEpisode?.duration && (
                    <div>
                      <span className="text-gray-400">{t('video.duration')}: </span>
                      <span className="text-white">{formatDuration(currentVideo.currentEpisode.duration)}</span>
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

            {/* Episodes List for Series - horizontal grid */}
            {currentVideo.isSeries && currentVideo.episodes && currentVideo.episodes.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-3">
                  {`${currentVideo.episodes.length > 1 ? `${currentVideo.episodes.length} ` : ''}${t('video.episodes')}`}
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {currentVideo.episodes.map((episode) => (
                    <button
                      key={episode.id || episode.uploadId}
                      onClick={() => {
                        if (episode.playUrl) {
                          const encryptedUrl = encryptUrl(episode.playUrl);
                          router.push(`/videoplayerExternal?url=${encodeURIComponent(encryptedUrl)}`);
                        } else if (episode.m3u8Url) {
                          router.push(`/videoplayer?m3u8=${encodeURIComponent(episode.m3u8Url)}&mediaid=${encodeURIComponent(episode.id || '')}`);
                        } else if (episode.uploadId) {
                          router.push(`/videoplayer?id=${encodeURIComponent(episode.uploadId || episode.id || '')}`);
                        }
                      }}
                      className={`min-w-[56px] h-14 flex items-center justify-center rounded-lg font-bold text-lg transition-colors cursor-pointer
                        ${currentVideo.currentEpisode?.id === episode.id || currentVideo.currentEpisode?.playUrl === episode.playUrl
                          ? 'text-[#fbb033] border border-[#fbb033]'
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
              mediaType={currentVideo.isSeries ? 'episode' : 'video'}
              className="bg-gray-900/50 rounded-lg p-6"
              onCommentCountChange={setCommentCount}
            />
          </div>
        )}

        {/* Recommended Videos Section */}
        {currentVideo?.id && (
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
        )}
      </div>
    </div>
  );
};

export default VideoPlayerClient;
