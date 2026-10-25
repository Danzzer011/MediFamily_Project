import type { IsoDate } from './common';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// Today's date on this device, as YYYY-MM-DD.
export function todayIsoDate(): IsoDate {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// True when the text is a real calendar date written as YYYY-MM-DD (e.g. 2024-02-30 is false).
export function isValidIsoDate(text: string): boolean {
  const match = ISO_DATE_PATTERN.exec(text);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// "1962-04-18" -> "18 Apr 1962". Returns the input unchanged if it is not a valid date.
export function formatIsoDate(date: IsoDate): string {
  if (!isValidIsoDate(date)) return date;
  const [year, month, day] = date.split('-');
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}
