import { useEffect, useState } from 'react';

import { useSelectedProfile } from '../../context/SelectedProfileContext';
import { useSession } from '../../context/SessionContext';
import { toAppError } from '../../models/errors';
import type { FamilyProfile } from '../../models/FamilyProfile';
import { dayParts } from '../../models/dateTime';
import { needsRefill, stockOf, treatmentStatus } from '../../models/Medication';
import { capitalize } from '../../models/text';
import { appointmentRepository } from '../../repositories/appointmentRepository';
import { documentRepository } from '../../repositories/documentRepository';
import { measurementRepository } from '../../repositories/measurementRepository';
import { medicationRepository } from '../../repositories/medicationRepository';
import { prescriptionRepository } from '../../repositories/prescriptionRepository';
import { profileRepository } from '../../repositories/profileRepository';
import { sharingRepository } from '../../repositories/sharingRepository';
import { clearProfileReminders } from '../../services/medicationReminders';
import { useReloadOnFocus } from '../shared/useReloadOnFocus';

// One short line per menu tile, e.g. "3 active" or "Next: 5 Nov".
export type TileLines = {
  medications: string;
  stock: string;
  prescriptions: string;
  appointments: string;
  documents: string;
  measurements: string;
  sharing: string;
  /** True while at least one medication shows the refill alert (FR06). */
  lowStock: boolean;
};

// "1 file", "6 files", "None yet"
function countText(count: number, one: string, many: string): string {
  if (count === 0) return 'None yet';
  return `${count} ${count === 1 ? one : many}`;
}

// ViewModel for one profile's main page (FR01): shows the profile and handles deleting it.
// It also reads a one-line summary for each feature tile; it never changes any record.
export function useProfileDetailsViewModel(profileId: string) {
  const { account } = useSession();
  const { selectProfile, clearSelectedProfile } = useSelectedProfile();
  const { reloadKey, reload } = useReloadOnFocus();

  const [profile, setProfile] = useState<FamilyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [tileLines, setTileLines] = useState<TileLines | null>(null);

  const isCreator = profile !== null && profile.creatorId === account?.id;

  useEffect(() => {
    if (reloadKey === 0) return;
    let active = true;
    profileRepository
      .getProfile(profileId)
      .then((loaded) => {
        if (!active) return;
        setLoadError('');
        setProfile(loaded);
        // opening a profile makes it the selected profile for the other pages
        selectProfile({
          id: loaded.id,
          name: loaded.name,
          dateOfBirth: loaded.dateOfBirth,
          isCreator: loaded.creatorId === account?.id,
        });
      })
      .catch((error) => {
        if (!active) return;
        setProfile(null);
        setLoadError(toAppError(error).message);
        clearSelectedProfile(); // no access any more (deleted, revoked or left)
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [profileId, reloadKey, account?.id, selectProfile, clearSelectedProfile]);

  // The small live line on each menu tile. It only reads saved records, and if one of them
  // cannot be loaded the tiles simply show no line: the page itself still works.
  useEffect(() => {
    if (reloadKey === 0) return;
    let active = true;
    Promise.all([
      medicationRepository.listMedications(profileId),
      prescriptionRepository.listPrescriptions(profileId),
      appointmentRepository.list(profileId),
      documentRepository.list(profileId),
      measurementRepository.list(profileId),
      sharingRepository.listMembers(profileId),
    ])
      .then(([medications, prescriptions, appointments, documents, measurements, members]) => {
        if (!active) return;
        const zone = profile?.timeZone ?? 'UTC';
        const nowIso = new Date().toISOString();
        const next = appointments.find((a) => a.startsAt >= nowIso && a.status === 'scheduled');
        const nextDay = next ? dayParts(next.startsAt, zone) : null;
        const activeCount = medications.filter((m) => treatmentStatus(m) === 'active').length;
        const low = medications.filter(needsRefill).length;
        const tracked = medications.filter((m) => stockOf(m) !== null).length;
        const latest = measurements[0];
        setTileLines({
          medications: medications.length === 0 ? 'None yet' : `${activeCount} active`,
          stock: low > 0 ? `${low} low` : tracked > 0 ? 'No refill needed' : 'Not tracked yet',
          prescriptions: countText(prescriptions.length, 'saved', 'saved'),
          appointments: nextDay ? `Next: ${Number(nextDay.day)} ${capitalize(nextDay.month.toLowerCase())}` : 'Nothing booked',
          documents: countText(documents.length, 'file', 'files'),
          measurements: latest ? `Latest ${latest.type === 'blood pressure' ? `${latest.value}/${latest.diastolic}` : latest.value}` : 'No readings yet',
          sharing: members.length === 0 ? 'Not shared yet' : `Shared with ${members.length}`,
          lowStock: low > 0,
        });
      })
      .catch(() => active && setTileLines(null));
    return () => {
      active = false;
    };
  }, [profileId, reloadKey, profile?.timeZone]);

  function askToDelete() {
    setDeleteError('');
    setConfirmingDelete(true);
  }

  function cancelDelete() {
    setConfirmingDelete(false);
    setDeleteError('');
  }

  // returns true when the profile was deleted
  async function confirmDelete(): Promise<boolean> {
    if (!profile || deleting) return false;
    setDeleting(true);
    setDeleteError('');
    try {
      await profileRepository.deleteProfile(profile.id, profile.version);
      if (account) clearProfileReminders(account.id, profile.id).catch(() => undefined);
      clearSelectedProfile();
      setDeleting(false);
      setConfirmingDelete(false);
      return true;
    } catch (error) {
      const appError = toAppError(error);
      setDeleteError(
        appError.code === 'stale_record'
          ? 'This profile was changed by someone else. The latest version has been loaded — check it, then confirm again.'
          : appError.message,
      );
      setDeleting(false);
      if (appError.code === 'stale_record') reload();
      return false;
    }
  }

  return {
    profile,
    isCreator,
    tileLines,
    loading,
    loadError,
    confirmingDelete,
    deleting,
    deleteError,
    reload,
    askToDelete,
    cancelDelete,
    confirmDelete,
  };
}
