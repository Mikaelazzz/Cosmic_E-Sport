// Time utilities for PostgreSQL compatibility

/**
 * Format Date object to PostgreSQL TIME format (HH:MM:SS)
 * @param date - Date object to format
 * @returns String in HH:MM:SS format
 */
export const formatTimeForPostgreSQL = (date: Date = new Date()): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
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
 * Get current time in PostgreSQL TIME format
 * @returns Current time as HH:MM:SS string
 */
export const getCurrentTimeForDB = (): string => {
  return formatTimeForPostgreSQL(new Date());
};

/**
 * Get current timestamp in PostgreSQL TIMESTAMP format
 * @returns Current timestamp as ISO string
 */
export const getCurrentTimestampForDB = (): string => {
  return formatTimestampForPostgreSQL(new Date());
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
