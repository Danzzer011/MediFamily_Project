import { useEffect, useState } from 'react';

import { useSelectedProfile } from '../../context/SelectedProfileContext';
import { useSession } from '../../context/SessionContext';
import { toAppError } from '../../models/errors';
import type { FamilyProfile } from '../../models/FamilyProfile';
import { profileRepository } from '../../repositories/profileRepository';
import { clearProfileReminders } from '../../services/medicationReminders';
import { useReloadOnFocus } from '../shared/useReloadOnFocus';

// ViewModel for one profile's main page (FR01): shows the profile and handles deleting it.
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
