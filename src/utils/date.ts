/**
 * Utility functions for handling date formatting and parsing
 * without timezone offset distortion (e.g. UTC shifting local dates).
 */

/**
 * Formats a local Date object into a `YYYY-MM-DD` string based on its local year, month, and day.
 * Unlike `date.toISOString().split('T')[0]`, this preserves the user's local calendar date.
 */
export function formatLocalDateToYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a `YYYY-MM-DD` date string into a local Date object at midnight (00:00:00) local time.
 * Standard `new Date('YYYY-MM-DD')` parses as UTC midnight, which causes date rollback
 * in negative UTC offsets or when converted to local time in some environments.
 */
export function parseLocalDateFromYMD(dateStr: string): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split('T')[0].split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!year || !month || !day) {
    return new Date(dateStr);
  }

  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) or Date object to Indonesian locale format (`id-ID`).
 */
export function formatIndonesianDate(
  dateInput: string | Date,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
): string {
  const dateObj =
    typeof dateInput === 'string'
      ? parseLocalDateFromYMD(dateInput)
      : dateInput;

  return dateObj.toLocaleDateString('id-ID', options);
}

/**
 * Formats an ISO/Date timestamp to Indonesian locale WITH time (hour/minute).
 * Berbeda dgn formatIndonesianDate: tak melalui parseLocalDateFromYMD,
 * sehingga komponen jam tetap akurat untuk nilai timestamp penuh.
 */
export function formatIndonesianDateTime(
  dateInput: string | Date,
): string {
  const dateObj =
    typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  return dateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
