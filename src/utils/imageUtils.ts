/**
 * Utility functions for handling images efficiently without hitting Vercel limits
 */

export interface ImageSource {
  src: string;
  isExternal: boolean;
  shouldOptimize: boolean;
}

/**
 * Analyzes an image source and determines the best loading strategy
 */
export function analyzeImageSource(src: string): ImageSource {
  if (!src) {
    return { src: '', isExternal: false, shouldOptimize: false };
  }

  // Check if it's an external URL
  const isExternal = src.startsWith('http') && 
    typeof window !== 'undefined' && 
    !src.includes(window.location.hostname);

  // Local images or specific domains can be optimized
  const shouldOptimize = !isExternal || src.includes('localhost');

  return {
    src,
    isExternal,
    shouldOptimize
  };
}

/**
 * Generates responsive image sizes for external images
 */
export function generateSizes(breakpoints?: string[]): string {
  const defaultBreakpoints = [
    '(max-width: 640px) 100vw',
    '(max-width: 768px) 50vw', 
    '(max-width: 1024px) 33vw',
    '25vw'
  ];
  
  return (breakpoints || defaultBreakpoints).join(', ');
}

/**
 * Creates a low-quality placeholder for better UX
 */
export function createPlaceholderDataURL(width: number = 10, height: number = 10): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Create a simple gradient placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
}

/**
 * Optimizes external image URLs when possible
 */
export function optimizeImageUrl(src: string, width?: number, height?: number): string {
  if (!src) return '';
  
  // TMDB image optimization
  if (src.includes('image.tmdb.org')) {
    // Extract the current size from the URL and replace with optimized size
    const sizeMap: Record<string, string> = {
      'original': width && width > 500 ? 'w780' : 'w500',
      'w1280': width && width > 500 ? 'w780' : 'w500', 
      'w780': width && width > 300 ? 'w500' : 'w300',
      'w500': width && width < 300 ? 'w300' : 'w500',
    };
    
    for (const [oldSize, newSize] of Object.entries(sizeMap)) {
      if (src.includes(`/${oldSize}/`)) {
        return src.replace(`/${oldSize}/`, `/${newSize}/`);
      }
    }
  }
  
  // Add other image service optimizations here
  // YouTube thumbnails
  if (src.includes('i.ytimg.com')) {
    // Use medium quality by default to save bandwidth
    return src.replace('/maxresdefault.jpg', '/mqdefault.jpg');
  }
  
  return src;
}

/**
 * Cache headers for better image loading performance
 */
export const IMAGE_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'Expires': new Date(Date.now() + 31536000000).toUTCString(),
};

/**
 * Image loading priorities
 */
export const IMAGE_PRIORITIES = {
  HERO: true,
  ABOVE_FOLD: true, 
  BELOW_FOLD: false,
  LAZY: false,
} as const;
