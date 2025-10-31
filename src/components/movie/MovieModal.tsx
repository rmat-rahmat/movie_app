"use client";
import type { DashboardItem, VideoDetails, Episode } from '@/types/Dashboard';
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { getContentDetail } from '@/lib/movieApi';
import { useRouter } from 'next/navigation';
import { useVideoStore } from '@/store/videoStore';
import { formatDuration } from '@/utils/durationUtils';
import { useTranslation } from 'react-i18next';
import { encryptUrl } from '@/utils/urlEncryption';
import { RenderTags, RenderRegion, RenderLanguage, RenderCast, RenderDirector } from '@/components/ui/RenderBadges';

interface MovieModalProps {
  video: DashboardItem;
  onClose: () => void;
  showPlayback?: boolean;
}

const MovieModal: React.FC<MovieModalProps> = ({ video, onClose, showPlayback }) => {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<VideoDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  useEffect(() => {
    let mounted = true;

    // create an initial VideoDetails object from the lighter DashboardItem prop
    console.log(video.imageQuality)
    const videoToDetailsInit = (v: DashboardItem): VideoDetails => ({
      ...v,
      // ensure imageQuality exists with safe string fields
      imageQuality: v.imageQuality ?? { customCoverUrl: '', p144: '', p360: '', p720: '' },
      // episodes may not exist on the lighter item; provide empty array for series
      episodes: v.isSeries ? ((v as VideoDetails).episodes ?? []) : undefined,
      // ensure uploadId/fileName/fileSize exist
      uploadId: (v as VideoDetails).uploadId ?? undefined,
      fileName: v.fileName ?? undefined,
      fileSize: v.fileSize ?? null,
    });

    // Prefill detail with props-derived data so the modal has complete shape immediately
    if (video && !detail) {
      try {
        setDetail(videoToDetailsInit(video));
      } catch (_e) {
        // ignore
      }
    }

    const fetchDetail = async () => {
      console.log(video)
      if (!video?.id) return;
      setLoading(true);
      setError(null);
      try {
        console.log('Fetched content id', video.id);
        const data = await getContentDetail(String(video.id));
        console.log('Fetched content detail', data);  
        if (!mounted) return;
        if (data) {
          // merge fetched data into existing detail to fill missing keys
          setDetail((prev) => ({ ...(prev as VideoDetails || {}), ...data } as VideoDetails));
        } else {
          setError(t('modal.noContentData'));
        }
      } catch (err: unknown) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message || t('modal.fetchError'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDetail();
    return () => { mounted = false; };
  }, [video?.id]);

  if (!video) return null;

  // prefer API-fetched detail when available
  const source = detail || video;
  // runtime type guard to detect richer VideoDetails
  const isVideoDetails = (s: typeof source): s is VideoDetails => {
    return !!s && (Array.isArray((s as VideoDetails).episodes) || typeof (s as VideoDetails).uploadId !== 'undefined' || typeof (s as VideoDetails).totalEpisodes !== 'undefined');
  };
  const title = source.title || "";
  const releaseDate = source.createTime ? new Date(source.createTime).toLocaleDateString() : (source.year ? String(source.year) : "");
  const description = source.description || "";
  const backdropImage = (source.imageQuality && (source.imageQuality.url || source.imageQuality.p360)) || "";
  const portraitImage = source.imageQuality?.url || "";
  const rating = source.rating || 0;

  const navigateToPlayer = (id: string) => {
    if (!detail) return;
    const source = detail;
    const { setVideoFromDetails } = useVideoStore.getState();

    if (useVideoStore.getState().currentVideo?.id !== source.id) {
      setVideoFromDetails(source, String(id));
    }
    
    // push to query-param based player route so static export works
    router.push(`/videoplayer?id=${encodeURIComponent(String(id))}`);
  };

  const navigateToExternalPlayer = (playUrl: string) => {
    if (!playUrl) return;
    
    // Encrypt the external URL for security
    const encryptedUrl = encryptUrl(playUrl);
    
    // Navigate to external player with encrypted URL
    router.push(`/videoplayerExternal?url=${encodeURIComponent(encryptedUrl)}`);
  };

  const navigateToM3u8Player = (m3u8Url: string, episodeData?: Episode) => {
    if (!m3u8Url) return;
    
    if (detail && episodeData) {
      const { setVideoFromDetails } = useVideoStore.getState();
      if (useVideoStore.getState().currentVideo?.id !== detail.id) {
        setVideoFromDetails(detail, episodeData.uploadId || episodeData.id || '');
      }
    }
    
    // Navigate to m3u8 player with the URL
    router.push(`/videoplayer?m3u8=${encodeURIComponent(m3u8Url)}&mediaid=${encodeURIComponent(episodeData?.id || '')}`);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="fixed inset-0 shadow-lg shadow-[#fbb033] bg-black/70 rounded-lg my-auto md:h-[62%] md:mx-auto md:w-[80%] lg:w-[70%] xl:w-[60%] 2xl:w-[50%] overflow-y-auto z-61 flex flex-col items-center justify-center p-4 overflow-y-hidden">
        <div className="flex flex-col md:flex-row w-full items-center mt-4 h-full">
          <div
            className="absolute top-4 right-4 cursor-pointer text-white rounded-full bg-black/40 w-10 h-10 flex items-center justify-center"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          {!showPlayback && (
            <>
              <div className="w-full rounded-lg md:hidden relative aspect-video">
                <Image
                  src={backdropImage || ""}
                  alt={title}
                  fill
                  className="rounded-lg object-cover"
                  sizes="100vw"
                  priority
                />
              </div>
              <div className="w-1/3 rounded-lg hidden md:block relative aspect-[2/3]">
                <Image
                  src={portraitImage || ""}
                  alt={title}
                  fill
                  className="rounded-lg object-cover"
                  sizes="33vw"
                  priority
                />
              </div>
            </>
          )}

          <div className="ml-4 w-full text-white max-h-[90%] overflow-y-auto">
            {showPlayback && (
              <div className="flex items-center mt-2 mb-2">
                <iframe
                  className="z-0 rounded-t-lg"
                  width="100%"
                  height="200"
                  src={`https://www.youtube.com/embed/${source.id}?controls=0&autoplay=1`}
                  title={title}
                  allowFullScreen
                ></iframe>
              </div>
            )}

            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-sm text-gray-400">{releaseDate}</p>
            {loading && <p className="text-sm text-gray-400">{t('modal.loadingDetails')}</p>}
            {error && <p className="text-sm text-red-400">{error}</p>}
            {source.isSeries && (
              <div className="flex gap-2 mt-1">
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">{t('modal.series')}</span>
                {source.seasonNumber && (
                  <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs">
                    {t('modal.season')} {source.seasonNumber}
                  </span>
                )}
                {source.totalEpisodes && (
                  <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs">
                    {source.totalEpisodes} {t('modal.episodes')}
                  </span>
                )}
              </div>
            )}
            <br />
            <p className="text-sm text-white">
              {(description || "").split(" ").slice(0, 100).join(" ") +
                ((description || "").split(" ").length > 100 ? "..." : "")}
            </p>
            {rating > 0 && (
              <div className="flex items-center mt-2">
                {[...Array(5)].map((_, index) => (
                  <svg
                    key={index}
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 ${index < Math.ceil(rating / 2) ? 'text-[#fbb033]' : 'text-gray-300'}`}
                    fill={index < Math.ceil(rating / 2) ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={index < Math.ceil(rating / 2) ? 0 : 1}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
            )}
            {source.actors && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-white mb-2">{t('modal.cast')}</h3>
                <div className="flex flex-wrap gap-2">
                  <RenderCast actors={source.actors} />
                </div>
              </div>
            )}
            {source.director && (
              <div className="mt-2">
                <span className="text-gray-400">{t('modal.director')}: </span>
                <RenderDirector director={source.director} />
              </div>
            )}
            {source.region && (
              <div className="mt-1">
                <span className="text-gray-400">{t('modal.region')}: </span>
                <span className="text-white"><RenderRegion region={source.region} /></span>
              </div>
            )}
            {source.language && (
              <div className="mt-1">
                <span className="text-gray-400">{t('modal.language')}: </span>
                <span className="text-white"><RenderLanguage language={source.language} /></span>
              </div>
            )}
            {source.tags && Array.isArray(source.tags) && source.tags.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-semibold text-gray-400 mb-1">{t('modal.tags')}</h4>
                <div className="flex flex-wrap gap-1">
                  <RenderTags tags={source.tags} />
                </div>
              </div>
            )}
            {/* Episodes / uploadId display */}
            {isVideoDetails(source) && source.isSeries ? (
              <div className="mt-4 w-full">
                <h3 className="text-lg font-semibold text-white mb-2">{t('modal.episodes')}</h3>
                {Array.isArray(source.episodes) && source.episodes.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {source.episodes.map((ep: Episode) => (
                      <div key={ep.id || ep.uploadId} className="flex items-center justify-between bg-gray-900 p-2 rounded">
                        <div>
                          <div className="text-sm text-white">{ep.title || `${t('modal.episode')} ${ep.episodeNumber || ''}`}</div>
                          <div className="text-xs text-gray-400">
                            {t('modal.duration')}: {formatDuration(ep.duration)}
                          </div>
                        </div>
                        {ep.uploadId ? (
                          <button
                            type="button"
                            onClick={() => navigateToPlayer(ep.uploadId || ep.id || '')}
                            className="flex items-center gap-2 border border-gray-700 text-gray-400 hover:text-white px-3 py-1 rounded-lg cursor-pointer hover:border-[#fbb033] transition-colors"
                            title="Watch episode"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#fbb033]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path d="M6 4l10 6-10 6V4z" />
                            </svg>
                            <span>{t('modal.watch')}</span>
                          </button>
                        ) : ep.m3u8Url ? (
                          <button
                            type="button"
                            onClick={() => navigateToM3u8Player(ep.m3u8Url || '', ep)}
                            className="flex items-center gap-2 border border-gray-700 text-gray-400 hover:text-white px-3 py-1 rounded-lg cursor-pointer hover:border-[#fbb033] transition-colors"
                            title="Watch episode (HLS)"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#fbb033]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path d="M6 4l10 6-10 6V4z" />
                            </svg>
                            <span>{t('modal.watch')}</span>
                          </button>
                        ) : ep.playUrl ? (
                          <button
                            type="button"
                            onClick={() => navigateToExternalPlayer(ep.playUrl || '')}
                            className="flex items-center gap-2 border border-gray-700 text-gray-400 hover:text-white px-3 py-1 rounded-lg cursor-pointer hover:border-[#fbb033] transition-colors"
                            title="Watch external episode"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#fbb033]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path d="M6 4l10 6-10 6V4z" />
                            </svg>
                            <span>{t('modal.watch')} (Ext)</span>
                          </button>
                        ) : null}
                        {/* <div className="text-xs text-gray-300">UploadId: <span className="text-[#fbb033]">{ep.uploadId || ep.id}</span></div> */}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">{t('modal.noEpisodesAvailable')}</p>
                )}
              </div>
            ) : (
              <div className="mt-4 w-full">
               {isVideoDetails(source) && source.episodes && source.episodes[0] && source.episodes[0].uploadId ?
                <button type="button" onClick={() => navigateToPlayer((isVideoDetails(source) && source.episodes && source.episodes[0] && source.episodes[0].uploadId) || (isVideoDetails(source) && source.uploadId) || '')} className="bg-[#fbb033] text-white font-bold hover:bg-red-500 px-3 py-3 rounded w-full cursor-pointer">
                  {t('modal.watchNow')}
                </button> : isVideoDetails(source) && source.episodes && source.episodes[0] && source.episodes[0].m3u8Url ? (
                <button type="button" onClick={() => navigateToM3u8Player((source.episodes?.[0]?.m3u8Url) || '', source.episodes?.[0])} className="bg-[#fbb033] text-white font-bold hover:bg-red-500 px-3 py-3 rounded w-full cursor-pointer">
                  {t('modal.watchNow')}
                </button>
                ) : isVideoDetails(source) && source.episodes && source.episodes[0] && source.episodes[0].playUrl ? (
                <button type="button" onClick={() => navigateToExternalPlayer((isVideoDetails(source) && source.episodes && source.episodes[0] && source.episodes[0].playUrl) || '')} className="bg-[#fbb033] text-white font-bold hover:bg-red-500 px-3 py-3 rounded w-full cursor-pointer">
                  {t('modal.watchNow')} (External)
                </button>
                ) : 
                <div className="text-sm text-gray-400">
                  {t('modal.noPlayableContent')}
                </div>
              }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieModal;