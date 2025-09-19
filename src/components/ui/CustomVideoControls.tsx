"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
  FiMinimize,
  FiSettings,
  FiRotateCcw,
  FiRotateCw,
  FiSkipBack,
  FiSkipForward
} from 'react-icons/fi';

interface CustomVideoControlsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  onPlayPause: () => void;
  availableQualities: string[];
  currentQuality: number;
  onQualityChange: (qualityIndex: number) => void;
  loading?: boolean;
  className?: string;
}

const CustomVideoControls: React.FC<CustomVideoControlsProps> = ({
  videoRef,
  isPlaying,
  onPlayPause,
  availableQualities,
  currentQuality,
  onQualityChange,
  loading = false,
  className = ""
}) => {
  const { t } = useTranslation();
  
  // State for controls
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  // Refs
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeSliderRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Update buffered progress
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / video.duration) * 100;
        setBuffered(bufferedPercent);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setVolume(video.volume);
      setIsMuted(video.muted);
      setPlaybackRate(video.playbackRate);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handleRateChange = () => {
      setPlaybackRate(video.playbackRate);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('ratechange', handleRateChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('ratechange', handleRateChange);
    };
  }, [videoRef]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Format time helper
  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Progress bar handlers
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressBarRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const newTime = clickPercent * duration;
    
    video.currentTime = newTime;
  };

  // Volume handlers
  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = newVolume;
    video.muted = newVolume === 0;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleVolumeSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const slider = volumeSliderRef.current;
    if (!slider) return;

    const rect = slider.getBoundingClientRect();
    const clickY = rect.bottom - e.clientY;
    const clickPercent = clickY / rect.height;
    const newVolume = Math.max(0, Math.min(1, clickPercent));
    
    handleVolumeChange(newVolume);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.muted = false;
      video.volume = volume > 0 ? volume : 0.5;
    } else {
      video.muted = true;
    }
  };

  // Fullscreen handlers
  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Playback rate handlers
  const handlePlaybackRateChange = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  // Skip handlers
  const skipForward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.currentTime + 10, duration);
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(video.currentTime - 10, 0);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      // Prevent default behavior for handled keys
      const handledKeys = ['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyF', 'KeyM'];
      if (handledKeys.includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'Space':
          onPlayPause();
          break;
        case 'ArrowLeft':
          video.currentTime = Math.max(video.currentTime - 10, 0);
          break;
        case 'ArrowRight':
          video.currentTime = Math.min(video.currentTime + 10, duration);
          break;
        case 'ArrowUp':
          handleVolumeChange(Math.min(volume + 0.1, 1));
          break;
        case 'ArrowDown':
          handleVolumeChange(Math.max(volume - 0.1, 0));
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
        case 'Digit7':
        case 'Digit8':
        case 'Digit9':
          const digit = parseInt(e.code.slice(-1));
          video.currentTime = (digit / 10) * duration;
          break;
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      container.setAttribute('tabindex', '0'); // Make container focusable
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [onPlayPause, volume, duration, handleVolumeChange, toggleFullscreen, toggleMute]);

  // Touch gesture handling for mobile
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isSeeking = false;
    let isVolumeChanging = false;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
      isSeeking = false;
      isVolumeChanging = false;
      resetControlsTimeout();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const video = videoRef.current;
      if (!video) return;

      // Horizontal swipe for seeking
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
        isSeeking = true;
        e.preventDefault();
        const seekAmount = (deltaX / container.clientWidth) * duration;
        const newTime = Math.max(0, Math.min(currentTime + seekAmount, duration));
        video.currentTime = newTime;
      }
      
      // Vertical swipe for volume (on right side of screen)
      else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 20 && touchStartX > container.clientWidth / 2) {
        isVolumeChanging = true;
        e.preventDefault();
        const volumeChange = -(deltaY / container.clientHeight);
        const newVolume = Math.max(0, Math.min(1, volume + volumeChange));
        handleVolumeChange(newVolume);
      }
    };

    const handleTouchEnd = () => {
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;
      
      // Double tap to toggle fullscreen
      if (touchDuration < 300 && !isSeeking && !isVolumeChanging) {
        // This is a tap, could implement double-tap detection here
        resetControlsTimeout();
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [duration, currentTime, volume, handleVolumeChange, resetControlsTimeout]);

  // Calculate progress percentages
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? buffered : 0;

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 ${className}`}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Controls overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <div 
            ref={progressBarRef}
            className="relative h-2 bg-white/20 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
          >
            {/* Buffered progress */}
            <div 
              className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
              style={{ width: `${bufferedPercent}%` }}
            />
            
            {/* Current progress */}
            <div 
              className="absolute top-0 left-0 h-full bg-[#fbb033] rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
            
            {/* Progress handle */}
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-[#fbb033] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progressPercent}%`, marginLeft: '-8px' }}
            />
          </div>
          
          {/* Time display */}
          <div className="flex justify-between text-sm text-white/80 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          {/* Left controls */}
          <div className="flex items-center space-x-3">
            {/* Play/Pause */}
            <button
              onClick={onPlayPause}
              disabled={loading}
              className="text-white hover:text-[#fbb033] transition-colors disabled:opacity-50"
              aria-label={isPlaying ? t('video.pause') : t('video.play')}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isPlaying ? (
                <FiPause size={24} />
              ) : (
                <FiPlay size={24} />
              )}
            </button>

            {/* Skip buttons */}
            <button
              onClick={skipBackward}
              className="text-white hover:text-[#fbb033] transition-colors"
              aria-label={t('video.skipBackward')}
            >
              <FiSkipBack size={20} />
            </button>
            
            <button
              onClick={skipForward}
              className="text-white hover:text-[#fbb033] transition-colors"
              aria-label={t('video.skipForward')}
            >
              <FiSkipForward size={20} />
            </button>

            {/* Volume controls */}
            <div className="relative group">
              <button
                onClick={toggleMute}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className="text-white hover:text-[#fbb033] transition-colors"
                aria-label={isMuted ? t('video.unmute') : t('video.mute')}
              >
                {isMuted || volume === 0 ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
              </button>
              
              {/* Volume slider */}
              {showVolumeSlider && (
                <div 
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-black/80 rounded"
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <div 
                    ref={volumeSliderRef}
                    className="relative h-20 w-1 bg-white/20 rounded cursor-pointer"
                    onClick={handleVolumeSliderClick}
                  >
                    <div 
                      className="absolute bottom-0 left-0 w-full bg-[#fbb033] rounded"
                      style={{ height: `${(isMuted ? 0 : volume) * 100}%` }}
                    />
                  </div>
                  <div className="text-center text-xs text-white mt-1">
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </div>
                </div>
              )}
            </div>

            {/* Current time */}
            <span className="text-sm text-white/80">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center space-x-3">
            {/* Playback speed */}
            <div className="relative">
              <select
                value={playbackRate}
                onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
                className="bg-black/50 text-white text-sm px-2 py-1 rounded border border-white/20 hover:border-[#fbb033] transition-colors"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>

            {/* Quality selector */}
            {availableQualities.length > 0 && (
              <div className="relative">
                <select
                  value={currentQuality}
                  onChange={(e) => onQualityChange(Number(e.target.value))}
                  className="bg-black/50 text-white text-sm px-2 py-1 rounded border border-white/20 hover:border-[#fbb033] transition-colors"
                >
                  {availableQualities.map((quality, index) => (
                    <option key={index} value={index}>
                      {quality}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:text-[#fbb033] transition-colors"
                aria-label={t('video.settings')}
              >
                <FiSettings size={20} />
              </button>
              
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 p-3 bg-black/90 rounded-lg border border-white/20 min-w-48">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-white/80 mb-1">
                        {t('video.playbackSpeed')}
                      </label>
                      <select
                        value={playbackRate}
                        onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
                        className="w-full bg-black/50 text-white text-sm px-2 py-1 rounded border border-white/20"
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>Normal</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x</option>
                      </select>
                    </div>
                    
                    {availableQualities.length > 0 && (
                      <div>
                        <label className="block text-sm text-white/80 mb-1">
                          {t('video.quality')}
                        </label>
                        <select
                          value={currentQuality}
                          onChange={(e) => onQualityChange(Number(e.target.value))}
                          className="w-full bg-black/50 text-white text-sm px-2 py-1 rounded border border-white/20"
                        >
                          {availableQualities.map((quality, index) => (
                            <option key={index} value={index}>
                              {quality}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-[#fbb033] transition-colors"
              aria-label={isFullscreen ? t('video.exitFullscreen') : t('video.fullscreen')}
            >
              {isFullscreen ? <FiMinimize size={20} /> : <FiMaximize size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Center play button (when paused) */}
      {!isPlaying && !loading && (
        <button
          onClick={onPlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/25 transition-colors"
          aria-label={t('video.play')}
        >
          <div className="flex items-center justify-center w-20 h-20 md:w-28 md:h-28 bg-white/95 text-black rounded-full shadow-lg">
            <FiPlay size={32} className="ml-1" />
          </div>
        </button>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-white/30 border-t-[#fbb033] rounded-full animate-spin" />
            <span className="text-white text-sm">{t('video.loading')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomVideoControls;
