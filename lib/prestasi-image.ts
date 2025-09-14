/**
 * Prestasi image utilities for handling both old filesystem paths and new Supabase Storage URLs
 */

/**
 * Convert prestasi image path to proper URL
 * Handles both old filesystem paths and new Supabase Storage URLs
 */
export function getPrestasiImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  
  // If it's already a full URL (Supabase Storage), return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it's an old format path, convert to Supabase Storage URL
  if (imagePath.startsWith('/src/prestasi/')) {
    const filename = imagePath.replace('/src/prestasi/', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/prestasi-images/${filename}`;
    }
  }
  
  // If it's just a filename (new format), convert to Supabase Storage URL
  if (!imagePath.includes('/') && !imagePath.startsWith('http')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/prestasi-images/${imagePath}`;
    }
  }
  
  // Return as is for any other format
  return imagePath;
}

/**
 * Get prestasi image URL with cache busting
 */
export function getPrestasiImageUrlWithCache(imagePath: string | null | undefined): string | null {
  const url = getPrestasiImageUrl(imagePath);
  if (!url) return null;
  
  // Add cache busting parameter
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

/**
 * Get prestasi thumbnail URL (if available)
 */
export function getPrestasiThumbnailUrl(imagePath: string | null | undefined): string | null {
  const url = getPrestasiImageUrl(imagePath);
  if (!url) return null;
  
  // For Supabase Storage, we can add transform parameters for thumbnails
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    return `${url}?width=400&height=300&resize=cover&quality=80`;
  }
  
  return url;
}