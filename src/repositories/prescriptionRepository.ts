import type { PickedFile } from '../models/MedicalDocument';
import type {
  AttachmentChange,
  Prescription,
  PrescriptionInput,
  PrescriptionWithAttachment,
} from '../models/Prescription';
import { demoPrescriptionRepository } from './demo/demoPrescriptionRepository';

/**
 * Prescriptions (FR04) of one profile. Every operation acts as the signed-in account
 * and requires access to the profile. Updates and deletions take the version that was
 * loaded and throw `AppError('stale_record')` if the prescription has changed since.
 * The prescription and its medicine list are always saved together.
 */
export type PrescriptionRepository = {
  /** The profile's prescriptions, newest visit first. */
  listPrescriptions(profileId: string): Promise<Prescription[]>;
  getPrescription(prescriptionId: string): Promise<PrescriptionWithAttachment>;
  /** A new attachment is stored once as a medical document and linked (FR07). */
  createPrescription(profileId: string, input: PrescriptionInput, attachment: PickedFile | null): Promise<Prescription>;
  updatePrescription(
    prescriptionId: string,
    expectedVersion: number,
    input: PrescriptionInput,
    attachment: AttachmentChange,
  ): Promise<Prescription>;
  /** Removes the prescription and its medicine list. Linked medications and documents stay. */
  deletePrescription(prescriptionId: string, expectedVersion: number): Promise<void>;
  /** Links one prescribed medicine to a medication schedule of the same profile. */
  linkMedication(
    prescriptionId: string,
    expectedVersion: number,
    medicineId: string,
    medicationId: string,
  ): Promise<Prescription>;
};

// Phase 1: demonstration data. Replace with the Supabase adapter in Phase 2.
export const prescriptionRepository: PrescriptionRepository = demoPrescriptionRepository;
