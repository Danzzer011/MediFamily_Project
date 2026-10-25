const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same as the Supabase Auth default minimum, so the rule stays the same in Phase 2.
export const MIN_PASSWORD_LENGTH = 6;

// Returns a message for an invalid email, or null when it is fine.
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address, like name@example.com.';
  return null;
}

// Password rule for new accounts. Returns a message, or null when it is fine.
export function validateNewPassword(password: string): string | null {
  if (!password) return 'Enter a password.';
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  return null;
}
