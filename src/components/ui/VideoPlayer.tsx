"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for react-player to avoid SSR issues
const ReactPlayer = dynamic(() => import('react-player'), { 
  ssr: false,
  loading: () => <div className="w-full h-48 bg-gray-700 rounded flex items-center justify-center">Loading player...</div>
}) as typeof import('react-player').default;

interface VideoPlayerProps {
  src: string;
  onDuration?: (duration: number) => void;
  className?: string;
  onError?: (error: unknown) => void;
}

export default function VideoPlayer({ src, onDuration, className = "", onError }: VideoPlayerProps) {
  const [playerState, setPlayerState] = useState<'native' | 'react-player' | 'converting' | 'unsupported'>('native');
  const [error, setError] = useState<string | null>(null);
  const [convertedSrc, setConvertedSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check file extension and MIME type to determine support
  useEffect(() => {
    const fileExtension = src.split('.').pop()?.toLowerCase();
    const webSupportedFormats = ['mp4', 'webm', 'ogg', 'mov'];
    const problematicFormats = ['flv', 'avi', 'wmv'];
    
    if (fileExtension && webSupportedFormats.includes(fileExtension)) {
      console.log(`Detected web-supported ${fileExtension} format, using native player`);
      setPlayerState('native');
    } else if (fileExtension && problematicFormats.includes(fileExtension)) {
      console.log(`Detected ${fileExtension} format, attempting ReactPlayer first`);
      setPlayerState('react-player');
    } else {
      // Unknown format, try native first
      setPlayerState('native');
    }
    
    // Reset states when src changes
    setError(null);
    setConvertedSrc(null);
  }, [src]);

  const handleNativeVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Native video error:', e);
    const fileExtension = src.split('.').pop()?.toLowerCase();
    
    // Try ReactPlayer as fallback
    if (playerState === 'native') {
      console.log('Native player failed, trying ReactPlayer');
      setPlayerState('react-player');
    } else {
      setError(`Unable to play this ${fileExtension?.toUpperCase()} file. This format is not supported by web browsers.`);
      setPlayerState('unsupported');
    }
    
    onError?.(e);
  };

  const handleNativeVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    if (video && video.duration && onDuration) {
      const durationMs = Math.round(video.duration * 1000);
      console.log('Native video duration detected:', durationMs);
      onDuration(durationMs);
    }
  };

  const handleReactPlayerDuration = (duration: number) => {
    if (onDuration) {
      const durationMs = Math.round(duration * 1000);
      console.log('ReactPlayer duration detected:', durationMs);
      onDuration(durationMs);
    }
  };

  const handleReactPlayerError = (error: unknown) => {
    console.error('ReactPlayer error:', error);
    const fileExtension = src.split('.').pop()?.toLowerCase();
    setError(`Unable to play this ${fileExtension?.toUpperCase()} file. This format requires additional codecs not available in web browsers.`);
    setPlayerState('unsupported');
    onError?.(error);
  };

  const handleReactPlayerReady = () => {
    console.log('ReactPlayer is ready');
  };

  if (playerState === 'unsupported') {
    const fileExtension = src.split('.').pop()?.toLowerCase();
    return (
      <div className={`w-full h-48 bg-gray-800 rounded flex flex-col items-center justify-center ${className}`}>
        <div className="text-red-400 text-center p-4">
          <div className="text-lg mb-2">⚠️ Unsupported Format</div>
          <div className="text-sm mb-3">{error}</div>
          <div className="text-xs text-gray-400 mb-3">
            <strong>{fileExtension?.toUpperCase()}</strong> files are not supported by web browsers.
          </div>
          <div className="text-xs text-blue-400">
            💡 <strong>Tip:</strong> Convert your video to MP4 or WebM format for web compatibility.
          </div>
          <div className="text-xs text-gray-500 mt-2">
            You can use tools like FFmpeg, HandBrake, or online converters.
          </div>
        </div>
      </div>
    );
  }

  if (playerState === 'react-player') {
    return (
    <div className={`w-full rounded bg-black overflow-hidden ${className}`}>
      
      <ReactPlayer
        url={convertedSrc || src}
        controls
        width="100%"
        height="200px"
        onDuration={handleReactPlayerDuration}
        onError={handleReactPlayerError}
        onReady={handleReactPlayerReady}
        config={{
        // @ts-expect-error: react-player types are broken for file attribute
        file: {
          attributes: {
            crossOrigin: 'anonymous',
            preload: 'metadata'
          }
        }
        }}
      />
    </div>
    );
  }

  return (
    <video 
      ref={videoRef}
      onLoadedData={handleNativeVideoLoad}
      src={convertedSrc || src} 
      controls 
      className={`w-full rounded bg-black ${className}`}
      preload="metadata"
      onError={handleNativeVideoError}
      crossOrigin="anonymous"
    >
      <source src={convertedSrc || src} />
      Your browser does not support the video tag.
    </video>
  );
}
