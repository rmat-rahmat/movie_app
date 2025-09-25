"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import StarRating from '@/components/ui/StarRating';
import type { DashboardItem as DashboardItemType } from '@/types/Dashboard';

interface DashboardItemProps {
  video: DashboardItemType;
  index: number;
  onClick?: () => void;
  showRating?: boolean;
  showViewer?: boolean;
}

const DashboardItem: React.FC<DashboardItemProps> = ({ video, index, onClick, showRating, showViewer }) => {
  const [imageError, setImageError] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  const potrait = video.imageQuality?.p360 || '';
  const p144 = video.imageQuality?.p144 || '';
  const p360 = video.imageQuality?.p360 || '';
  const p720 = video.imageQuality?.p720 || '';
  // console.log("Image URLs:", { p144, p360, p720 });
  const release_date = video.createTime ? String(video.createTime).split('T')[0] : (video.year ? String(video.year) : '');
  const vote_average = (video.rating ?? 0) as number;
  const rawPopularity = video.popularity ?? video.views ?? 0;
  const popularity = Number(typeof rawPopularity === 'number' ? rawPopularity : (typeof rawPopularity === 'string' ? Number(rawPopularity) : 0));

  const fallbackSrc2 = '/fallback_poster/sample_poster.png';
  const fallbackSrc1 = '/fallback_poster/sample_poster1.png';
  const computedSrc = (!potrait) ? p720 : (imageError ? (index % 2 === 0 ? p360 : p144) : potrait);

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
      className={`flex flex-1 flex-col bg-black shadow-[0px_0px_2px_1px] pb-1 md:pb-2 shadow-[#fbb033] rounded-lg touchable hover:scale-105 transition-transform duration-300 cursor-pointer`}
    >
      <div className={`relative w-full aspect-[2/3] rounded-lg md:mb-2 bg-gray-800`}>
        <div className="absolute w-full h-full bg-gradient-to-t from-black via-black/30 to-transparent z-1" />
        <Image
          src={computedSrc}
          alt={video.title || ''}
          fill
          className="z-0 rounded-lg object-cover"
          sizes="100vw"
          priority={index === 0}
          onError={() => setImageError(true)}
          onLoad={(e) => {
            setImageError(false);
            handleImageLoad(e);
          }}
        />
      </div>
      <div className='relative px-1 md:px-4 mt-[-70px] lg::mt-[-40px] overflow-y-visible z-1'>
        {video.title && video.title.length > 30 ? (
          <h3 className="text-xs lg::text-lg: font-semibold">{video.title}</h3>
        ) : (
          <h3 className="text-lg: lg::text-lg font-semibold">{video.title}</h3>
        )}
        <p className="text-xs lg::text-sm text-gray-400">{release_date}</p>
        <p className="hidden md:block text-sm text-gray-400 mt-2">{truncatedDescription}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {video.tags && video.tags.length > 0 && (
            <>
              {video.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="bg-[#fbb033] text-black px-1 py-1 md:px-2 rounded text-[8px] md:text-xs">{tag}</span>
              ))}
              {/* {video.tags.length > 3 && (
                <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">...</span>
              )} */}
            </>
          )}
          {video.region && (
            <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded  text-[8px] md:text-xs">{video.region}</span>
          )}
          {video.language && (
            <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-[8px] md:text-xs">{video.language}</span>
          )}
        </div>
      </div>

      {showRating && vote_average !== undefined && vote_average > 0 && (
        <div className="mt-auto md:mb-2 px-1 md:px-4 py-1">
          <StarRating rating={vote_average} size="md" />
        </div>
      )}

      {showViewer && (
        <div className="flex mt-auto justify-center mt-2 mb-2">
          <span className="text-xs lg::text-sm ml-2 text-gray-400">
            {popularity.toLocaleString('en-US', { notation: 'compact' })} views
          </span>
        </div>
      )}
    </div>
  );
};

export default DashboardItem;
