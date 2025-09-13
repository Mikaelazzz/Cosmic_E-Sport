/**
 * Payment proof utilities for handling both old filesystem paths and new Supabase Storage URLs
 */

/**
 * Convert payment proof path to proper URL
 * Handles both old filesystem paths and new Supabase Storage URLs
 */
export function getPaymentProofUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  
  // If it's already a full URL (Supabase Storage), return as is
  if (filePath.startsWith('http')) {
    return filePath;
  }
  
  // If it's an old format path, convert to Supabase Storage URL
  if (filePath.startsWith('/src/events/pembayaran/')) {
    // Extract nim and filename from path: /src/events/pembayaran/NIM/filename.ext
    const pathParts = filePath.split('/');
    if (pathParts.length >= 5) {
      const nim = pathParts[4];
      const filename = pathParts[5];
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        return `${supabaseUrl}/storage/v1/object/public/profiles/payment-proofs/${nim}/${filename}`;
      }
    }
  }
  
  // Return as is for any other format
  return filePath;
}

/**
 * Get payment proof URL with cache busting
 */
export function getPaymentProofUrlWithCache(filePath: string | null | undefined): string | null {
  const url = getPaymentProofUrl(filePath);
  if (!url) return null;
  
  // Add cache busting parameter
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}