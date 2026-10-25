import type { IsoTimestamp, RecordMeta } from './common';

export const APPOINTMENT_STATUSES = ['scheduled', 'completed', 'cancelled', 'missed'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** What the user types in the appointment form (FR05). */
export type AppointmentInput = {
  doctorName: string;
  startsAt: IsoTimestamp;
  location: string | null;
  notes: string | null;
  /** Only the user changes this; a passed date never changes it automatically. */
  status: AppointmentStatus;
};

/** A follow-up visit is simply another, separate appointment. */
export type Appointment = RecordMeta & AppointmentInput & { profileId: string };
