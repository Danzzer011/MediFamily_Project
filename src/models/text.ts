// "lab report" -> "Lab report"
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// "lab_report" -> "Lab report"
export function labelFor(value: string): string {
  return capitalize(value.replace(/_/g, ' '));
}
