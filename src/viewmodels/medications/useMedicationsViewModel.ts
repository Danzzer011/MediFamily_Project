import { useEffect, useState } from 'react';

import { useSession } from '../../context/SessionContext';
import { toAppError } from '../../models/errors';
import type { Medication } from '../../models/Medication';
import { medicationRepository } from '../../repositories/medicationRepository';
import { profileRepository } from '../../repositories/profileRepository';
import {
  areProfileRemindersEnabled,
  clearProfileReminders,
  setProfileRemindersEnabled,
  syncProfileReminders,
} from '../../services/medicationReminders';
import { notificationsSupported, requestNotificationPermission } from '../../services/notificationService';
import { useReloadOnFocus } from '../shared/useReloadOnFocus';

const REMINDER_SYNC_ERROR = 'Medications are saved, but this phone’s reminders could not be updated. Try again later.';

// ViewModel for a profile's medication list (FR03). Reloads whenever the page comes
// back into view, so a medication added or edited on the form page shows up straight away.
// Each load also brings this phone's reminders up to date with the saved medications.
export function useMedicationsViewModel(profileId: string) {
  const { account } = useSession();
  const { reloadKey, reload } = useReloadOnFocus();

  const [profileName, setProfileName] = useState('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderError, setReminderError] = useState('');
  const [changingReminders, setChangingReminders] = useState(false);

  const accountId = account?.id;

  useEffect(() => {
    if (reloadKey === 0 || !accountId) return;
    let active = true;
    Promise.all([profileRepository.getProfile(profileId), medicationRepository.listMedications(profileId)])
      .then(async ([profile, loaded]) => {
        if (!active) return;
        setLoadError('');
        setProfileName(profile.name);
        setMedications(loaded);
        try {
          await syncProfileReminders(accountId, profileId, profile.name, loaded);
          const enabled = await areProfileRemindersEnabled(accountId, profileId);
          if (active) {
            setRemindersEnabled(enabled);
            setReminderError('');
          }
        } catch {
          if (active) setReminderError(REMINDER_SYNC_ERROR);
        }
      })
      .catch((error) => {
        if (!active) return;
        const appError = toAppError(error);
        setMedications([]);
        setLoadError(appError.message);
        // no access any more (deleted, revoked or left): stop this phone's reminders for it
        if (appError.code === 'not_found' || appError.code === 'not_allowed') {
          clearProfileReminders(accountId, profileId).catch(() => undefined);
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [profileId, reloadKey, accountId]);

  // Turns reminders on or off for this profile, for this account on this phone only.
  async function toggleReminders() {
    if (!accountId || changingReminders) return;
    setChangingReminders(true);
    setReminderError('');
    try {
      const turnOn = !remindersEnabled;
      if (turnOn && (await requestNotificationPermission()) !== 'granted') {
        setReminderError('Notifications are turned off for MediFamily. Allow them in your phone’s settings, then try again.');
        setChangingReminders(false);
        return;
      }
      await setProfileRemindersEnabled(accountId, profileId, turnOn);
      await syncProfileReminders(accountId, profileId, profileName, medications);
      setRemindersEnabled(turnOn);
    } catch {
      setReminderError(REMINDER_SYNC_ERROR);
    }
    setChangingReminders(false);
  }

  return {
    profileName,
    medications,
    loading,
    loadError,
    reload,
    remindersSupported: notificationsSupported(),
    remindersEnabled,
    reminderError,
    changingReminders,
    toggleReminders,
  };
}
