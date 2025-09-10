"use client";
import React, { useState } from 'react';
import Image from 'next/image';
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

  const potrait = video.imageQuality?.p360 || '';
  const release_date = video.createTime ? String(video.createTime).split('T')[0] : (video.year ? String(video.year) : '');
  const vote_average = (video.rating ?? 0) as number;
  const rawPopularity = video.popularity ?? video.views ?? 0;
  const popularity = Number(typeof rawPopularity === 'number' ? rawPopularity : (typeof rawPopularity === 'string' ? Number(rawPopularity) : 0));

  const fallbackSrc2 = '/fallback_poster/sample_poster.png';
  const fallbackSrc1 = '/fallback_poster/sample_poster1.png';
  const computedSrc = (!potrait) ? fallbackSrc2 : (imageError ? (index % 2 === 0 ? fallbackSrc1 : fallbackSrc2) : potrait);

  return (
    <div
      key={video.id}
      onClick={onClick}
      className={`flex flex-1 flex-col bg-black shadow-[0px_0px_2px_1px] pb-2 shadow-[#fbb033] rounded-lg touchable hover:scale-105 transition-transform duration-300 cursor-pointer`}
    >
      <div className="relative w-full h-auto rounded-lg mb-2" >
        <div className="absolute w-full h-full bg-gradient-to-t from-black via-black/30 to-transparent z-1" />
        <div className="relative w-full h-[300px]">
          <Image
            src={computedSrc}
            alt={video.title || ''}
            fill
            className="z-0 rounded-t-lg object-cover"
            sizes="100vw"
            priority={index === 0}
            onError={() => setImageError(true)}
            onLoadingComplete={() => setImageError(false)}
          />
        </div>
      </div>
      <div className='relative px-4 mt-[-70px] lg::mt-[-40px]  overflow-y-visible z-1'>
        {video.title && video.title.length > 30 ? (
          <h3 className="text-xs lg::text-lg: font-semibold">{video.title}</h3>
        ) : (
          <h3 className="text-lg: lg::text-lg font-semibold">{video.title}</h3>
        )}
        <p className="text-xs lg::text-sm text-gray-400">{release_date}</p>
      </div>

      {showRating && vote_average !== undefined && vote_average > 0 && (
        <div className="flex items-center mt-auto mb-2 align-center px-4 py-1">
          {[...Array(5)].map((_, idx: number) => (
            <svg
              key={idx}
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 ${idx < Math.ceil((vote_average || 0) / 2) ? 'text-[#fbb033]' : 'text-gray-400'}`}
              fill={idx < Math.ceil((vote_average || 0) / 2) ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={idx < Math.ceil((vote_average || 0) / 2) ? 0 : 1}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          ))}
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
