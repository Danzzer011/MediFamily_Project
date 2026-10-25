import { useEffect, useState } from 'react';

import { normaliseDailyTime, todayIsoDate } from '../../models/dates';
import { toAppError } from '../../models/errors';
import type { MedicationInput } from '../../models/Medication';
import {
  validateDosageInstructions,
  validateMedicationName,
  validateReminderTime,
  validateTreatmentEnd,
  validateTreatmentStart,
} from '../../models/validation';
import { medicationRepository } from '../../repositories/medicationRepository';
import { prescriptionRepository } from '../../repositories/prescriptionRepository';

// One reminder time row in the form. `key` is a stable id for React lists.
export type TimeInput = { key: string; value: string };

let nextTimeKey = 0;
function newTimeRow(value = ''): TimeInput {
  nextTimeKey += 1;
  return { key: `time-${nextTimeKey}`, value };
}

// Details of a prescribed medicine, when a schedule is created from a prescription (FR04).
export type FromPrescription = {
  prescriptionId: string;
  prescriptionVersion: number;
  medicineId: string;
  name: string;
  dosage: string;
};

// ViewModel for adding a medication (no medicationId) or editing / removing one (FR03).
// With `fromPrescription`, the form starts with the prescribed medicine and links the new schedule to it.
export function useMedicationFormViewModel(
  profileId: string,
  medicationId?: string,
  fromPrescription?: FromPrescription,
) {
  const isEditing = medicationId !== undefined;

  const [name, setName] = useState(fromPrescription?.name ?? '');
  const [dosage, setDosage] = useState(fromPrescription?.dosage ?? '');
  const [times, setTimes] = useState<TimeInput[]>(() => [newTimeRow('08:00')]);
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [endDate, setEndDate] = useState('');
  const [version, setVersion] = useState(0); // the version we loaded, sent back when saving

  const [nameError, setNameError] = useState('');
  const [dosageError, setDosageError] = useState('');
  const [timeErrors, setTimeErrors] = useState<Record<string, string>>({});
  const [timesError, setTimesError] = useState('');
  const [startError, setStartError] = useState('');
  const [endError, setEndError] = useState('');
  const [formError, setFormError] = useState('');
  const [staleRecord, setStaleRecord] = useState(false);

  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // when editing, fill the form with the saved medication
  useEffect(() => {
    if (!medicationId) return;
    let active = true;
    medicationRepository
      .getMedication(medicationId)
      .then((medication) => {
        if (!active) return;
        setLoadError('');
        setName(medication.name);
        setDosage(medication.dosageInstructions);
        setTimes(medication.reminderTimes.map((time) => newTimeRow(time)));
        setStartDate(medication.treatmentStart);
        setEndDate(medication.treatmentEnd ?? '');
        setVersion(medication.version);
        setTimeErrors({});
        setStaleRecord(false);
        setFormError('');
      })
      .catch((error) => active && setLoadError(toAppError(error).message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [medicationId, reloadCount]);

  function changeName(text: string) {
    setName(text);
    setNameError('');
    setFormError('');
  }

  function changeDosage(text: string) {
    setDosage(text);
    setDosageError('');
    setFormError('');
  }

  function changeStartDate(text: string) {
    setStartDate(text);
    setStartError('');
    setEndError('');
    setFormError('');
  }

  function changeEndDate(text: string) {
    setEndDate(text);
    setEndError('');
    setFormError('');
  }

  function addTime() {
    setTimes((current) => [...current, newTimeRow()]);
    setTimesError('');
  }

  function removeTime(key: string) {
    setTimes((current) => current.filter((t) => t.key !== key));
  }

  function changeTime(key: string, text: string) {
    setTimes((current) => current.map((t) => (t.key === key ? { ...t, value: text } : t)));
    setTimeErrors((current) => ({ ...current, [key]: '' }));
    setFormError('');
  }

  // throws away unsaved changes and loads the latest saved version
  function reloadLatest() {
    setLoading(true);
    setReloadCount((count) => count + 1);
  }

  // returns true when saved
  async function save(): Promise<boolean> {
    if (saving) return false;

    // 1. check the form
    const nameProblem = validateMedicationName(name) ?? '';
    const dosageProblem = validateDosageInstructions(dosage) ?? '';
    const startProblem = validateTreatmentStart(startDate) ?? '';
    const endProblem = validateTreatmentEnd(startDate, endDate) ?? '';

    // each time must be HH:mm and appear only once ("8:00" and "08:00" are the same time)
    const normalised = times.map((t) => ({ ...t, value: normaliseDailyTime(t.value) }));
    const errors: Record<string, string> = {};
    const seen = new Set<string>();
    for (const time of normalised) {
      const problem = validateReminderTime(time.value);
      if (problem) errors[time.key] = problem;
      else if (seen.has(time.value)) errors[time.key] = 'This time is already in the list.';
      seen.add(time.value);
    }
    const noTimes = normalised.length === 0 ? 'Add at least one daily reminder time.' : '';

    setTimes(normalised);
    setNameError(nameProblem);
    setDosageError(dosageProblem);
    setStartError(startProblem);
    setEndError(endProblem);
    setTimeErrors(errors);
    setTimesError(noTimes);
    setFormError('');
    if (nameProblem || dosageProblem || startProblem || endProblem || noTimes || Object.keys(errors).length > 0) {
      return false;
    }

    // 2. save through the repository; a blank end date means "no end date" (null)
    const input: MedicationInput = {
      name: name.trim(),
      dosageInstructions: dosage.trim(),
      reminderTimes: normalised.map((t) => t.value),
      treatmentStart: startDate.trim(),
      treatmentEnd: endDate.trim() ? endDate.trim() : null,
    };

    setSaving(true);
    try {
      if (medicationId) {
        await medicationRepository.updateMedication(medicationId, version, input);
      } else {
        const created = await medicationRepository.createMedication(profileId, input);
        if (fromPrescription) {
          // The schedule is already saved, so a failed link is not treated as a failed save:
          // the prescription page shows the medicine as not linked, and it can be linked when editing.
          await prescriptionRepository
            .linkMedication(
              fromPrescription.prescriptionId,
              fromPrescription.prescriptionVersion,
              fromPrescription.medicineId,
              created.id,
            )
            .catch(() => undefined);
        }
      }
      setSaving(false);
      return true;
    } catch (error) {
      const appError = toAppError(error);
      setFormError(appError.message);
      setStaleRecord(appError.code === 'stale_record');
      setSaving(false);
      return false;
    }
  }

  function askToDelete() {
    setDeleteError('');
    setConfirmingDelete(true);
  }

  function cancelDelete() {
    setConfirmingDelete(false);
    setDeleteError('');
  }

  // returns true when the medication was removed
  async function confirmDelete(): Promise<boolean> {
    if (!medicationId || deleting) return false;
    setDeleting(true);
    setDeleteError('');
    try {
      await medicationRepository.deleteMedication(medicationId, version);
      setDeleting(false);
      setConfirmingDelete(false);
      return true;
    } catch (error) {
      const appError = toAppError(error);
      setDeleteError(
        appError.code === 'stale_record'
          ? 'This medication was changed or removed by someone else. Close this message and reload to see the latest version.'
          : appError.message,
      );
      setStaleRecord(appError.code === 'stale_record');
      setDeleting(false);
      return false;
    }
  }

  return {
    isEditing,
    name,
    dosage,
    times,
    startDate,
    endDate,
    nameError,
    dosageError,
    timeErrors,
    timesError,
    startError,
    endError,
    formError,
    staleRecord,
    loading,
    loadError,
    saving,
    confirmingDelete,
    deleting,
    deleteError,
    changeName,
    changeDosage,
    changeStartDate,
    changeEndDate,
    addTime,
    removeTime,
    changeTime,
    reloadLatest,
    save,
    askToDelete,
    cancelDelete,
    confirmDelete,
  };
}
