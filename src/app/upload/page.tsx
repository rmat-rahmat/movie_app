"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiVideo, FiTv } from 'react-icons/fi';
import MovieUpload from './MovieUpload';
import SeriesUpload from './SeriesUpload';
import Link from 'next/link';
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#fbb033] to-yellow-500 bg-clip-text text-transparent">
              {t('upload.title', 'Upload Content')}
            </h1>
            <p className="text-gray-400 text-lg">
              {t('upload.description', 'Upload your movies or TV series to share with the world')}
            </p>
          </div>

          {/* Compact toggle navigation to dedicated pages */}
          <div className="flex justify-center mb-8">
            <div className="rounded-lg p-1 flex gap-6">
              
               <Link href="/upload/movie"
                  className="relative group rounded-lg overflow-hidden flex flex-col items-start justify-end p-8 bg-gradient-to-br from-gray-800 to-black hover:scale-105 transform transition duration-300"
                >
                  <div className="absolute inset-0 opacity-10 bg-[url('/images/hero-movie.jpg')] bg-cover bg-center"></div>
                  <div className="z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <FiVideo className="text-[#fbb033] text-3xl" />
                      <h2 className="text-2xl font-bold">{t('upload.movie', 'Movie')}</h2>
                    </div>
                    <p className="text-gray-300 max-w-md">{t('upload.movieBrief')}</p>
                  </div>
                </Link>

                <Link href="/upload/series"
                  className="relative group rounded-lg overflow-hidden flex flex-col items-start justify-end p-8 bg-gradient-to-br from-gray-800 to-black hover:scale-105 transform transition duration-300"
                >
                  <div className="absolute inset-0 opacity-10 bg-[url('/images/hero-series.jpg')] bg-cover bg-center"></div>
                  <div className="z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <FiTv className="text-[#fbb033] text-3xl" />
                      <h2 className="text-2xl font-bold">{t('upload.series', 'TV Series')}</h2>
                    </div>
                    <p className="text-gray-300 max-w-md">{t('upload.seriesBrief')}</p>
                  </div>
                </Link>
            </div>
          </div>
          <div className="text-center text-gray-400 mb-6">{t('upload.selectTypeHelp', 'Choose a type to upload. You will be taken to a dedicated page to complete the upload.')}</div>
        </div>
      </div>
    </div>
  );
}
