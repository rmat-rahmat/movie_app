'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchVideos from '@/components/search/SearchVideos';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [initialQuery, setInitialQuery] = useState('');

  useEffect(() => {
    const query = searchParams?.get('q') || '';
    setInitialQuery(query);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-black text-white">
      <SearchVideos initialQuery={initialQuery} />
    </div>
  );
}