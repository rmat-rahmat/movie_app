// Server component: render client `SearchVideos` inside Suspense so
// client hooks like useSearchParams() run on the client only.
import React, { Suspense } from 'react';
import SearchVideos from '@/components/search/SearchVideos';
import LoadingPage from '@/components/ui/LoadingPage';

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Suspense fallback={<LoadingPage />}>
        <SearchVideos />
      </Suspense>
    </div>
  );
}