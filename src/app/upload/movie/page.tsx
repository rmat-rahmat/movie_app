"use client";

import Link from 'next/link';
import MovieUpload from '../MovieUpload';
import { FiArrowLeft } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

export default function MovieUploadPage() {
  const { t } = useTranslation('common');
  return (
    <div className="min-h-screen text-white py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link href="/upload" className="inline-flex items-center text-gray-300 hover:text-white">
            <FiArrowLeft className="mr-2" /> {t('common.back', 'Back')}
          </Link>
        </div>
        <MovieUpload />
      </div>
    </div>
  );
}
