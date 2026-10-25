import { useEffect, useState } from 'react';

import { useSelectedProfile } from '../../context/SelectedProfileContext';
import { useSession } from '../../context/SessionContext';
import { toAppError } from '../../models/errors';
import { validateDateOfBirth, validateProfileName } from '../../models/validation';
import { profileRepository } from '../../repositories/profileRepository';

// ViewModel for creating a profile (no profileId) or editing one's name and date of birth (FR01).
export function useProfileFormViewModel(profileId?: string) {
  const isEditing = profileId !== undefined;
  const { account } = useSession();
  const { selectProfile } = useSelectedProfile();

  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [version, setVersion] = useState(0); // the version we loaded, sent back when saving
  const [nameError, setNameError] = useState('');
  const [dateError, setDateError] = useState('');
  const [formError, setFormError] = useState('');
  const [staleRecord, setStaleRecord] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  // when editing, fill the form with the saved profile
  useEffect(() => {
    if (!profileId) return;
    let active = true;
    profileRepository
      .getProfile(profileId)
      .then((profile) => {
        if (!active) return;
        setLoadError('');
        setName(profile.name);
        setDateOfBirth(profile.dateOfBirth);
        setVersion(profile.version);
        setStaleRecord(false);
        setFormError('');
      })
      .catch((error) => active && setLoadError(toAppError(error).message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [profileId, reloadCount]);

  function changeName(text: string) {
    setName(text);
    setNameError('');
    setFormError('');
  }

  function changeDateOfBirth(text: string) {
    setDateOfBirth(text);
    setDateError('');
    setFormError('');
  }

  // throws away unsaved changes and loads the latest saved version
  function reloadLatest() {
    setLoading(true);
    setReloadCount((count) => count + 1);
  }

  // returns the saved profile's id, or null if saving did not happen
  async function save(): Promise<string | null> {
    if (saving) return null;

    // 1. check the form
    const nameProblem = validateProfileName(name) ?? '';
    const dateProblem = validateDateOfBirth(dateOfBirth) ?? '';
    setNameError(nameProblem);
    setDateError(dateProblem);
    setFormError('');
    if (nameProblem || dateProblem) return null;

    // 2. save through the repository
    setSaving(true);
    const input = { name: name.trim(), dateOfBirth: dateOfBirth.trim() };
    try {
      const saved = profileId
        ? await profileRepository.updateBasicInfo(profileId, version, input)
        : await profileRepository.createProfile(input);
      // keep the selected profile up to date with the saved name and date of birth
      selectProfile({
        id: saved.id,
        name: saved.name,
        dateOfBirth: saved.dateOfBirth,
        isCreator: saved.creatorId === account?.id,
      });
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
    name,
    dateOfBirth,
    nameError,
    dateError,
    formError,
    staleRecord,
    loading,
    loadError,
    saving,
    changeName,
    changeDateOfBirth,
    reloadLatest,
    save,
  };
}
