"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';

const VideoPlayerDemo: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      category: "🎮 Playback Controls",
      items: [
        "Play/Pause button with loading state",
        "Progress bar with click-to-seek",
        "Buffer progress visualization",
        "Skip forward/backward (10 seconds)",
        "Time display (current/total)"
      ]
    },
    {
      category: "🔊 Audio Controls",
      items: [
        "Volume button with mute toggle",
        "Vertical volume slider",
        "Volume percentage display",
        "Keyboard volume control (↑/↓)"
      ]
    },
    {
      category: "⚙️ Quality & Speed",
      items: [
        "Quality selector dropdown",
        "Playback speed control (0.5x - 2x)",
        "Settings panel with options",
        "Seamless quality switching"
      ]
    },
    {
      category: "🖥️ Display Controls",
      items: [
        "Fullscreen toggle",
        "Auto-hide controls",
        "Responsive design",
        "Center play button overlay"
      ]
    },
    {
      category: "⌨️ Keyboard Shortcuts",
      items: [
        "Space - Play/Pause",
        "←/→ - Skip 10 seconds",
        "↑/↓ - Volume control",
        "F - Fullscreen toggle",
        "M - Mute toggle",
        "1-9 - Jump to percentage"
      ]
    },
    {
      category: "📱 Touch Gestures",
      items: [
        "Horizontal swipe - Seek",
        "Vertical swipe (right) - Volume",
        "Tap to show/hide controls",
        "Touch-friendly interface"
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#fbb033]">
        Custom Video Player Features
      </h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {features.map((featureGroup, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3 text-[#fbb033]">
              {featureGroup.category}
            </h2>
            <ul className="space-y-2">
              {featureGroup.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start">
                  <span className="text-[#fbb033] mr-2">•</span>
                  <span className="text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-3 text-[#fbb033]">
          🎯 Advanced Features
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Visual Feedback</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Smooth fade transitions</li>
              <li>• Hover state animations</li>
              <li>• Progress indicators</li>
              <li>• Loading spinners</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Accessibility</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• ARIA labels</li>
              <li>• Keyboard navigation</li>
              <li>• Screen reader support</li>
              <li>• High contrast design</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-400">
          This custom video player provides a comprehensive viewing experience with 
          professional-grade controls and modern UX patterns.
        </p>
      </div>
    </div>
  );
};

export default VideoPlayerDemo;
