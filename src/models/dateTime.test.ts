import { describe, expect, it } from '@jest/globals';

import { formatTimestamp, splitTimestamp, toTimestamp, validateDateTime } from './dateTime';

describe('validateDateTime', () => {
  it('accepts a real date and a 24-hour time', () => {
    expect(validateDateTime('2026-11-03', '14:30')).toEqual({ date: null, time: null });
  });

  it('rejects an impossible date and time', () => {
    const result = validateDateTime('2026-13-40', '25:00');
    expect(result.date).not.toBeNull();
    expect(result.time).not.toBeNull();
  });

  it('asks for empty fields', () => {
    expect(validateDateTime('', '  ')).toEqual({ date: 'Enter the date.', time: 'Enter the time.' });
  });
});

describe('time zones', () => {
  it('turns local clock time into the right instant (Cairo: UTC+2 in winter, UTC+3 in summer)', () => {
    expect(toTimestamp('2026-11-03', '14:30', 'Africa/Cairo')).toBe('2026-11-03T12:30:00.000Z');
    expect(toTimestamp('2026-07-01', '12:00', 'Africa/Cairo')).toBe('2026-07-01T09:00:00.000Z');
  });

  it('shows the same instant on the same clock for every viewer of the profile', () => {
    const instant = '2026-11-03T12:30:00.000Z';
    expect(splitTimestamp(instant, 'Africa/Cairo')).toEqual({ date: '2026-11-03', time: '14:30' });
    expect(splitTimestamp(instant, 'Europe/Berlin')).toEqual({ date: '2026-11-03', time: '13:30' });
  });

  it('moves to the next day when the zone is ahead of UTC', () => {
    expect(splitTimestamp('2026-11-03T23:30:00.000Z', 'Africa/Cairo')).toEqual({ date: '2026-11-04', time: '01:30' });
  });

  it('gives back exactly what was typed (round trip), including midnight', () => {
    for (const zone of ['Africa/Cairo', 'Europe/Berlin', 'America/New_York', 'Asia/Tokyo', 'UTC']) {
      for (const [date, time] of [['2026-11-03', '14:30'], ['2026-07-15', '00:00'], ['2026-12-31', '23:59']]) {
        expect(splitTimestamp(toTimestamp(date, time, zone), zone)).toEqual({ date, time });
      }
    }
  });

  it('formats for display', () => {
    expect(formatTimestamp('2026-11-03T12:30:00.000Z', 'Africa/Cairo')).toBe('3 Nov 2026, 14:30');
  });
});
