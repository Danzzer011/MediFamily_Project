import type { IsoTimestamp } from './common';
import { formatIsoDate, isValidIsoDate } from './dates';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// Date as YYYY-MM-DD and time as HH:MM (24-hour). Returns a message, or null when both are fine.
export function validateDateTime(date: string, time: string): { date: string | null; time: string | null } {
  return {
    date: !date.trim() ? 'Enter the date.' : isValidIsoDate(date.trim()) ? null : 'Use the format YYYY-MM-DD, e.g. 2026-11-03.',
    time: !time.trim() ? 'Enter the time.' : TIME_PATTERN.test(time.trim()) ? null : 'Use the format HH:MM (24-hour), e.g. 14:30.',
  };
}

// "2026-11-03" + "14:30" (device local time) -> ISO timestamp. Call validateDateTime first.
export function toTimestamp(date: string, time: string): IsoTimestamp {
  const [year, month, day] = date.trim().split('-').map(Number);
  const [hour, minute] = time.trim().split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute).toISOString();
}

// ISO timestamp -> the two form fields, in device local time.
export function splitTimestamp(timestamp: IsoTimestamp): { date: string; time: string } {
  const d = new Date(timestamp);
  const two = (n: number) => String(n).padStart(2, '0');
  return { date: `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`, time: `${two(d.getHours())}:${two(d.getMinutes())}` };
}

// "3 Nov 2026, 14:30"
export function formatTimestamp(timestamp: IsoTimestamp): string {
  const { date, time } = splitTimestamp(timestamp);
  return `${formatIsoDate(date)}, ${time}`;
}
