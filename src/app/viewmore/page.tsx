'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadMoreSectionContent } from '@/lib/movieApi';
import GridVideos from '@/components/movie/GridVideos';
import LoadingPage from '@/components/ui/LoadingPage';

export default function ViewMorePage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const ctg = searchParams.get('ctg');
  const title = searchParams.get('title');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Generate section name from ID if title not provided
  const sectionName = title || (id
    ? id
        .replaceAll('_', ' ')
        .split(' ')
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
        .join(' ')
    : 'View More');

  useEffect(() => {
    // Update document title dynamically
    document.title = `${sectionName} | OTalk.TV`;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', `Browse movies and TV shows in ${sectionName}. Discover great content and entertainment.`);
    }

    async function validateSection() {
      try {
        setLoading(true);
        
        if (!id) {
          setError('Section ID not found');
          return;
        }

        // Fetch initial data to check if section exists
         const categoryIdToUse = ctg !== "All" ? ctg :  "movie";

      const initialData = await loadMoreSectionContent(
        id,
        categoryIdToUse || 'movie',
        '720',
        1,
        1
      );
      console.log('Category ID used for validation:', initialData);
        console.log('Initial data for section validation:', initialData);
        if (!initialData) {
          setError('Section not found');
          return;
        }

        setError(null);
      } catch (err) {
        console.error('Error validating section:', err);
        setError('Failed to load section');
      } finally {
        setLoading(false);
      }
    }

    validateSection();
  }, [id, sectionName]);

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <GridVideos 
      id={id || ''}
      title={sectionName}
      ctg={ctg || 'movie'}
    />
  );
}
