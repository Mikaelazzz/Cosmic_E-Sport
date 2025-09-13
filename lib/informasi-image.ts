/**
 * Utility functions for handling informasi image URLs
 * Converts between legacy filesystem paths and Supabase Storage URLs
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const BUCKET_NAME = 'profiles';

/**
 * Get the full Supabase Storage URL for an informasi image
 * @param path - The image path (can be legacy filesystem path or filename)
 * @returns Full Supabase Storage URL
 */
export function getInformasiImageUrl(path: string | null): string | null {
  if (!path || !SUPABASE_URL) return null;
  
  // If it's already a full URL, return as-is
  if (path.startsWith('http')) {
    return path;
  }
  
  // Extract filename from path
  let filename: string;
  
  if (path.startsWith('/src/informasi/')) {
    // Legacy filesystem path: /src/informasi/informasi-123.jpg
    filename = path.replace('/src/informasi/', '');
  } else if (path.includes('/')) {
    // Path with directories: extract just the filename
    filename = path.split('/').pop() || path;
  } else {
    // Just filename
    filename = path;
  }
  
  // Return Supabase Storage URL
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/informasi/${filename}`;
}

/**
 * Get informasi image URL with cache busting
 * @param path - The image path
 * @param timestamp - Optional timestamp for cache busting
 * @returns URL with cache busting parameter
 */
export function getInformasiImageUrlWithCache(path: string | null, timestamp?: number): string | null {
  const baseUrl = getInformasiImageUrl(path);
  if (!baseUrl) return null;
  
  const cacheParam = timestamp || Date.now();
  return `${baseUrl}?t=${cacheParam}`;
}

/**
 * Extract informasi ID from filename
 * @param filename - The filename (e.g., "informasi-123.jpg")
 * @returns The informasi ID or null
 */
export function extractInformasiIdFromFilename(filename: string): string | null {
  const match = filename.match(/^informasi-(.+)\.(?:jpg|jpeg|png|webp)$/);
  return match ? match[1] : null;
}

/**
 * Generate filename for informasi image
 * @param informasiId - The informasi ID
 * @param extension - File extension (with or without dot)
 * @returns Generated filename
 */
export function generateInformasiFilename(informasiId: string, extension: string): string {
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return `informasi-${informasiId}${ext}`;
}

/**
 * Convert legacy filesystem path to Supabase Storage path
 * @param legacyPath - Legacy path like "/src/informasi/informasi-123.jpg"
 * @returns Supabase Storage path like "informasi/informasi-123.jpg"
 */
export function convertLegacyPathToStoragePath(legacyPath: string): string {
  if (legacyPath.startsWith('/src/informasi/')) {
    return `informasi/${legacyPath.replace('/src/informasi/', '')}`;
  }
  
  // If it's already in the correct format, return as-is
  if (legacyPath.startsWith('informasi/')) {
    return legacyPath;
  }
  
  // Default: assume it's just a filename
  return `informasi/${legacyPath}`;
}