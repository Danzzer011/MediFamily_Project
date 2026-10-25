import { useEffect, useState } from 'react';

import { toAppError } from '../../models/errors';
import type { Medication } from '../../models/Medication';
import type { PrescriptionWithAttachment } from '../../models/Prescription';
import { medicationRepository } from '../../repositories/medicationRepository';
import { prescriptionRepository } from '../../repositories/prescriptionRepository';
import { useReloadOnFocus } from '../shared/useReloadOnFocus';

// ViewModel for one prescription's page (FR04): its details, medicines with their
// linked schedules, the attachment, and deleting it.
export function usePrescriptionDetailsViewModel(prescriptionId: string) {
  const { reloadKey, reload } = useReloadOnFocus();

  const [prescription, setPrescription] = useState<PrescriptionWithAttachment | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (reloadKey === 0) return;
    let active = true;
    prescriptionRepository
      .getPrescription(prescriptionId)
      .then(async (loaded) => {
        const profileMedications = await medicationRepository.listMedications(loaded.profileId);
        if (!active) return;
        setLoadError('');
        setPrescription(loaded);
        setMedications(profileMedications);
      })
      .catch((error) => {
        if (!active) return;
        setPrescription(null);
        setLoadError(toAppError(error).message);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [prescriptionId, reloadKey]);

  // the schedule a prescribed medicine is linked to, if it still exists
  function linkedMedication(medicationId: string | null): Medication | null {
    return medications.find((m) => m.id === medicationId) ?? null;
  }

  function askToDelete() {
    setDeleteError('');
    setConfirmingDelete(true);
  }

  function cancelDelete() {
    setConfirmingDelete(false);
    setDeleteError('');
  }

  // returns true when the prescription was deleted
  async function confirmDelete(): Promise<boolean> {
    if (!prescription || deleting) return false;
    setDeleting(true);
    setDeleteError('');
    try {
      await prescriptionRepository.deletePrescription(prescription.id, prescription.version);
      setDeleting(false);
      setConfirmingDelete(false);
      return true;
    } catch (error) {
      const appError = toAppError(error);
      setDeleteError(
        appError.code === 'stale_record'
          ? 'This prescription was changed by someone else. The latest version has been loaded — check it, then confirm again.'
          : appError.message,
      );
      setDeleting(false);
      if (appError.code === 'stale_record') reload();
      return false;
    }
  }

  return {
    prescription,
    loading,
    loadError,
    confirmingDelete,
    deleting,
    deleteError,
    linkedMedication,
    askToDelete,
    cancelDelete,
    confirmDelete,
  };
}
