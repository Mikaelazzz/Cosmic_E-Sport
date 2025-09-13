/**
 * Event image utilities for handling both old filesystem paths and new Supabase Storage URLs
 */

/**
 * Convert event image path to proper URL
 * Handles both old filesystem paths and new Supabase Storage URLs
 */
export function getEventImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  
  // If it's already a full URL (Supabase Storage), return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it's an old format path, convert to Supabase Storage URL
  if (imagePath.startsWith('/src/events/')) {
    const filename = imagePath.replace('/src/events/', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/profiles/events/${filename}`;
    }
  }
  
  // Return as is for any other format
  return imagePath;
}

/**
 * Get event image URL with cache busting
 */
export function getEventImageUrlWithCache(imagePath: string | null | undefined): string | null {
  const url = getEventImageUrl(imagePath);
  if (!url) return null;
  
  // Add cache busting parameter
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}