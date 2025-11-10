'use client';

import React, { useState, useEffect } from 'react';
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
  const [isSecureContext, setIsSecureContext] = useState(true);

  useEffect(() => {
    // Check if running on HTTPS or localhost
    const isHttps = window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    setIsSecureContext(isHttps || isLocalhost);
  }, []);

  const handleShare = async () => {
    if (!isSecureContext) {
      alert(t('share.secureContextRequired', 'Share feature requires HTTPS or localhost'));
      return;
    }

    setIsSharing(true);

    try {
      const shareUrl = window.location.href;
      const shareTitle = title || document.title;
      const shareText = `Check out: ${shareTitle}`;

      const shareData = {
        title: shareTitle,
        text: shareText,
        url: shareUrl
      };
      
      // Check if Web Share API is available and can share the data
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);

          // After successful share, record it in the backend
          const result = await createShare({
            targetId,
            contentType,
            type: 1,
            platform: '4' // Other platform
          });

          if (result.success) {
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 2000);
          }
        } catch (err: unknown) {
          // User cancelled share or share failed
          if (err instanceof Error && err.name === 'AbortError') {
            console.log('Share cancelled by user');
          } else if (err instanceof Error) {
            console.error('Share error:', err.message);
            throw err;
          }
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Share error:', err.message);
      }
      alert(t('share.error', 'Failed to share'));
    } finally {
      setIsSharing(false);
    }
  };

  const isDisabled = isSharing || !isSecureContext;

  const renderButton = () => {
    if (isDisabled) return null;

    if (variant === 'icon') {
      return (
        <button
          onClick={handleShare}
          disabled={isDisabled}
          className={`p-2 rounded-full cursor-pointer hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          title={!isSecureContext ? t('share.secureContextRequired', 'Share requires HTTPS') : t('share.title', 'Share')}
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
          disabled={isDisabled}
          className={`flex items-center cursor-pointer gap-2 px-4 py-2 rounded-lg transition-all ${shareSuccess
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
        disabled={isDisabled}
        className={`flex items-center cursor-pointer gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {shareSuccess ? <FiCheck className="w-4 h-4" /> : <FiShare2 className="w-4 h-4" />}
        <span className="hidden md:block text-sm">{t('share.title', 'Share')}</span>
      </button>
    );
  };

  return <div className="relative">{renderButton()}</div>;
};

export default ShareButton;
