/**
 * Utility functions for avatar generation and profile image handling
 */

/**
 * Generate initials from full name
 * Takes first letter of first name and first letter of second name
 * Example: "Vincentius Johanes Lwie Jaya" -> "VJ"
 */
export function generateInitials(fullName: string): string {
  if (!fullName || fullName.trim() === '') {
    return 'U'; // Default for "User"
  }

  const names = fullName.trim().split(' ').filter(name => name.length > 0);
  
  if (names.length === 0) {
    return 'U';
  }
  
  if (names.length === 1) {
    // If only one name, take first and second character if available
    const name = names[0];
    if (name.length >= 2) {
      return (name[0] + name[1]).toUpperCase();
    }
    return name[0].toUpperCase();
  }
  
  // Take first letter of first name and first letter of second name
  const firstInitial = names[0][0];
  const secondInitial = names[1][0];
  
  return (firstInitial + secondInitial).toUpperCase();
}

/**
 * Generate avatar URL using ui-avatars.com service
 */
export function generateAvatarUrl(
  fullName: string, 
  size: number = 128,
  backgroundColor: string = 'FFD700', // Gold color
  textColor: string = '000000' // Black text
): string {
  const initials = generateInitials(fullName);
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=${backgroundColor}&color=${textColor}&font-size=0.33&bold=true`;
}

/**
 * Get user profile image URL
 * Returns local profile image if available, otherwise returns empty string for fallback
 */
export function getUserAvatarUrl(user: {
  nama_lengkap?: string;
  profile_image?: string;
  email?: string;
  nim?: string;
  role?: string;
}, size: number = 128, forceRefresh: boolean = false): string {
  // Check for local profile image first
  if (user.nim && user.role) {
    const fileName = `${user.role.toLowerCase()}-${user.nim}.jpg`;
    let localAvatarPath = `/api/profile/${fileName}`;
    
    // Add cache busting timestamp if forceRefresh is true
    if (forceRefresh) {
      localAvatarPath += `?t=${Date.now()}`;
    }
    
    return localAvatarPath;
  }
  
  // If user has profile_image URL, return it
  if (user.profile_image && user.profile_image.trim() !== '') {
    return user.profile_image;
  }
  
  // Return empty string to show initials fallback
  return '';
}

/**
 * Generate random background colors for variety
 */
export const avatarColors = [
  'FFD700', // Gold
  '4F46E5', // Indigo
  '059669', // Emerald
  'DC2626', // Red
  '7C3AED', // Violet
  'EA580C', // Orange
  '0891B2', // Cyan
  'BE185D', // Pink
  '65A30D', // Lime
  '7C2D12', // Brown
];

/**
 * Get consistent color for user based on their name
 */
export function getUserAvatarColor(fullName: string): string {
  if (!fullName) return avatarColors[0];
  
  // Simple hash to get consistent color
  let hash = 0;
  for (let i = 0; i < fullName.length; i++) {
    hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
}

/**
 * Generate avatar URL with consistent color for user
 */
export function generateConsistentAvatarUrl(
  fullName: string,
  size: number = 128
): string {
  const initials = generateInitials(fullName);
  const backgroundColor = getUserAvatarColor(fullName);
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=${backgroundColor}&color=FFFFFF&font-size=0.33&bold=true`;
}
