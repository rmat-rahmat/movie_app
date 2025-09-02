import type { DashboardItem } from '@/types/Dashboard';
import React from "react";
import Image from "next/image";

interface MovieModalProps {
  video: DashboardItem;
  onClose: () => void;
  showPlayback?: boolean;
}

const MovieModal: React.FC<MovieModalProps> = ({ video, onClose, showPlayback }) => {
  if (!video) return null;

  // Use DashboardItem properties directly
  const title = video.title || "";
  const releaseDate = video.createTime 
    ? new Date(video.createTime).toLocaleDateString() 
    : (video.year ? String(video.year) : "");
  const description = video.description || "";
  const backdropImage = video.imageQuality?.p720 || "";
  const portraitImage = video.imageQuality?.p360 || "";
  const rating = video.rating || 0;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="fixed inset-0 shadow-lg shadow-[#fbb033] bg-black/70 rounded-lg my-auto md:h-[62%] md:mx-auto md:w-[80%] lg:w-[70%] xl:w-[60%] 2xl:w-[50%] overflow-y-auto z-61 flex flex-col items-center justify-center p-4 overflow-y-hidden">
        <div className="flex flex-col md:flex-row items-center mt-4">
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

          <div className="ml-4">
            {showPlayback && (
              <div className="flex items-center mt-2 mb-2">
                <iframe
                  className="z-0 rounded-t-lg"
                  width="100%"
                  height="200"
                  src={`https://www.youtube.com/embed/${video.id}?controls=0&autoplay=1`}
                  title={title}
                  allowFullScreen
                ></iframe>
              </div>
            )}

            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-sm text-gray-400">{releaseDate}</p>
            {video.isSeries && (
              <div className="flex gap-2 mt-1">
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Series</span>
                {video.seasonNumber && (
                  <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs">
                    Season {video.seasonNumber}
                  </span>
                )}
                {video.totalEpisodes && (
                  <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs">
                    {video.totalEpisodes} Episodes
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
            {video.actors && Array.isArray(video.actors) && video.actors.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-white mb-2">Cast</h3>
                <div className="flex flex-wrap gap-2">
                  {video.actors.slice(0, 5).map((actor, index) => (
                    <span key={index} className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm">
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {video.director && (
              <div className="mt-2">
                <span className="text-gray-400">Director: </span>
                <span className="text-white">{video.director}</span>
              </div>
            )}
            {video.region && (
              <div className="mt-1">
                <span className="text-gray-400">Region: </span>
                <span className="text-white">{video.region}</span>
              </div>
            )}
            {video.language && (
              <div className="mt-1">
                <span className="text-gray-400">Language: </span>
                <span className="text-white">{video.language}</span>
              </div>
            )}
            {video.tags && Array.isArray(video.tags) && video.tags.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-semibold text-gray-400 mb-1">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {video.tags.map((tag, index) => (
                    <span key={index} className="bg-[#fbb033] text-black px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
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

export default MovieModal;