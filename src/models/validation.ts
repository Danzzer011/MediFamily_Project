import { isValidIsoDate, todayIsoDate } from './dates';
import type { EmergencyContact } from './FamilyProfile';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s\-()]+$/;

// Same as the Supabase Auth default minimum, so the rule stays the same in Phase 2.
export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PROFILE_NAME_LENGTH = 80;

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

// FR01: every profile needs a name.
export function validateProfileName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter a name.';
  if (trimmed.length > MAX_PROFILE_NAME_LENGTH) return `Use at most ${MAX_PROFILE_NAME_LENGTH} characters.`;
  return null;
}

// FR01: date of birth is required, written as YYYY-MM-DD, and cannot be in the future.
export function validateDateOfBirth(date: string): string | null {
  const trimmed = date.trim();
  if (!trimmed) return 'Enter the date of birth.';
  if (!isValidIsoDate(trimmed)) return 'Use the format YYYY-MM-DD, e.g. 1980-05-31.';
  if (trimmed > todayIsoDate()) return 'The date of birth cannot be in the future.';
  if (trimmed < '1900-01-01') return 'Enter a date from 1900 onwards.';
  return null;
}

// FR02: a phone number keeps its + and leading zeroes, so it is stored as text.
export function validatePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return 'Enter a telephone number.';
  const digits = trimmed.replace(/\D/g, '');
  if (!PHONE_PATTERN.test(trimmed) || digits.length < 6 || digits.length > 15) {
    return 'Enter a valid telephone number, e.g. +20 100 123 4567.';
  }
  return null;
}

// FR02: each emergency contact needs both a name and a telephone number.
export function validateEmergencyContact(contact: EmergencyContact): { name: string | null; phone: string | null } {
  return {
    name: contact.name.trim() ? null : 'Enter the contact’s name.',
    phone: validatePhone(contact.phone),
  };
}

// FR02: blank optional text is saved as null ("not recorded"), never as "none".
export function toOptionalText(text: string): string | null {
  const trimmed = text.trim();
  return trimmed ? trimmed : null;
}
