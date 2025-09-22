"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiVideo, FiTv } from 'react-icons/fi';
import MovieUpload from './MovieUpload';
import SeriesUpload from './SeriesUpload';
import { fetchTags } from '@/lib/tagAPI';

export default function UploadPage() {
  const { t } = useTranslation('common');
  const [uploadType, setUploadType] = useState<'movie' | 'series'>('movie');

  // Preload tags when the page is visited
  useEffect(() => {
    const preloadTags = async () => {
      try {
        await fetchTags({ page: 1, size: 100 }); // Load first 100 tags
      } catch (error) {
        console.error('Failed to preload tags:', error);
      }
    };

    preloadTags();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#fbb033] to-yellow-500 bg-clip-text text-transparent">
              {t('upload.title', 'Upload Content')}
            </h1>
            <p className="text-gray-400 text-lg">
              {t('upload.description', 'Upload your movies or TV series to share with the world')}
            </p>
          </div>

          {/* Upload Type Selector */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-800 rounded-lg p-1 flex">
              <button
                type="button"
                onClick={() => setUploadType('movie')}
                className={`flex items-center px-6 py-3 rounded-md transition-all ${
                  uploadType === 'movie' ? 'bg-[#fbb033] text-black font-semibold' : 'text-gray-400 hover:text-white'
                }`}
              >
                <FiVideo className="mr-2" />
                {t('upload.movie', 'Movie')}
              </button>
              <button
                type="button"
                onClick={() => setUploadType('series')}
                className={`flex items-center px-6 py-3 rounded-md transition-all ${
                  uploadType === 'series' ? 'bg-[#fbb033] text-black font-semibold' : 'text-gray-400 hover:text-white'
                }`}
              >
                <FiTv className="mr-2" />
                {t('upload.series', 'TV Series')}
              </button>
            </div>
          </div>

          {/* Render specific upload component */}
          {uploadType === 'movie' ? <MovieUpload /> : <SeriesUpload />}
        </div>
      </div>
    </div>
  );
}
