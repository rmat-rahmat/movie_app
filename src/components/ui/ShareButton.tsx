'use client';

import React, { useState } from 'react';
import { FiShare2, FiCheck } from 'react-icons/fi';
import { createShare } from '@/lib/movieApi';
import { useTranslation } from 'react-i18next';

interface ShareButtonProps {
  targetId: string;
  contentType: 'video' | 'episode';
  title?: string;
  className?: string;
  variant?: 'icon' | 'button' | 'full';
}

const ShareButton: React.FC<ShareButtonProps> = ({
  targetId,
  contentType,
  title,
  className = '',
  variant = 'button'
}) => {
  const { t } = useTranslation('common');
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      const shareUrl = window.location.href;
      const shareTitle = title || document.title;
      const shareText = `Check out: ${shareTitle}`;

      // Check if Web Share API is available
      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
          });

          // After successful share, record it in the backend
          // Platform is set to '4' (Other) since we can't detect which platform user chose
          const result = await createShare({
            targetId,
            contentType,
            type: 1, // 1 for media ID
            platform: '4' // Other/Unknown platform
          });

          if (result.success) {
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 2000);
          }
        } catch (err) {
          // User cancelled share
          console.log('Share cancelled', err);
        }
      } else {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(shareUrl);
        
        // Record the share as clipboard copy
        const result = await createShare({
          targetId,
          contentType,
          type: 1,
          platform: '4' // Other platform
        });

        if (result.success) {
          setShareSuccess(true);
          alert(t('share.linkCopied', 'Link copied to clipboard!'));
          setTimeout(() => setShareSuccess(false), 2000);
        }
      }
    } catch (err) {
      console.error('Share error:', err);
      alert(t('share.error', 'Failed to share'));
    } finally {
      setIsSharing(false);
    }
  };

  const renderButton = () => {
    if (variant === 'icon') {
      return (
        <button
          onClick={handleShare}
          disabled={isSharing}
          className={`p-2 rounded-full cursor-pointer hover:bg-gray-700 transition-colors disabled:opacity-50 ${className}`}
          title={t('share.title', 'Share')}
        >
          {shareSuccess ? (
            <FiCheck className="w-5 h-5 text-green-400" />
          ) : (
            <FiShare2 className="w-5 h-5" />
          )}
        </button>
      );
    }

    if (variant === 'full') {
      return (
        <button
          onClick={handleShare}
          disabled={isSharing}
          className={`flex items-center cursor-pointer gap-2 px-4 py-2 rounded-lg transition-all ${
            shareSuccess
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          } disabled:opacity-50 ${className}`}
        >
          {shareSuccess ? (
            <>
              <FiCheck className="w-5 h-5" />
              <span className="text-sm font-medium">{t('share.shared', 'Shared!')}</span>
            </>
          ) : (
            <>
              <FiShare2 className="w-5 h-5" />
              <span className="text-sm font-medium">{t('share.title', 'Share')}</span>
            </>
          )}
        </button>
      );
    }

    // Default 'button' variant
    return (
      <button
        onClick={handleShare}
        disabled={isSharing}
        className={`flex items-center cursor-pointer gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors disabled:opacity-50 ${className}`}
      >
        {shareSuccess ? <FiCheck className="w-4 h-4" /> : <FiShare2 className="w-4 h-4" />}
        <span className="hidden md:block text-sm">{t('share.title', 'Share')}</span>
      </button>
    );
  };

  return <div className="relative">{renderButton()}</div>;
};

export default ShareButton;
