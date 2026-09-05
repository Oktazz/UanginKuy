import { describe, expect, it } from 'vitest';
import {
  formatLocalDateToYMD,
  parseLocalDateFromYMD,
  formatIndonesianDate,
} from '@/utils/date';

describe('Date Utilities (Timezone Safe)', () => {
  describe('formatLocalDateToYMD', () => {
    it('formats Saturday September 12, 2026 at midnight to "2026-09-12" regardless of UTC offset', () => {
      // Month is 0-indexed: 8 = September
      const date = new Date(2026, 8, 12, 0, 0, 0, 0);
      const formatted = formatLocalDateToYMD(date);

      expect(formatted).toBe('2026-09-12');
    });

    it('correctly pads single-digit months and days with leading zeros', () => {
      const date = new Date(2026, 0, 5, 0, 0, 0, 0); // Jan 5, 2026
      const formatted = formatLocalDateToYMD(date);

      expect(formatted).toBe('2026-01-05');
    });

    it('correctly formats the end of year date', () => {
      const date = new Date(2026, 11, 31, 23, 59, 59); // Dec 31, 2026
      const formatted = formatLocalDateToYMD(date);

      expect(formatted).toBe('2026-12-31');
    });
  });

  describe('parseLocalDateFromYMD', () => {
    it('parses "2026-09-12" to Saturday September 12, 2026 in local time', () => {
      const parsed = parseLocalDateFromYMD('2026-09-12');

      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(8); // September (0-indexed)
      expect(parsed.getDate()).toBe(12);
      expect(parsed.getDay()).toBe(6); // Saturday (0 = Sunday, 6 = Saturday)
      expect(parsed.getHours()).toBe(0);
      expect(parsed.getMinutes()).toBe(0);
    });

    it('parses ISO date string with T by extracting the date part', () => {
      const parsed = parseLocalDateFromYMD('2026-09-12T10:30:00.000Z');

      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(8);
      expect(parsed.getDate()).toBe(12);
    });

    it('falls back gracefully to standard Date constructor if format is unexpected', () => {
      const parsed = parseLocalDateFromYMD('invalid-date');
      expect(isNaN(parsed.getTime())).toBe(true);
    });
  });

  describe('formatIndonesianDate', () => {
    it('formats "2026-09-12" to Indonesian locale string with day name', () => {
      const formatted = formatIndonesianDate('2026-09-12');

      expect(formatted).toContain('Sabtu');
      expect(formatted).toContain('12');
      expect(formatted).toContain('September');
      expect(formatted).toContain('2026');
    });

    it('accepts custom Intl.DateTimeFormatOptions', () => {
      const formatted = formatIndonesianDate('2026-09-12', {
        weekday: 'long',
      });

      expect(formatted).toBe('Sabtu');
    });

    it('formats a Date object directly', () => {
      const date = new Date(2026, 8, 12, 0, 0, 0, 0);
      const formatted = formatIndonesianDate(date, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      expect(formatted).toContain('12');
      expect(formatted).toContain('Sep');
      expect(formatted).toContain('2026');
    });
  });
});
