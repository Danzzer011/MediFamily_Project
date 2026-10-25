import { isValidDailyTime, isValidIsoDate, todayIsoDate } from './dates';
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

export const MAX_MEDICATION_NAME_LENGTH = 100;
export const MAX_DOSAGE_INSTRUCTIONS_LENGTH = 300;

// FR03: every medication needs a name.
export function validateMedicationName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter the medication name.';
  if (trimmed.length > MAX_MEDICATION_NAME_LENGTH) return `Use at most ${MAX_MEDICATION_NAME_LENGTH} characters.`;
  return null;
}

// FR03: dosage instructions are required, e.g. "1 tablet after meals".
export function validateDosageInstructions(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return 'Enter the dosage instructions.';
  if (trimmed.length > MAX_DOSAGE_INSTRUCTIONS_LENGTH) return `Use at most ${MAX_DOSAGE_INSTRUCTIONS_LENGTH} characters.`;
  return null;
}

// FR03: one daily reminder time, written as 24-hour HH:mm.
export function validateReminderTime(time: string): string | null {
  const trimmed = time.trim();
  if (!trimmed) return 'Enter a time.';
  if (!isValidDailyTime(trimmed)) return 'Use the 24-hour format HH:mm, e.g. 08:00 or 20:30.';
  return null;
}

// FR03: the treatment start date is required.
export function validateTreatmentStart(date: string): string | null {
  const trimmed = date.trim();
  if (!trimmed) return 'Enter the start date.';
  if (!isValidIsoDate(trimmed)) return 'Use the format YYYY-MM-DD, e.g. 2026-10-25.';
  return null;
}

// FR03: the end date is optional, but cannot be before the start date.
export function validateTreatmentEnd(start: string, end: string): string | null {
  const trimmed = end.trim();
  if (!trimmed) return null;
  if (!isValidIsoDate(trimmed)) return 'Use the format YYYY-MM-DD, or leave blank for no end date.';
  if (isValidIsoDate(start.trim()) && trimmed < start.trim()) return 'The end date cannot be before the start date.';
  return null;
}

const QUANTITY_PATTERN = /^\d+(\.\d+)?$/;
export const MAX_STOCK_UNIT_LENGTH = 30;

// FR06: a stock amount is a number that is zero or more, e.g. "30" or "12.5".
// Returns a message, or null when it is fine.
export function validateStockAmount(text: string, what: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return `Enter the ${what}.`;
  if (!QUANTITY_PATTERN.test(trimmed)) return `Enter the ${what} as a number of 0 or more, e.g. 30 or 12.5.`;
  return null;
}

// FR06: the unit shared by the quantity and the threshold, e.g. tablets or mL.
export function validateStockUnit(unit: string): string | null {
  const trimmed = unit.trim();
  if (!trimmed) return 'Enter the unit, e.g. tablets or mL.';
  if (trimmed.length > MAX_STOCK_UNIT_LENGTH) return `Use at most ${MAX_STOCK_UNIT_LENGTH} characters.`;
  return null;
}

export const MAX_DOCTOR_NAME_LENGTH = 100;
export const MAX_SPECIALITY_LENGTH = 100;

// FR04: the doctor's name is required, typed as text.
export function validateDoctorName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter the doctor’s name.';
  if (trimmed.length > MAX_DOCTOR_NAME_LENGTH) return `Use at most ${MAX_DOCTOR_NAME_LENGTH} characters.`;
  return null;
}

// FR04: the doctor's speciality is required, e.g. Cardiology.
export function validateSpeciality(speciality: string): string | null {
  const trimmed = speciality.trim();
  if (!trimmed) return 'Enter the speciality, e.g. Cardiology.';
  if (trimmed.length > MAX_SPECIALITY_LENGTH) return `Use at most ${MAX_SPECIALITY_LENGTH} characters.`;
  return null;
}

// FR04: the visit date is required and cannot be in the future.
export function validateVisitDate(date: string): string | null {
  const trimmed = date.trim();
  if (!trimmed) return 'Enter the visit date.';
  if (!isValidIsoDate(trimmed)) return 'Use the format YYYY-MM-DD, e.g. 2026-10-25.';
  if (trimmed > todayIsoDate()) return 'The visit date cannot be in the future.';
  return null;
}
