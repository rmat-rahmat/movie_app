"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import StarRating from '@/components/ui/StarRating';
import type { DashboardItem as DashboardItemType } from '@/types/Dashboard';
import { FiPlay, FiInfo, FiMoreVertical } from 'react-icons/fi';
import { RenderTags, RenderRegion, RenderLanguage } from '@/components/ui/RenderBadges';

interface DashboardItemProps {
  video: DashboardItemType;
  index: number;
  onClick?: () => void;
  showRating?: boolean;
  showViewer?: boolean;
  onOptionsClick?: (videoId: string) => void;
}

const DashboardItem: React.FC<DashboardItemProps> = ({ video, index, onClick, showRating, showViewer,onOptionsClick }) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  const potrait = video.imageQuality?.url || '';
  // console.log("Image URLs:", { p144, p360, p720 });
  const release_date = video.createTime ? String(video.createTime).split('T')[0] : (video.year ? String(video.year) : '');
  const vote_average = (video.rating ?? 0) as number;
  const rawPopularity = video.popularity ?? video.views ?? 0;
  const popularity = Number(typeof rawPopularity === 'number' ? rawPopularity : (typeof rawPopularity === 'string' ? Number(rawPopularity) : 0));

  const fallbackSrc2 = '/fallback_poster/sample_poster.png';
  const fallbackSrc1 = '/fallback_poster/sample_poster1.png';
  const computedSrc = (!potrait) ? potrait : (imageError ? (index % 2 === 0 ? fallbackSrc1 : fallbackSrc2) : potrait);

  // Truncate description if too long
  const truncatedDescription = video.description && video.description.length > 100
    ? `${video.description.slice(0, 50)}...`
    : video.description;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setIsLandscape(img.naturalWidth > img.naturalHeight);
    if(img.naturalWidth > img.naturalHeight){
      console.log("Landscape image detected:", video.title);
    }
  };

  return (
    <div
      key={video.id}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex flex-col bg-black/80 backdrop-blur-sm rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ease-out hover:scale-105 hover:z-20 hover:shadow-2xl hover:shadow-[#fbb033]/30 ${
        isHovered ? 'transform-gpu' : ''
      }`}
    >
      {/* Main Image Container */}
      <div className="relative w-full aspect-[3/4]  bg-gray-900 overflow-hidden rounded-t-lg">
        <Image
          src={computedSrc}
          alt={video.title || ''}
          fill
          className={`object-cover transition-all duration-500 ${
            isHovered ? 'scale-110 brightness-75' : 'scale-100 brightness-100'
          }`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={index === 0}
          onError={() => setImageError(true)}
          onLoad={(e) => {
            setImageError(false);
            handleImageLoad(e);
          }}
        />
        {onOptionsClick && <button onClick={(e)=>{ e.stopPropagation(); onOptionsClick && onOptionsClick(video.id); }} className="absolute top-2 right-2 z-100 flex items-center justify-center w-8 h-8 bg-black/70 hover:bg-[#fbb033] text-white hover:text-black rounded-full transition-all duration-200 cursor-pointer">
            <FiMoreVertical className="w-4 h-4" />
          </button>}
        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-70'
        }`} />
        
        {/* Play Button Overlay - appears on hover */}
        {/* <div className={`absolute flex items-center w-full h-[40%] justify-center transition-all duration-300 ${
          isHovered ? 'opacity-100 backdrop-blur-sm' : 'opacity-0'
        }`}>
          <button className="flex items-center justify-center w-16 h-16 bg-white/90 hover:bg-white text-black rounded-full shadow-xl transform transition-transform duration-200 hover:scale-110 cursor-pointer">
            <FiPlay className="w-6 h-6 ml-1" />
          </button>
        </div> */}

        {/* Quick Action Buttons - Top Right */}
        {/* <div className={`absolute top-3 right-3 flex gap-2 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}>
          <button className="flex items-center justify-center w-8 h-8 bg-black/70 hover:bg-[#fbb033] text-white hover:text-black rounded-full transition-all duration-200">
            <FiInfo className="w-4 h-4" />
          </button>
        </div> */}
      </div>

      {/* Content Section */}
      <div className={`absolute bottom-0 w-full p-4 flex-1 transition-all duration-300 ${
        isHovered ? 'bg-gradient-to-t from-black via-black/90 to-transparent' : 'bg-gradient-to-t from-black/80 via-black/60 to-transparent'
      }`}>
        {/* Title */}
        <h3 className="text-white font-semibold text-sm md:text-base lg:text-lg mb-2 line-clamp-2 group-hover:text-[#fbb033] transition-colors duration-200">
          {video.title}
        </h3>

        {/* Release Date */}
        <div className="flex items-center gap-3 mb-3 text-xs md:text-sm text-gray-400">
          {release_date && <span>{release_date}</span>}
        </div>

        {/* Rating */}
        {showRating && vote_average > 0 && (
          <div className="mb-3">
            <StarRating rating={vote_average} size="sm" />
          </div>
        )}

        {/* Description - Only show on larger screens and when hovered */}
        {truncatedDescription && (
          <p className={`text-gray-300 text-xs md:text-sm mb-3 transition-all duration-300 ${
            isHovered ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'
          } hidden md:block`}>
            {truncatedDescription}
          </p>
        )}

        {/* Tags */}
        <div className={`flex flex-wrap gap-1 mb-3 transition-all duration-300 ${
            isHovered ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'
          } hidden md:flex`}>
          <RenderTags tags={video.tags} />
          <RenderRegion region={video.region} />
          <RenderLanguage language={video.language} />
        </div>

        {/* Views Counter */}
        {showViewer && popularity > 0 && (
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-800">
            <span className="text-[10px] md:text-xs text-gray-400">
              {popularity.toLocaleString('en-US', { notation: 'compact' })} views
            </span>
          </div>
        )}
      </div>

      {/* Bottom Gradient Border on Hover */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#fbb033] to-yellow-500 transition-all duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} />
    </div>
  );
};

export default DashboardItem;
