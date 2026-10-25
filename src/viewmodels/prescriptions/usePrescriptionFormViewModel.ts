import { useEffect, useState } from 'react';

import { todayIsoDate } from '../../models/dates';
import { toAppError } from '../../models/errors';
import type { MedicalDocument, PickedFile } from '../../models/MedicalDocument';
import type { Medication } from '../../models/Medication';
import type { AttachmentChange, PrescriptionInput } from '../../models/Prescription';
import { validateDoctorName, validateSpeciality, validateVisitDate } from '../../models/validation';
import { medicationRepository } from '../../repositories/medicationRepository';
import { prescriptionRepository } from '../../repositories/prescriptionRepository';
import { choosePdf, chooseImage, takePhoto } from '../../services/filePickerService';

// One medicine row in the form. `key` is a stable id for React lists;
// `id` is set for medicines that were already saved on this prescription.
export type MedicineInput = {
  key: string;
  id?: string;
  name: string;
  instructions: string;
  medicationId: string | null;
};

let nextMedicineKey = 0;
function newMedicineRow(values: Partial<Omit<MedicineInput, 'key'>> = {}): MedicineInput {
  nextMedicineKey += 1;
  return { key: `medicine-${nextMedicineKey}`, name: '', instructions: '', medicationId: null, ...values };
}

export type AttachmentSource = 'camera' | 'image' | 'pdf';

// ViewModel for adding a prescription (no prescriptionId) or editing one (FR04),
// including its medicine list and optional image or PDF attachment.
export function usePrescriptionFormViewModel(profileId: string, prescriptionId?: string) {
  const isEditing = prescriptionId !== undefined;

  const [doctorName, setDoctorName] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [visitDate, setVisitDate] = useState(todayIsoDate());
  const [medicines, setMedicines] = useState<MedicineInput[]>(() => [newMedicineRow()]);
  const [version, setVersion] = useState(0); // the version we loaded, sent back when saving
  // the profile's schedules, so a prescribed medicine can be linked to one
  const [medicationOptions, setMedicationOptions] = useState<Medication[]>([]);

  // attachment: what is saved now, and what will happen to it on save
  const [savedAttachment, setSavedAttachment] = useState<MedicalDocument | null>(null);
  const [attachmentChange, setAttachmentChange] = useState<AttachmentChange>({ kind: 'keep' });
  const [pickingFile, setPickingFile] = useState(false);
  const [attachmentError, setAttachmentError] = useState('');

  const [doctorError, setDoctorError] = useState('');
  const [specialityError, setSpecialityError] = useState('');
  const [visitDateError, setVisitDateError] = useState('');
  const [medicineErrors, setMedicineErrors] = useState<Record<string, string>>({});
  const [medicinesError, setMedicinesError] = useState('');
  const [formError, setFormError] = useState('');
  const [staleRecord, setStaleRecord] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  // load the profile's medications, and when editing, fill the form with the saved prescription
  useEffect(() => {
    let active = true;
    Promise.all([
      medicationRepository.listMedications(profileId),
      prescriptionId ? prescriptionRepository.getPrescription(prescriptionId) : Promise.resolve(null),
    ])
      .then(([options, prescription]) => {
        if (!active) return;
        setLoadError('');
        setMedicationOptions(options);
        if (prescription) {
          setDoctorName(prescription.doctorName);
          setSpeciality(prescription.speciality);
          setVisitDate(prescription.visitDate);
          setMedicines(
            prescription.medicines.map((m) =>
              newMedicineRow({
                id: m.id,
                name: m.medicineName,
                instructions: m.dosageInstructions ?? '',
                // a link to a schedule that was removed is shown as "not linked"
                medicationId: options.some((o) => o.id === m.medicationId) ? m.medicationId : null,
              }),
            ),
          );
          setVersion(prescription.version);
          setSavedAttachment(prescription.attachment);
          setAttachmentChange({ kind: 'keep' });
          setMedicineErrors({});
          setStaleRecord(false);
          setFormError('');
        }
      })
      .catch((error) => active && setLoadError(toAppError(error).message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [profileId, prescriptionId, reloadCount]);

  function changeDoctorName(text: string) {
    setDoctorName(text);
    setDoctorError('');
    setFormError('');
  }

  function changeSpeciality(text: string) {
    setSpeciality(text);
    setSpecialityError('');
    setFormError('');
  }

  function changeVisitDate(text: string) {
    setVisitDate(text);
    setVisitDateError('');
    setFormError('');
  }

  function addMedicine() {
    setMedicines((current) => [...current, newMedicineRow()]);
    setMedicinesError('');
  }

  function removeMedicine(key: string) {
    setMedicines((current) => current.filter((m) => m.key !== key));
  }

  function changeMedicine(key: string, field: 'name' | 'instructions', text: string) {
    setMedicines((current) => current.map((m) => (m.key === key ? { ...m, [field]: text } : m)));
    if (field === 'name') setMedicineErrors((current) => ({ ...current, [key]: '' }));
    setFormError('');
  }

  function linkMedicine(key: string, medicationId: string | null) {
    setMedicines((current) => current.map((m) => (m.key === key ? { ...m, medicationId } : m)));
  }

  // the attachment the form shows: a newly picked file, the saved one, or nothing
  const attachmentPreview: PickedFile | null =
    attachmentChange.kind === 'replace'
      ? attachmentChange.file
      : attachmentChange.kind === 'keep' && savedAttachment
        ? { uri: savedAttachment.storagePath, fileName: savedAttachment.originalFileName, mimeType: savedAttachment.mimeType }
        : null;

  async function pickAttachment(source: AttachmentSource) {
    if (pickingFile) return;
    setPickingFile(true);
    setAttachmentError('');
    try {
      const file = source === 'camera' ? await takePhoto() : source === 'image' ? await chooseImage() : await choosePdf();
      if (file) setAttachmentChange({ kind: 'replace', file });
    } catch (error) {
      setAttachmentError(toAppError(error).message);
    }
    setPickingFile(false);
  }

  // unlinks the attachment; a saved document stays in the profile's medical documents
  function removeAttachment() {
    setAttachmentChange(savedAttachment ? { kind: 'remove' } : { kind: 'keep' });
    setAttachmentError('');
  }

  // throws away unsaved changes and loads the latest saved version
  function reloadLatest() {
    setLoading(true);
    setReloadCount((count) => count + 1);
  }

  // returns the saved prescription's id, or null if saving did not happen
  async function save(): Promise<string | null> {
    if (saving) return null;

    // 1. check the form
    const doctorProblem = validateDoctorName(doctorName) ?? '';
    const specialityProblem = validateSpeciality(speciality) ?? '';
    const dateProblem = validateVisitDate(visitDate) ?? '';
    const errors: Record<string, string> = {};
    for (const medicine of medicines) {
      if (!medicine.name.trim()) errors[medicine.key] = 'Enter the medicine name.';
    }
    const noMedicines = medicines.length === 0 ? 'Add at least one medicine.' : '';
    setDoctorError(doctorProblem);
    setSpecialityError(specialityProblem);
    setVisitDateError(dateProblem);
    setMedicineErrors(errors);
    setMedicinesError(noMedicines);
    setFormError('');
    if (doctorProblem || specialityProblem || dateProblem || noMedicines || Object.keys(errors).length > 0) {
      return null;
    }

    // 2. save the prescription and its medicine list together
    const input: PrescriptionInput = {
      doctorName: doctorName.trim(),
      speciality: speciality.trim(),
      visitDate: visitDate.trim(),
      medicines: medicines.map((m) => ({
        id: m.id,
        medicineName: m.name.trim(),
        dosageInstructions: m.instructions.trim() || null,
        medicationId: m.medicationId,
      })),
    };

    setSaving(true);
    try {
      const saved = prescriptionId
        ? await prescriptionRepository.updatePrescription(prescriptionId, version, input, attachmentChange)
        : await prescriptionRepository.createPrescription(
            profileId,
            input,
            attachmentChange.kind === 'replace' ? attachmentChange.file : null,
          );
      setSaving(false);
      return saved.id;
    } catch (error) {
      const appError = toAppError(error);
      setFormError(appError.message);
      setStaleRecord(appError.code === 'stale_record');
      setSaving(false);
      return null;
    }
  }

  return {
    isEditing,
    doctorName,
    speciality,
    visitDate,
    medicines,
    medicationOptions,
    attachmentPreview,
    pickingFile,
    attachmentError,
    doctorError,
    specialityError,
    visitDateError,
    medicineErrors,
    medicinesError,
    formError,
    staleRecord,
    loading,
    loadError,
    saving,
    changeDoctorName,
    changeSpeciality,
    changeVisitDate,
    addMedicine,
    removeMedicine,
    changeMedicine,
    linkMedicine,
    pickAttachment,
    removeAttachment,
    reloadLatest,
    save,
  };
}
