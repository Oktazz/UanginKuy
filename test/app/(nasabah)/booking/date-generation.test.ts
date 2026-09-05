import { describe, expect, it } from 'vitest';
import { formatLocalDateToYMD } from '@/utils/date';

describe('Booking Page Date Generation Logic', () => {
  it('generates dateStr matching the local calendar date for Saturday September 12, 2026', () => {
    // Simulate what BookingPage does when generating availableDates
    const schedules = [
      { id: 10, day_of_week: 6, is_active: true }, // Saturday
      { id: 11, day_of_week: 5, is_active: true }, // Friday
    ];

    // Suppose today is Friday, September 11, 2026 at midnight local time
    const today = new Date(2026, 8, 11, 0, 0, 0, 0);

    const dates: { date: Date; dateStr: string; scheduleId: number }[] = [];
    const d = new Date(today);
    d.setDate(d.getDate() + 1); // Starts from tomorrow: Saturday, Sept 12

    for (let i = 0; i < 7; i++) {
      const currentDayOfWeek = d.getDay();
      const matchingSchedule = schedules.find(
        (s) => s.day_of_week === currentDayOfWeek
      );
      if (matchingSchedule) {
        dates.push({
          date: new Date(d),
          dateStr: formatLocalDateToYMD(d),
          scheduleId: matchingSchedule.id,
        });
      }
      d.setDate(d.getDate() + 1);
    }

    const saturdayOption = dates.find((item) => item.scheduleId === 10);
    expect(saturdayOption).toBeDefined();

    // The dateStr MUST be 2026-09-12 and NOT 2026-09-11
    expect(saturdayOption?.dateStr).toBe('2026-09-12');

    // And the display strings in Indonesian must also match
    expect(
      saturdayOption?.date.toLocaleDateString('id-ID', { weekday: 'long' })
    ).toBe('Sabtu');
    expect(
      saturdayOption?.date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    ).toContain('12');
  });
});
