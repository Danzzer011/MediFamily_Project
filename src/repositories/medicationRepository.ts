import type { Medication, MedicationInput, MedicationStock } from '../models/Medication';
import { demoMedicationRepository } from './demo/demoMedicationRepository';

/**
 * Medication schedules (FR03) of one profile. Every operation acts as the
 * signed-in account and requires access to the profile. Updates and deletions
 * take the version that was loaded and throw `AppError('stale_record')` if the
 * medication has changed or been deleted since.
 */
export type MedicationRepository = {
  /** The profile's medications, sorted by name. */
  listMedications(profileId: string): Promise<Medication[]>;
  getMedication(medicationId: string): Promise<Medication>;
  createMedication(profileId: string, input: MedicationInput): Promise<Medication>;
  updateMedication(medicationId: string, expectedVersion: number, input: MedicationInput): Promise<Medication>;
  /** Removes the schedule and its stock fields. Prescriptions keep their written medicine list (FR04). */
  deleteMedication(medicationId: string, expectedVersion: number): Promise<void>;
  /**
   * FR06: saves the stock entered by hand, or stops tracking it (null).
   * Reminders never call this: stock only changes when a person updates it.
   */
  updateStock(medicationId: string, expectedVersion: number, stock: MedicationStock | null): Promise<Medication>;
};

// Phase 1: demonstration data. Replace with the Supabase adapter in Phase 2.
export const medicationRepository: MedicationRepository = demoMedicationRepository;
