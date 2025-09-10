import React from 'react';
import VideoPlayerClient from './VideoPlayerClient';

interface SearchParams {
  id?: string;
}

// Keep this component synchronous so it can be statically exported.
export default function VideoPlayerPage({ searchParams }: { searchParams?: SearchParams }) {
  const id = (searchParams && searchParams.id) || '';

  if (!id) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-2xl font-bold mb-4">Video Player</h1>
        <p className="text-sm text-gray-400">No video selected. Click a Watch button to open the player.</p>
      </div>
    );
  }

  return <VideoPlayerClient id={id} />;
}
