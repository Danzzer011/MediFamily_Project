const PLAIN_NUMBER = /^\d{1,6}([.,]\d+)?$/;

// "72", "72.5" or "72,5" -> the number. Anything else gives null: 0x10, 1e3, -5, Infinity, 0 and empty text.
export function parsePositiveNumber(text: string): number | null {
  const trimmed = text.trim();
  if (!PLAIN_NUMBER.test(trimmed)) return null;
  const number = Number(trimmed.replace(',', '.'));
  return number > 0 ? number : null;
}
