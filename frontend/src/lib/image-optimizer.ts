/**
 * Image optimization utilities using Supabase Image Transformation API
 * https://supabase.com/docs/guides/storage/serving/image-transformations
 */

export type ImageSize = 'thumbnail' | 'preview' | 'full';

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'origin';
  resize?: 'cover' | 'contain' | 'fill';
}

const SIZE_PRESETS: Record<ImageSize, ImageTransformOptions> = {
  thumbnail: {
    width: 400,
    height: 400,
    quality: 75,
    format: 'webp',
    resize: 'cover',
  },
  preview: {
    width: 800,
    height: 800,
    quality: 85,
    format: 'webp',
    resize: 'contain',
  },
  full: {
    width: 1600,
    height: 1600,
    quality: 90,
    format: 'webp',
    resize: 'contain',
  },
};

/**
 * Optimize image URL using Supabase Image Transformation API
 * @param url - Original image URL from Supabase Storage
 * @param size - Preset size (thumbnail, preview, full) or custom options
 * @returns Optimized image URL with transformation parameters
 */
export function optimizeImageUrl(
  url: string | null | undefined,
  size: ImageSize | ImageTransformOptions = 'preview'
): string | null {
  if (!url) return null;

  // TEMPORARY: Disable optimization until Supabase Image Transformation is configured
  // Need to enable in Supabase Dashboard: Storage > Settings > Image Transformation
  return url;

  // Skip if not a Supabase Storage URL
  // if (!url.includes('supabase.co/storage')) {
  //   return url;
  // }

  // // Get transform options
  // const options = typeof size === 'string' ? SIZE_PRESETS[size] : size;

  // // Build transformation parameters
  // const params = new URLSearchParams();

  // if (options.width) params.append('width', options.width.toString());
  // if (options.height) params.append('height', options.height.toString());
  // if (options.quality) params.append('quality', options.quality.toString());
  // if (options.format) params.append('format', options.format);
  // if (options.resize) params.append('resize', options.resize);

  // // Add transformation parameters to URL
  // const separator = url.includes('?') ? '&' : '?';
  // return `${url}${separator}${params.toString()}`;
}

/**
 * Generate srcset for responsive images
 * @param url - Original image URL
 * @param sizes - Array of widths to generate
 * @returns srcset string
 */
export function generateSrcSet(
  url: string | null | undefined,
  sizes: number[] = [400, 800, 1200, 1600]
): string | null {
  if (!url) return null;

  // TEMPORARY: Disabled until Image Transformation is enabled
  return null;

  // return sizes
  //   .map((width) => {
  //     const optimized = optimizeImageUrl(url, {
  //       width,
  //       quality: 85,
  //       format: 'webp',
  //       resize: 'contain',
  //     });
  //     return `${optimized} ${width}w`;
  //   })
  //   .join(', ');
}

/**
 * Preload critical images for better performance
 * @param urls - Array of image URLs to preload
 * @param size - Image size preset
 */
export function preloadImages(
  urls: (string | null | undefined)[],
  size: ImageSize = 'preview'
): void {
  urls.forEach((url) => {
    if (!url) return;

    const optimizedUrl = optimizeImageUrl(url, size);
    if (!optimizedUrl) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = optimizedUrl;
    link.imageSrcset = generateSrcSet(url) || undefined;
    document.head.appendChild(link);
  });
}

/**
 * Check if image transformation is supported
 */
export function isTransformationSupported(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('supabase.co/storage');
}
