import { describe, expect, it } from '@jest/globals';

import { dayParts, daysUntil, formatTimestamp, splitTimestamp, toTimestamp, validateDateTime, zoneLabel } from './dateTime';

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
    expect(validateDateTime('', '  ')).toEqual({ date: 'Enter the date.', time: 'Enter the time, like 18:30.' });
  });

  it('rejects a time without a colon, like 630', () => {
    expect(validateDateTime('2026-11-03', '630').time).toBe('Enter the time, like 18:30.');
  });
});

describe('list helpers', () => {
  it('gives the day, month, weekday and time in the profile zone', () => {
    expect(dayParts('2026-11-05T16:30:00.000Z', 'Africa/Cairo')).toEqual({ day: '05', month: 'NOV', weekday: 'THU', year: '2026', time: '18:30' });
  });

  it('counts calendar days in the profile zone, not UTC', () => {
    // 22:30 UTC on 4 Nov is already 00:30 on 5 Nov in Cairo (UTC+2), so an appointment on 5 Nov is "today" there
    const now = new Date('2026-11-04T22:30:00.000Z');
    expect(daysUntil('2026-11-05T16:30:00.000Z', 'Africa/Cairo', now)).toBe(0);
    expect(daysUntil('2026-11-09T09:00:00.000Z', 'Africa/Cairo', now)).toBe(4);
    expect(daysUntil('2026-11-03T09:00:00.000Z', 'Africa/Cairo', now)).toBe(-2);
  });

  it('names the zone for the header', () => {
    expect(zoneLabel('Africa/Cairo')).toBe('Cairo time');
    expect(zoneLabel('America/New_York')).toBe('New York time');
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
