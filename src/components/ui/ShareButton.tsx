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
  const [showMenu, setShowMenu] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const platforms = [
    { id: '1', name: 'WeChat', icon: '💬' },
    { id: '2', name: 'Weibo', icon: '🐦' },
    { id: '3', name: 'TikTok', icon: '🎵' },
    { id: '4', name: 'Other', icon: '📤' },
  ];

  const handleShare = async (platform: string, platformName: string) => {
    setIsSharing(true);
    try {
      const result = await createShare({
        targetId,
        contentType,
        type: 1, // 1 for media ID
        platform
      });

      if (result.success) {
        setShareSuccess(true);
        
        // Use Web Share API if available
        if (navigator.share && title) {
          try {
            await navigator.share({
              title: title,
              url: window.location.href
            });
          } catch (err) {
            // User cancelled share or share API not available
            console.log('Share cancelled or not available', err);
          }
        } else {
          // Fallback: copy link to clipboard
          await navigator.clipboard.writeText(window.location.href);
          alert(t('share.linkCopied', 'Link copied to clipboard!'));
        }

        setTimeout(() => {
          setShareSuccess(false);
          setShowMenu(false);
        }, 2000);
      } else {
        alert(result.message || t('share.error', 'Failed to share'));
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
          onClick={() => setShowMenu(!showMenu)}
          className={`p-2 rounded-full hover:bg-gray-700 transition-colors ${className}`}
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
          onClick={() => setShowMenu(!showMenu)}
          disabled={isSharing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
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
        onClick={() => setShowMenu(!showMenu)}
        disabled={isSharing}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors disabled:opacity-50 ${className}`}
      >
        {shareSuccess ? <FiCheck className="w-4 h-4" /> : <FiShare2 className="w-4 h-4" />}
        <span className="text-sm">{t('share.title', 'Share')}</span>
      </button>
    );
  };

  return (
    <div className="relative">
      {renderButton()}

      {/* Share Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute bottom-full mb-2 left-0 z-50 bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-2 min-w-[200px]">
            <p className="text-xs text-gray-400 px-3 py-2 font-medium">
              {t('share.selectPlatform', 'Share to:')}
            </p>
            <div className="space-y-1">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handleShare(platform.id, platform.name)}
                  disabled={isSharing}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 transition-colors disabled:opacity-50 text-left"
                >
                  <span className="text-xl">{platform.icon}</span>
                  <span className="text-sm text-gray-200">{platform.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShareButton;
