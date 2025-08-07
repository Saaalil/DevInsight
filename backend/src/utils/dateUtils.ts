/**
 * Utility functions for date and time formatting
 */

/**
 * Format a date to YYYY-MM-DD
 * @param date The date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Format a date to a human-readable string (e.g., "Jan 1, 2023")
 * @param date The date to format
 * @returns Formatted date string
 */
export const formatDateReadable = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Get the date for n days ago
 * @param days Number of days to go back
 * @returns Date object for n days ago
 */
export const getDaysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

/**
 * Get the start of the current week (Sunday)
 * @returns Date object for the start of the current week
 */
export const getStartOfWeek = (): Date => {
  const date = new Date();
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Get the end of the current week (Saturday)
 * @returns Date object for the end of the current week
 */
export const getEndOfWeek = (): Date => {
  const date = new Date();
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  date.setDate(date.getDate() + (6 - day));
  date.setHours(23, 59, 59, 999);
  return date;
};

/**
 * Calculate the time difference in days between two dates
 * @param date1 First date
 * @param date2 Second date
 * @returns Number of days between the dates
 */
export const daysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const diffDays = Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  return diffDays;
};