import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VideoDetails, Episode,QualityPermission } from '@/types/Dashboard';

interface VideoMetadata {
  id: string | number;
  title: string;
  description?: string;
  releaseDate?: string;
  rating?: number;
  backdropImage?: string;
  portraitImage?: string;
  actors?: string[];
  director?: string;
  region?: string;
  language?: string;
  tags?: string[];
  isSeries?: boolean;
  seasonNumber?: number;
  totalEpisodes?: number;
  episodes?: Episode[];
  likeCount?: number | null;
  isLiked?: boolean;
  isFavorited?: boolean;
  uploadId?: string;
  fileName?: string;
  fileSize?: number | null;
  // Additional episode-specific data when playing a specific episode
  currentEpisode?: {
    episodeNumber?: number;
    episodeTitle?: string;
    duration?: number;
    uploadId?: string;
    qualityPermissions?: QualityPermission[]; 
  };
}

interface VideoStore {
  currentVideo: VideoMetadata | null;
  setCurrentVideo: (video: VideoMetadata) => void;
  clearCurrentVideo: () => void;
  // Helper to set video from VideoDetails
  setVideoFromDetails: (details: VideoDetails, episodeUploadId?: string) => void;
  setCurrentEpisode: (uploadID: string) => void;
}

export const useVideoStore = create<VideoStore>()(
  persist(
    (set) => ({
      currentVideo: null,
      
      setCurrentVideo: (video) => set({ currentVideo: video }),

      setCurrentEpisode: (uploadID) => {
        set((state) => {
          if (!state.currentVideo) return state;
          const currentVideo = state.currentVideo;
          if (!currentVideo.episodes || currentVideo.episodes.length === 0) return state;
          
          const episode = currentVideo.episodes.find(ep => 
            ep.uploadId === uploadID || ep.id === uploadID
          );
          if (!episode) return state;

          return {
            ...state,
            currentVideo: {
              ...currentVideo,
              currentEpisode: {
                episodeNumber: episode.episodeNumber,
                episodeTitle: episode.title,
                qualityPermissions: episode.qualityPermissions,
                duration: episode.duration,
                uploadId: episode.uploadId || episode.id,
              },
            },
          };
        });
      },
      
      clearCurrentVideo: () => set({ currentVideo: null }),
      
      setVideoFromDetails: (details, episodeUploadId) => {

        const videoMetadata: VideoMetadata = {
          id: details.id,
          title: details.title || '',
          description: details.description || '',
          releaseDate: details.createTime 
            ? new Date(details.createTime).toLocaleDateString() 
            : (details.year ? String(details.year) : ''),
          rating: details.rating || 0,
          backdropImage: (details.imageQuality && (details.imageQuality.url || details.imageQuality.p360)) || '',
          portraitImage: details.imageQuality?.p360 || '',
          actors: details.actors || [],
          director: details.director || undefined,
          region: details.region || undefined,
          language: details.language || undefined,
          tags: (() => {
            const t = details.tags;
            if (!t) return [];
            if (Array.isArray(t)) return t;
            if (typeof t === 'string') return t.split(',').map(s => s.trim()).filter(Boolean);
            if (typeof t === 'object') return Object.values(t).map(s => String(s).trim()).filter(Boolean);
            return [];
          })(),
          isSeries: details.isSeries,
          seasonNumber: details.seasonNumber || undefined,
          totalEpisodes: details.totalEpisodes || undefined,
          likeCount: details.likeCount || 0,
          isLiked: details.isLiked || false,
          isFavorited: details.isFavorited || false,
          episodes: details.episodes,
          uploadId: details.uploadId || undefined,
          fileName: details.fileName,
          fileSize: details.fileSize,
        };

        // If episodeUploadId is provided, find and set current episode info
        if (episodeUploadId && details.episodes) {
          const episode = details.episodes.find(ep => 
            ep.uploadId === episodeUploadId || ep.id === episodeUploadId
          );
          if (episode) {
            videoMetadata.currentEpisode = {
              episodeNumber: episode.episodeNumber,
              qualityPermissions: episode.qualityPermissions,
              episodeTitle: episode.title,
              duration: episode.duration,
              uploadId: episode.uploadId || episode.id,
            };
          }
        }

        set({ currentVideo: videoMetadata });
      },
    }),
    {
      name: 'video-store',
      // Only persist the current video data
      partialize: (state) => ({ currentVideo: state.currentVideo }),
    }
  )
);
