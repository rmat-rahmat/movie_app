// NOTE: This file is a server entry that passes search params to a client component.
// We accept `searchParams` from Next and render the client `SearchVideos` inside a Suspense
// boundary so `useSearchParams()` inside client components doesn't cause a prerender error.
import React, { Suspense } from 'react';
import SearchVideos from '@/components/search/SearchVideos';
import LoadingPage from '@/components/ui/LoadingPage';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page(args: unknown) {
  const sp = (args as { searchParams?: SearchParams | Promise<SearchParams> })?.searchParams;
  const resolved = (await Promise.resolve(sp)) as SearchParams | undefined;
  const qRaw = resolved?.q;
  const initialQuery = Array.isArray(qRaw) ? (qRaw[0] ?? '') : (qRaw ?? '');

  return (
    <div className="min-h-screen bg-black text-white">
      <Suspense fallback={<LoadingPage />}>
        <SearchVideos initialQuery={initialQuery} />
      </Suspense>
    </div>
  );
}