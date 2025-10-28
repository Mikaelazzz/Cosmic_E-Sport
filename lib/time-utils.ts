// Time utilities for PostgreSQL compatibility with WIB timezone

/**
 * Get current date in WIB (UTC+7) timezone
 * @returns Date object adjusted to WIB
 */
const getWIBDate = (): Date => {
  const now = new Date();
  // Convert to WIB (UTC+7) - Get UTC time and add 7 hours
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const wibTime = new Date(utcTime + (7 * 60 * 60 * 1000));
  return wibTime;
};

/**
 * Format Date object to PostgreSQL TIME format (HH:MM:SS) in WIB timezone
 * PostgreSQL stores TIME as UTC, so we need to subtract 7 hours to store correctly
 * @param date - Date object to format (in WIB)
 * @returns String in HH:MM:SS format (UTC for storage)
 */
export const formatTimeForPostgreSQL = (date: Date = getWIBDate()): string => {
  // Subtract 7 hours to convert WIB to UTC for storage
  const utcDate = new Date(date.getTime() - (7 * 60 * 60 * 1000));
  const hours = utcDate.getHours().toString().padStart(2, '0');
  const minutes = utcDate.getMinutes().toString().padStart(2, '0');
  const seconds = utcDate.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Format Date object to PostgreSQL TIMESTAMP format
 * @param date - Date object to format
 * @returns String in ISO format compatible with PostgreSQL
 */
export const formatTimestampForPostgreSQL = (date: Date = new Date()): string => {
  return date.toISOString();
};

/**
 * Get current time in PostgreSQL TIME format (converted from WIB to UTC for storage)
 * @returns Current WIB time as HH:MM:SS string (stored as UTC in database)
 */
export const getCurrentTimeForDB = (): string => {
  return formatTimeForPostgreSQL(getWIBDate());
};

/**
 * Get current timestamp in PostgreSQL TIMESTAMP format (WIB timezone)
 * @returns Current timestamp as ISO string with WIB timezone
 */
export const getCurrentTimestampForDB = (): string => {
  const wibDate = getWIBDate();
  return wibDate.toISOString();
};

/**
 * Format time for display in Indonesian locale
 * @param timeString - Time string in HH:MM:SS format
 * @returns Formatted time string for display
 */
export const formatTimeForDisplay = (timeString: string): string => {
  if (!timeString || timeString === '00:00:00') {
    return '-';
  }
  return timeString.substring(0, 5); // Return HH:MM
};

/**
 * Check if time1 is after time2 (for late attendance logic)
 * @param time1 - Time string in HH:MM:SS format
 * @param time2 - Time string in HH:MM:SS format
 * @param toleranceMinutes - Tolerance in minutes (default: 15)
 * @returns boolean
 */
export const isLateAttendance = (
  currentTime: string, 
  startTime: string, 
  toleranceMinutes: number = 15
): boolean => {
  const [currentHour, currentMin, currentSec] = currentTime.split(':').map(Number);
  const [startHour, startMin, startSec] = startTime.split(':').map(Number);
  
  const currentTotalMinutes = currentHour * 60 + currentMin + currentSec / 60;
  const startTotalMinutes = startHour * 60 + startMin + startSec / 60;
  
  return currentTotalMinutes > (startTotalMinutes + toleranceMinutes);
};
