import type { VideoSrc } from "@/types/VideoSrc";
import React from "react";
import Image from "next/image";

interface MovieModalProps {
  video: VideoSrc;
  onClose: () => void;
  showPlayback?: boolean;
}

const MovieModal: React.FC<MovieModalProps> = ({ video, onClose, showPlayback }) => {
  if (!video) return null;

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
                  src={video.backdrop_image || ""}
                  alt={video.title}
                  fill
                  className="rounded-lg object-cover"
                  sizes="100vw"
                  priority
                />
              </div>
              <div className="w-1/3 rounded-lg hidden md:block relative aspect-[2/3]">
                <Image
                  src={video.potrait_image || ""}
                  alt={video.title}
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
                  title={video.title}
                  allowFullScreen
                ></iframe>
              </div>
            )}

            <h2 className="text-2xl font-bold text-white">{video.title}</h2>
            <p className="text-sm text-gray-400">{video.release_date}</p>
            <br />
            <p className="text-sm text-white">
              {(video.description || "").split(" ").slice(0, 100).join(" ") +
                ((video.description || "").split(" ").length > 100 ? "..." : "")}
            </p>
            {video.vote_count !== undefined && video.vote_count > 0 && (
              <div className="flex items-center mt-2">
                {[...Array(5)].map((_, index) => (
                  <svg
                    key={index}
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 ${index < Math.ceil((video.vote_average || 0) / 2) ? 'text-[#fbb033]' : 'text-gray-300'}`}
                    fill={index < Math.ceil((video.vote_average || 0) / 2) ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={index < Math.ceil((video.vote_average || 0) / 2) ? 0 : 1}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
            )}
            {video.casts && video.casts.length > 0 && (
              <div className="grid grid-flow-col auto-cols-[15%] md:auto-cols-[17%] gap-4 mt-4">
                {video.casts.slice(0, 5).map(cast => (
                  <div key={cast.id} className="flex flex-1 flex-col items-center">
                    <div className="w-full h-auto rounded-lg relative aspect-square">
                      <Image
                        src={cast.profile_image || ""}
                        alt={cast.name}
                        fill
                        className="rounded-lg object-cover"
                        sizes="100vw"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-center text-sm text-white">{cast.name}</p>
                    <p className="text-center text-sm text-gray-400">{cast.character}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieModal;