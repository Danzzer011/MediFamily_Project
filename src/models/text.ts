// "lab report" -> "Lab report"
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const MAX_LOCATION_LENGTH = 100;
export const MAX_NOTES_LENGTH = 300;
export const MAX_DOCUMENT_TITLE_LENGTH = 100;

// A message when the text is longer than the limit, otherwise an empty text.
export function tooLongMessage(text: string, max: number): string {
  return text.trim().length > max ? `Use at most ${max} characters.` : '';
}

// "lab_report" -> "Lab report"
export function labelFor(value: string): string {
  return capitalize(value.replace(/_/g, ' '));
}
