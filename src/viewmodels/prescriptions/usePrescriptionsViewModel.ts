import { useEffect, useState } from 'react';

import { toAppError } from '../../models/errors';
import type { Prescription } from '../../models/Prescription';
import { prescriptionRepository } from '../../repositories/prescriptionRepository';
import { profileRepository } from '../../repositories/profileRepository';
import { useReloadOnFocus } from '../shared/useReloadOnFocus';

// ViewModel for a profile's prescription list (FR04), newest visit first.
export function usePrescriptionsViewModel(profileId: string) {
  const { reloadKey, reload } = useReloadOnFocus();

  const [profileName, setProfileName] = useState('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (reloadKey === 0) return;
    let active = true;
    Promise.all([profileRepository.getProfile(profileId), prescriptionRepository.listPrescriptions(profileId)])
      .then(([profile, loaded]) => {
        if (!active) return;
        setLoadError('');
        setProfileName(profile.name);
        setPrescriptions(loaded);
      })
      .catch((error) => {
        if (!active) return;
        setPrescriptions([]);
        setLoadError(toAppError(error).message);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [profileId, reloadKey]);

  return { profileName, prescriptions, loading, loadError, reload };
}
