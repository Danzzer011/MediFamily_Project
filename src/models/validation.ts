const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns a user-facing message for an invalid email, or null when it is acceptable. */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address, like name@example.com.';
  return null;
}
