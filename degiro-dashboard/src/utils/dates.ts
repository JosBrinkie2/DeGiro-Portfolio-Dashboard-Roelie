import { format, getQuarter, getYear, endOfQuarter, eachQuarterOfInterval, startOfDay } from 'date-fns';

/**
 * Parse a Dutch date string (DD-MM-YYYY) to a Date object.
 */
export function parseDutchDate(raw: string): Date {
  if (!raw || raw.trim() === '') return new Date(0);
  const parts = raw.trim().split('-');
  if (parts.length !== 3) return new Date(0);
  const [day, month, year] = parts;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

/**
 * Format a date as "DD-MM-YYYY".
 */
export function formatDutchDate(date: Date): string {
  return format(date, 'dd-MM-yyyy');
}

/**
 * Get a quarter label like "Q2 2024".
 */
export function formatQuarter(date: Date): string {
  return `Q${getQuarter(date)} ${getYear(date)}`;
}

/**
 * Get all quarter-end dates between two dates.
 */
export function getQuarterEndDates(from: Date, to: Date): Date[] {
  if (from >= to) return [];
  const quarters = eachQuarterOfInterval({ start: from, end: to });
  return quarters.map((q) => endOfQuarter(q));
}

/**
 * Get the bi-monthly bucket key for a date.
 * Returns a string like "2024-B2" (0-indexed, 2 months per bucket).
 */
export function getBiMonthlyKey(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const bucket = Math.floor(month / 2); // 0-5
  return `${year}-B${bucket}`;
}

/**
 * Get a human-readable label for a bi-monthly bucket key.
 * "2024-B2" → "Mei-Jun 2024"
 */
export function getBiMonthlyLabel(key: string): string {
  const [year, bucket] = key.split('-B');
  const b = Number(bucket);
  const monthNames = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
  const m1 = monthNames[b * 2];
  const m2 = monthNames[b * 2 + 1];
  return `${m1}-${m2} ${year}`;
}

export { startOfDay };
