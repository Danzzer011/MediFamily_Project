// DEMONSTRATION DATA — see demoDatabase.ts.
import { AppError } from '../../models/errors';
import type { MedicalDocument, PickedFile } from '../../models/MedicalDocument';
import type { Prescription, PrescriptionInput } from '../../models/Prescription';
import { validateDoctorName, validateSpeciality, validateVisitDate } from '../../models/validation';
import type { PrescriptionRepository } from '../prescriptionRepository';
import {
  demoRequest,
  demoTables,
  findAccessibleProfile,
  newDemoId,
  nowIso,
  removeWhere,
  requireDemoAccount,
} from './demoDatabase';

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf'];

// The backend checks the same rules as the form (database constraints in Phase 2).
function checkInput(profileId: string, input: PrescriptionInput): void {
  const problem =
    validateDoctorName(input.doctorName) ?? validateSpeciality(input.speciality) ?? validateVisitDate(input.visitDate);
  if (problem) throw new AppError('validation', problem);
  if (input.medicines.length === 0) throw new AppError('validation', 'Add at least one medicine.');
  if (input.medicines.some((m) => !m.medicineName.trim())) {
    throw new AppError('validation', 'Every medicine needs a name.');
  }
  // a link must point to a medication of the same profile
  for (const medicine of input.medicines) {
    if (
      medicine.medicationId !== null &&
      !demoTables.medications.some((m) => m.id === medicine.medicationId && m.profileId === profileId)
    ) {
      throw new AppError('stale_record', 'A linked medication no longer exists. Reload and choose again.');
    }
  }
}

function copyPrescription(prescription: Prescription): Prescription {
  return { ...prescription, medicines: prescription.medicines.map((m) => ({ ...m })) };
}

function medicinesFrom(input: PrescriptionInput): Prescription['medicines'] {
  return input.medicines.map((medicine, position) => ({
    id: medicine.id ?? newDemoId('prescription-medicine'),
    medicineName: medicine.medicineName.trim(),
    dosageInstructions: medicine.dosageInstructions?.trim() || null,
    medicationId: medicine.medicationId,
    position,
  }));
}

// Stores an attachment once as a medical document of the profile (FR07).
function storeAttachment(profileId: string, file: PickedFile, input: PrescriptionInput): MedicalDocument {
  if (!SUPPORTED_TYPES.includes(file.mimeType)) {
    throw new AppError('validation', 'Attach a photo (JPEG, PNG, HEIC or WebP) or a PDF.');
  }
  const time = nowIso();
  const document: MedicalDocument = {
    id: newDemoId('document'),
    version: 1,
    createdAt: time,
    updatedAt: time,
    profileId,
    title: `Prescription — ${input.doctorName.trim()}`,
    category: 'prescription',
    relevantDate: input.visitDate,
    storagePath: file.uri, // demo only: Phase 2 uploads the file to private storage
    originalFileName: file.fileName,
    mimeType: file.mimeType,
  };
  demoTables.documents.push(document);
  return document;
}

/** Finds a prescription for a versioned change, as the backend's atomic version check would. */
function findCurrentPrescription(prescriptionId: string, expectedVersion: number): Prescription {
  const account = requireDemoAccount();
  const prescription = demoTables.prescriptions.find((p) => p.id === prescriptionId);
  if (!prescription) throw new AppError('stale_record');
  findAccessibleProfile(prescription.profileId, account.id);
  if (prescription.version !== expectedVersion) throw new AppError('stale_record');
  return prescription;
}

export const demoPrescriptionRepository: PrescriptionRepository = {
  async listPrescriptions(profileId) {
    await demoRequest('read');
    const account = requireDemoAccount();
    findAccessibleProfile(profileId, account.id);
    return demoTables.prescriptions
      .filter((p) => p.profileId === profileId)
      .sort((a, b) => b.visitDate.localeCompare(a.visitDate))
      .map(copyPrescription);
  },

  async getPrescription(prescriptionId) {
    await demoRequest('read');
    const account = requireDemoAccount();
    const prescription = demoTables.prescriptions.find((p) => p.id === prescriptionId);
    if (!prescription) throw new AppError('not_found');
    findAccessibleProfile(prescription.profileId, account.id);
    const attachment = demoTables.documents.find((d) => d.id === prescription.attachmentDocumentId) ?? null;
    return { ...copyPrescription(prescription), attachment: attachment ? { ...attachment } : null };
  },

  async createPrescription(profileId, input, attachment) {
    await demoRequest('write');
    const account = requireDemoAccount();
    findAccessibleProfile(profileId, account.id);
    checkInput(profileId, input);
    const document = attachment ? storeAttachment(profileId, attachment, input) : null;
    const time = nowIso();
    const prescription: Prescription = {
      id: newDemoId('prescription'),
      version: 1,
      createdAt: time,
      updatedAt: time,
      profileId,
      doctorName: input.doctorName.trim(),
      speciality: input.speciality.trim(),
      visitDate: input.visitDate,
      medicines: medicinesFrom(input),
      attachmentDocumentId: document?.id ?? null,
    };
    demoTables.prescriptions.push(prescription);
    return copyPrescription(prescription);
  },

  async updatePrescription(prescriptionId, expectedVersion, input, attachment) {
    await demoRequest('write');
    const prescription = findCurrentPrescription(prescriptionId, expectedVersion);
    checkInput(prescription.profileId, input);
    let attachmentDocumentId = prescription.attachmentDocumentId;
    if (attachment.kind === 'remove') attachmentDocumentId = null;
    if (attachment.kind === 'replace') {
      attachmentDocumentId = storeAttachment(prescription.profileId, attachment.file, input).id;
    }
    Object.assign(prescription, {
      doctorName: input.doctorName.trim(),
      speciality: input.speciality.trim(),
      visitDate: input.visitDate,
      medicines: medicinesFrom(input),
      attachmentDocumentId,
      version: prescription.version + 1,
      updatedAt: nowIso(),
    });
    return copyPrescription(prescription);
  },

  async deletePrescription(prescriptionId, expectedVersion) {
    await demoRequest('write');
    findCurrentPrescription(prescriptionId, expectedVersion);
    // the attached document and the linked medication schedules are kept
    removeWhere(demoTables.prescriptions, (p) => p.id === prescriptionId);
  },

  async linkMedication(prescriptionId, expectedVersion, medicineId, medicationId) {
    await demoRequest('write');
    const prescription = findCurrentPrescription(prescriptionId, expectedVersion);
    const medicine = prescription.medicines.find((m) => m.id === medicineId);
    if (!medicine) throw new AppError('stale_record');
    if (!demoTables.medications.some((m) => m.id === medicationId && m.profileId === prescription.profileId)) {
      throw new AppError('not_found', 'This medication no longer exists.');
    }
    medicine.medicationId = medicationId;
    prescription.version += 1;
    prescription.updatedAt = nowIso();
    return copyPrescription(prescription);
  },
};
