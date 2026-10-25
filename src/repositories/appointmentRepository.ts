import type { Appointment, AppointmentInput } from '../models/Appointment';
import { demoAppointmentRepository } from './demo/demoAppointmentRepository';

/** Appointments of one profile (FR05). The caller must have access to the profile. */
export type AppointmentRepository = {
  /** Soonest first. */
  list(profileId: string): Promise<Appointment[]>;
  create(profileId: string, input: AppointmentInput): Promise<Appointment>;
  update(profileId: string, id: string, input: AppointmentInput): Promise<Appointment>;
  remove(profileId: string, id: string): Promise<void>;
};

// Phase 1: demonstration data. Replace with the Supabase adapter in Phase 2.
export const appointmentRepository: AppointmentRepository = demoAppointmentRepository;
