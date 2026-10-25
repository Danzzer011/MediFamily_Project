import { useEffect, useState } from 'react';

import { toAppError } from '../../models/errors';
import { needsRefill, type Medication } from '../../models/Medication';
import { medicationRepository } from '../../repositories/medicationRepository';
import { profileRepository } from '../../repositories/profileRepository';
import { useReloadOnFocus } from '../shared/useReloadOnFocus';

// ViewModel for the Medicine Stock page (FR06): every medication's saved stock,
// with in-app refill alerts for those at or below their threshold.
export function useStockViewModel(profileId: string) {
  const { reloadKey, reload } = useReloadOnFocus();

  const [profileName, setProfileName] = useState('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (reloadKey === 0) return;
    let active = true;
    Promise.all([profileRepository.getProfile(profileId), medicationRepository.listMedications(profileId)])
      .then(([profile, loaded]) => {
        if (!active) return;
        setLoadError('');
        setProfileName(profile.name);
        setMedications(loaded);
      })
      .catch((error) => {
        if (!active) return;
        setMedications([]);
        setLoadError(toAppError(error).message);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [profileId, reloadKey]);

  // the alerts are worked out from the saved values every time, so they clear by themselves
  const refillAlerts = medications.filter(needsRefill);

  return { profileName, medications, refillAlerts, loading, loadError, reload };
}
