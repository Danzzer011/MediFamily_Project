import type { IsoDate, RecordMeta } from './common';

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

export type EmergencyContact = {
  name: string;
  /** Text, to keep leading zeroes and +country codes. */
  phone: string;
};

/**
 * Health information (FR02), stored on the profile row.
 * `null` means unspecified — never "none". An empty allergies or
 * conditions value must not be shown as "no allergies".
 */
export type HealthInformation = {
  bloodType: BloodType | null;
  allergies: string | null;
  medicalConditions: string | null;
  pastSurgeries: string | null;
  emergencyContacts: EmergencyContact[];
};

/** A family health profile (FR01) together with its health information (FR02). */
export type FamilyProfile = RecordMeta & HealthInformation & {
  creatorId: string;
  name: string;
  dateOfBirth: IsoDate;
  /** Set once from the creator's device when the profile is created. */
  timeZone: string;
};

/** Basic profile fields that authorised users create and edit. */
export type ProfileBasicInput = {
  name: string;
  dateOfBirth: IsoDate;
};

/** A profile the signed-in account can open, as shown on the selection screen. */
export type ProfileSummary = {
  id: string;
  name: string;
  dateOfBirth: IsoDate;
  /** Whether the signed-in account created this profile (controls invitations and deletion). */
  isCreator: boolean;
};
