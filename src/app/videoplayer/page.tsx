import React from 'react';
import VideoPlayerClient from './VideoPlayerClient';

// Force static generation to avoid searchParams dynamic rendering
export const dynamic = 'force-static';

// Keep this component synchronous so it can be statically exported.
// Accept SearchParams or Promise<SearchParams> because Next.js PageProps may provide a Promise.
export default function VideoPlayerPage() {
  // For static export, we can't access searchParams at build time.
  // The VideoPlayerClient will read the URL parameters client-side.
  return <VideoPlayerClient />;
}
