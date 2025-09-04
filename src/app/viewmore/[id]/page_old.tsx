'use client';

import React, { useEffect, useState } from 'react';
import { getGridVideos, getDashboard } from '@/lib/movieApi';
import type { ContentSection } from '@/types/Dashboard';
import GridVideos from '@/components/movie/GridVideos';
import { useParams } from 'next/navigation';
import LoadingPage from '@/components/ui/LoadingPage';

export default function ViewMorePage() {
  const params = useParams();
  const id = String(params?.id || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sectionName = id?.replaceAll('_', ' ');

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
        const initialData = await getGridVideos(`/api-movie/v1/home/sections/${id}/contents`, 1, 1);

        if (!initialData || !initialData.success) {
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
      id={id} 
      title={sectionName}
      src={`/api-movie/v1/home/sections/${id}/contents`}
    />
  );
}
