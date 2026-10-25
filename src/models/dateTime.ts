import type { IsoTimestamp } from './common';
import { formatIsoDate, isValidIsoDate } from './dates';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// Date as YYYY-MM-DD and time as HH:MM (24-hour). Returns a message, or null when both are fine.
export function validateDateTime(date: string, time: string): { date: string | null; time: string | null } {
  return {
    date: !date.trim() ? 'Enter the date.' : isValidIsoDate(date.trim()) ? null : 'Use the format YYYY-MM-DD, e.g. 2026-11-03.',
    time: TIME_PATTERN.test(time.trim()) ? null : 'Enter the time, like 18:30.',
  };
}

// The clock and calendar numbers a moment has in a time zone such as 'Africa/Cairo'.
function wallClock(ms: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(ms));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') % 24, minute: get('minute'), second: get('second') };
}

// How far ahead of UTC the time zone is at that moment, in milliseconds (changes with daylight saving).
function offsetMs(ms: number, timeZone: string): number {
  const w = wallClock(ms, timeZone);
  return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second) - Math.floor(ms / 1000) * 1000;
}

// "2026-11-03" + "14:30" as written in the profile's time zone -> ISO timestamp. Call validateDateTime first.
export function toTimestamp(date: string, time: string, timeZone: string): IsoTimestamp {
  const [year, month, day] = date.trim().split('-').map(Number);
  const [hour, minute] = time.trim().split(':').map(Number);
  const wanted = Date.UTC(year, month - 1, day, hour, minute);
  // the offset at the real moment can differ from the offset at `wanted` (daylight saving), so correct once
  const guess = wanted - offsetMs(wanted, timeZone);
  return new Date(wanted - offsetMs(guess, timeZone)).toISOString();
}

// ISO timestamp -> the two form fields, as shown in the profile's time zone.
export function splitTimestamp(timestamp: IsoTimestamp, timeZone: string): { date: string; time: string } {
  const w = wallClock(new Date(timestamp).getTime(), timeZone);
  const two = (n: number) => String(n).padStart(2, '0');
  return { date: `${w.year}-${two(w.month)}-${two(w.day)}`, time: `${two(w.hour)}:${two(w.minute)}` };
}

// "3 Nov 2026, 14:30" in the profile's time zone.
export function formatTimestamp(timestamp: IsoTimestamp, timeZone: string): string {
  const { date, time } = splitTimestamp(timestamp, timeZone);
  return `${formatIsoDate(date)}, ${time}`;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// The pieces a list row shows ("05", "NOV", "THU", "18:30"), read in the profile's time zone.
export function dayParts(timestamp: IsoTimestamp, timeZone: string) {
  const { date, time } = splitTimestamp(timestamp, timeZone);
  const [year, month, day] = date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return { day: String(day).padStart(2, '0'), month: MONTHS[month - 1], weekday, year: String(year), time };
}

// Whole calendar days from today to that moment (0 = today), both read in the profile's time zone.
export function daysUntil(timestamp: IsoTimestamp, timeZone: string, now: Date = new Date()): number {
  const midnight = (iso: string) => {
    const [y, m, d] = splitTimestamp(iso, timeZone).date.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((midnight(timestamp) - midnight(now.toISOString())) / 86400000);
}

// "Africa/Cairo" -> "Cairo time"
export function zoneLabel(timeZone: string): string {
  return `${(timeZone.split('/').pop() ?? timeZone).replace(/_/g, ' ')} time`;
}
