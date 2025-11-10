/**
 * EpisodeFile.tsx
 * 
 * This component handles the upload and preview of a single episode file or m3u8 URL
 * for a TV series. It supports:
 * - File upload (with preview and unsupported format warning)
 * - m3u8 URL input and HLS.js preview
 * - Duration detection and reporting to parent
 * - Switching between upload and link modes
 * 
 * Key conventions:
 * - Receives episode state and handlers as props from the parent (SeriesUpload).
 * - Uses HLS.js for m3u8 preview.
 * - Calls `onDurationDetected` when video duration is available.
 * 
 * To extend:
 * - Add more validation or metadata fields as needed.
 * - Update UI for new video formats.
 * 
 * Function-level comments are provided below for maintainability.
 */

"use client";
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FiFile, FiLink, FiUpload, FiX } from 'react-icons/fi';
import VideoPlayer from '@/components/ui/VideoPlayer';
import Hls from 'hls.js';

interface Episode {
    number: number;
    title: string;
    description: string;
    file: File | null;
    customCoverUrl?: string;
    duration?: number | null;
    m3u8Url?: string | null;
}

interface EpisodeFileProps {
    episode: Episode;
    index: number;
    episodePreviewUrl?: string;
    unsupportedFormatMsg?: string;
    fileInputRef?: React.RefObject<HTMLInputElement | null>;
    onFileSelect: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void;
    onClearFile: (index: number) => void;
    onDurationDetected?: (durationMs: number, index: number) => void;
    setSeriesForm: React.Dispatch<React.SetStateAction<SeriesForm>>;
}

interface SeriesForm {
    title: string;
    description: string;
    customCoverUrl: string;
    coverFile: File | null;
    categoryId: string;
    year: number;
    region: string;
    language: string;
    director: string;
    actors: string;
    rating: number | null;
    tags: string[];
    seasonNumber: number;
    totalEpisodes: number;
    episodes: Episode[];
}

/**
 * EpisodeFile
 * Main component for handling episode upload or m3u8 link input.
 * Props:
 * - episode: The episode object (number, title, file, etc.)
 * - index: Index of the episode in the series
 * - episodePreviewUrl: Preview URL for the uploaded file
 * - unsupportedFormatMsg: Warning message for unsupported formats
 * - fileInputRef: Ref for the file input (for first episode)
 * - onFileSelect: Handler for file selection
 * - onClearFile: Handler for clearing the selected file
 * - onDurationDetected: Handler for reporting detected duration
 * - setSeriesForm: State setter for the parent form
 */
const EpisodeFile: React.FC<EpisodeFileProps> = ({
    episode,
    index,
    episodePreviewUrl,
    unsupportedFormatMsg,
    fileInputRef,
    onFileSelect,
    onClearFile,
    onDurationDetected,
    setSeriesForm
}) => {
    const { t } = useTranslation('common');
    const [fileMethod, setFileMethod] = useState<"UPLOAD" | "LINK">("UPLOAD");
    const [HLSPreviewUrl, setHLSPreviewUrl] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);

    /**
     * handleHLSPreview
     * Sets up HLS.js to preview an m3u8 URL in the browser.
     * Attaches the stream to the video element and reports duration.
     */
    const handleHLSPreview = (url: string) => {
        console.log('Setting up HLS preview for URL:', url);
        const videoElement = videoRef.current;

        if (!videoElement) return;
        // Clean up existing HLS instance
        if (hlsRef.current) {
            try { hlsRef.current.destroy(); } catch (_e) { }
            hlsRef.current = null;
        }

        if (Hls.isSupported()) {
            const hls = new Hls({
                xhrSetup: (xhr) => {
                    // xhr.setRequestHeader('api-key', process.env.UPLOAD_API_KEY || '');
                }
            });

            hlsRef.current = hls;
            hls.loadSource(url);
            hls.attachMedia(videoElement);
            console.log('HLS instance created and source loaded', url);
            hls.on(Hls.Events.MANIFEST_PARSED, async () => {
                console.log('HLS manifest parsed, starting playback');
                videoElement.play().catch(console.error);

                if (videoElement.duration && !isNaN(videoElement.duration) && isFinite(videoElement.duration) && videoElement.duration > 0) {
                    // setSeriesForm(prev => ({ ...prev, duration: Math.round(videoElement.duration * 1000) }));
                    if (onDurationDetected) {
                        onDurationDetected(Math.round(videoElement.duration * 1000), index);
                    }
                } else {
                    const waitForMeta = () => new Promise<void>((resolve) => {
                        if (!videoElement) return resolve();
                        if (!isNaN(videoElement.duration) && isFinite(videoElement.duration)) return resolve();
                        const onLoaded = () => { videoElement.removeEventListener('loadedmetadata', onLoaded); resolve(); };
                        videoElement.addEventListener('loadedmetadata', onLoaded);
                    });
                    await waitForMeta();
                    if (videoElement && !isNaN(videoElement.duration) && isFinite(videoElement.duration) && videoElement.duration > 0) {
                        setSeriesForm(prev => ({ ...prev, duration: Math.round(videoElement.duration * 1000) }));
                    }
                }
            });

        }
    }
    return (
        <div>
            {/* File/Link mode switch */}
            <label className="block text-lg font-medium mb-2">{t('uploadForm.videoFileLabel', 'Video File')}</label>
            <div className="flex justify-center mb-8">
                <div className="rounded-lg p-1 flex gap-6">

                    <div onClick={() => setFileMethod("UPLOAD")}
                        className={`cursor-pointer relative group rounded-lg overflow-hidden flex flex-col items-start justify-end p-2 bg-gradient-to-br from-gray-800 to-black hover:scale-105 transform transition duration-300 ${fileMethod === "UPLOAD" ? "ring-4 ring-[#fbb033]" : ""}`}
                    >
                        <div className="absolute inset-0 opacity-10 bg-[url('/images/hero-movie.jpg')] bg-cover bg-center"></div>
                        <div className="z-10">
                            <div className="flex items-center gap-3">
                                <FiFile className="text-[#fbb033] text-xl" />
                                <h2 className="text-xl font-bold">{t('upload.upload', 'Upload')}</h2>
                            </div>
                        </div>
                    </div>

                    <div onClick={() => setFileMethod("LINK")}
                        className={`cursor-pointer relative group rounded-lg overflow-hidden flex flex-col items-start justify-end p-2 bg-gradient-to-br from-gray-800 to-black hover:scale-105 transform transition duration-300 ${fileMethod === "LINK" ? "ring-4 ring-[#fbb033]" : ""}`}
                    >
                        <div className="absolute inset-0 opacity-10 bg-[url('/images/hero-series.jpg')] bg-cover bg-center"></div>
                        <div className="z-10">
                            <div className="flex items-center gap-3">
                                <FiLink className="text-[#fbb033] text-xl" />
                                <h2 className="text-xl font-bold">{t('upload.link', 'URL Link')}</h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {fileMethod === "LINK" ? (
                // m3u8 URL input and preview
                <div className="mb-6 w-full">
                    <label className="block text-lg font-medium mb-2">{t('upload.url', 'URL Link')}</label>
                    <input
                        type="url"
                        required
                        value={episode.m3u8Url || ""}
                        onChange={(e) => {
                            const url = e.target.value;
                            // setSeriesForm(prev => ({ ...prev, m3u8Url: url }));
                            setSeriesForm(prev => ({ ...prev, episodes: prev.episodes.map((ep, idx) => idx === index ? { ...ep, m3u8Url: url } : ep) }));
                            // simple validation: must be a non-empty http/https URL
                            if (!url || url.trim() === '') {

                                return;
                            }
                            try {
                                const parsed = new URL(url);
                                if (!['http:', 'https:'].includes(parsed.protocol)) {
                                    throw new Error('invalid-protocol');
                                }
                                // valid URL
                                // setUploadProgress(prev => ({ ...prev, status: 'idle', error: '' }));
                                setHLSPreviewUrl(url);
                                handleHLSPreview(url);
                            } catch {
                                // setUploadProgress({ progress: 0, status: 'error', error: t('uploadForm.invalidUrl', 'Please enter a valid http(s) URL') });
                            }
                        }}
                        className="w-full px-4 py-3 border border-[#fbb033] h-24 rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white"
                        placeholder={t('uploadForm.urlPlaceholder', 'Enter movie URL')}
                    />
                </div>

            ) : (
                <>
                    {/* File upload and preview */}
                    {!episode.file ? (

                        <label
                            id={`upload-episode-box-${index}`}
                            htmlFor={`episode-file-${index}`}
                            className="flex flex-col items-center justify-center w-full bg-[#fbb033]/[0.2] rounded-3xl cursor-pointer hover:bg-[#fbb033]/[0.1] transition-colors"
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-3">
                                <FiUpload className="w-12 h-12 mb-3" />
                                <p className="mb-2 text-xl">
                                    {episode.file ? (episode.file as File).name : t('upload.clickOrDrag', 'Click to upload or drag and drop')}
                                </p>
                                <p className="text-xs">{t('upload.fileTypes', 'MP4, MOV, MKV, WEBM (MAX. 10GB)')}</p>
                                <p className="text-xl mt-3 mb-6">{t('upload.videoPrivacy', 'Your Video Will Remain Private Until It Is Published')}</p>
                                <span className="px-7 py-2 bg-[#fbb033] rounded-3xl mt-2">{t('uploadForm.chooseFile', 'Choose File')}</span>
                            </div>
                            <input
                                id={`episode-file-${index}`}
                                type="file"
                                accept="video/mp4,video/quicktime,video/x-matroska,video/webm,.mp4,.mov,.mkv,.webm"
                                onChange={(e) => onFileSelect(e, index)}
                                className="visually-hidden opacity-0"
                                ref={index === 0 ? fileInputRef : undefined}
                                required
                            />
                        </label>

                    ) : (
                        <div className="flex-1 flex items-center justify-between gap-4 relative">
                            {unsupportedFormatMsg ? (
                                <div className="mt-3 mr-3 p-3 bg-yellow-800 text-yellow-100 rounded">
                                    <strong>{unsupportedFormatMsg}</strong>
                                    <div className="text-sm mt-1">
                                        {t('uploadForm.unsupportedPreviewNote', 'This file will be uploaded normally but this file type cannot be previewed in the browser.')}
                                    </div>
                                </div>
                            ) : (
                                episodePreviewUrl && (
                                    <VideoPlayer
                                        src={episodePreviewUrl}
                                        onDuration={(durationMs) => {
                                            if (onDurationDetected) {
                                                onDurationDetected(durationMs, index);
                                            }
                                        }}
                                        className="max-w-[50%] mx-auto rounded bg-black"
                                        onError={(error) => {
                                            console.error('Video player error:', error);
                                        }}
                                    />
                                )
                            )}
                            <button
                                type="button"
                                onClick={() => onClearFile(index)}
                                className="cursor-pointer p-2 bg-red-600/50 rounded-full text-white hover:bg-red-500 absolute top-2 right-2 z-10"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>)}
            {/* HLS preview for m3u8 URL */}
            {
                HLSPreviewUrl && fileMethod === "LINK" && (
                    <div className="w-full flex items-center justify-between gap-4">
                        <div className="relative">
                            <video
                                ref={videoRef}
                                // src={HLSPreviewUrl}
                                controls
                                className="w-full rounded bg-black"
                                onError={(error) => {
                                    console.error('Video player error:', error);
                                }}
                            />
                        </div>
                    </div>
                )}

        </div>
    );
};

export default EpisodeFile;