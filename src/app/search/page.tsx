'use client';

import React, { Suspense } from 'react';
import SearchVideos from '@/components/search/SearchVideos';
import LoadingPage from '@/components/ui/LoadingPage';

// Force static generation to avoid searchParams dynamic rendering
export const dynamic = 'force-static';

export default function SearchPage() {
  return <SearchVideos />;
}
