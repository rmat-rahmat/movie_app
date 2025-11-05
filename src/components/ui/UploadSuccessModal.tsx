"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { FiCheckCircle, FiUpload, FiHome, FiEye, FiPlus } from 'react-icons/fi';

interface UploadSuccessModalProps {
  sourceType?: "UPLOAD" | "LINK";
  isOpen: boolean;
  onClose: () => void;
  uploadedId?: string;
  title: string;
  type: 'movie' | 'series';
  onUploadMore: () => void;
}

const UploadSuccessModal: React.FC<UploadSuccessModalProps> = ({
  isOpen,
  onClose,
  uploadedId,
  title,
  type,
  onUploadMore,
  sourceType = "UPLOAD",
}) => {
  const router = useRouter();
  const { t } = useTranslation('common');

  if (!isOpen) return null;

  const handleViewDetails = () => {
    if (uploadedId) {
      router.push(`/videoinfo?id=${encodeURIComponent(uploadedId)}&type=${type}`);
    }
    onClose();
  };

  const handleGoHome = () => {
    router.push('/');
    onClose();
  };

  const handleUploadMore = () => {
    onUploadMore();
    onClose();
  };

  // Message logic
  const isLink = sourceType === "LINK";
  const successTitle = isLink
    ? t('upload.successAddTitle', 'Success Add Movie/Series!')
    : t('upload.successTitle', 'Upload Successful!');
  const successDesc = isLink
    ? (type === 'movie'
        ? t('upload.movieAddSuccess', `"${title}" has been added successfully!`,{title})
        : t('upload.seriesAddSuccess', `"${title}" series has been added successfully!`,{title})
      )
    : (type === 'movie'
        ? t('upload.movieUploadSuccess', `"${title}" has been uploaded successfully!`,{title})
        : t('upload.seriesUploadSuccess', `"${title}" series has been uploaded successfully!`,{title})
      );
  const addMoreLabel = isLink
    ? t('upload.addMore', `Add More ${type === 'movie' ? 'Movie' : 'Series'}`,{type:t(`upload.${type}`)})
    : t('upload.uploadMore', `Upload Another ${type === 'movie' ? 'Movie' : 'Series'}`,{type:t(`upload.${type}`)});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-xl p-8 shadow-2xl max-w-md w-full mx-4 border border-[#fbb033]">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <FiCheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            {successTitle}
          </h2>
          
          <p className="text-gray-300 mb-6">
            {successDesc}
          </p>
          
          <div className="space-y-3">
            {/* View Details button is still commented out */}
            <button
              onClick={handleUploadMore}
              className="w-full flex items-center justify-center px-4 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
            >
              {isLink ? <FiPlus className="mr-2" /> : <FiUpload className="mr-2" />}
              {addMoreLabel}
            </button>
            
            <button
              onClick={handleGoHome}
              className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors"
            >
              <FiHome className="mr-2" />
              {t('upload.backToHome', 'Back to Home')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadSuccessModal;
