import type { IsoDate, RecordMeta } from './common';
import type { MedicalDocument, PickedFile } from './MedicalDocument';

/**
 * One medicine as written on a prescription (FR04). The name and instructions are a
 * snapshot: editing or removing a linked medication schedule never rewrites them.
 */
export type PrescriptionMedicine = {
  id: string;
  medicineName: string;
  dosageInstructions: string | null;
  /** Optional link to a medication schedule of the same profile. */
  medicationId: string | null;
  position: number;
};

/** A prescription record (FR04). It always lists at least one medicine. */
export type Prescription = RecordMeta & {
  profileId: string;
  doctorName: string;
  speciality: string;
  visitDate: IsoDate;
  medicines: PrescriptionMedicine[];
  /** Optional link to one medical document (image or PDF) of the same profile. */
  attachmentDocumentId: string | null;
};

/** A prescription together with its attached document, as shown on its page. */
export type PrescriptionWithAttachment = Prescription & {
  attachment: MedicalDocument | null;
};

/** One medicine row in the form. Rows that already exist keep their `id`. */
export type PrescriptionMedicineInput = {
  id?: string;
  medicineName: string;
  dosageInstructions: string | null;
  medicationId: string | null;
};

/** Prescription fields that authorised users create and edit (FR04). */
export type PrescriptionInput = {
  doctorName: string;
  speciality: string;
  visitDate: IsoDate;
  medicines: PrescriptionMedicineInput[];
};

/**
 * What to do with the attachment when saving. Removing only unlinks it: the document
 * itself stays in the profile's medical documents (FR04, FR07).
 */
export type AttachmentChange = { kind: 'keep' } | { kind: 'remove' } | { kind: 'replace'; file: PickedFile };
