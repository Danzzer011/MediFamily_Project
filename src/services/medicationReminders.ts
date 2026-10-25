import { upcomingReminderInstants, type Medication } from '../models/Medication';
import {
  cancelNotifications,
  getNotificationPermission,
  notificationsSupported,
  scheduleNotification,
} from './notificationService';
import { loadReminderPreferences, saveReminderPreferences } from './reminderPreferences';

// How far ahead reminders are scheduled. iOS keeps at most 64 waiting notifications
// for the whole app, so each profile gets a limited number and is topped up on every load.
const DAYS_AHEAD = 7;
const MAX_PER_PROFILE = 40;

// Reminder changes run one at a time, so two quick reloads cannot schedule the same doses twice.
let queue: Promise<unknown> = Promise.resolve();
function oneAtATime<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task, task);
  queue = result.catch(() => undefined);
  return result;
}

/**
 * Makes this phone's pending reminders for one profile match its saved medications (FR03):
 * cancels everything scheduled before, then, if this account turned reminders on and
 * notifications are allowed, schedules the upcoming doses inside each treatment period.
 * Removed or changed medications therefore lose or update their reminders.
 */
export async function syncProfileReminders(
  accountId: string,
  profileId: string,
  profileName: string,
  medications: Medication[],
): Promise<void> {
  if (!notificationsSupported()) return;
  return oneAtATime(async () => {
    const preferences = await loadReminderPreferences(accountId, profileId);
    await cancelNotifications(Object.values(preferences.scheduledIds).flat());
    preferences.scheduledIds = {};

    if (preferences.enabled && (await getNotificationPermission()) === 'granted') {
      const now = new Date();
      const upcoming = medications
        .flatMap((medication) =>
          upcomingReminderInstants(medication, now, DAYS_AHEAD).map((at) => ({ medication, at })),
        )
        .sort((a, b) => a.at.getTime() - b.at.getTime())
        .slice(0, MAX_PER_PROFILE);

      for (const { medication, at } of upcoming) {
        const time = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
        // names the person and the medication; it does not record that the dose was taken
        const id = await scheduleNotification(
          `${profileName}: ${medication.name}`,
          `${time} · ${medication.dosageInstructions}`,
          at,
        );
        (preferences.scheduledIds[medication.id] ??= []).push(id);
      }
    }

    await saveReminderPreferences(accountId, profileId, preferences);
  });
}

/** Turns this account's reminders for a profile on or off on this phone. */
export async function setProfileRemindersEnabled(accountId: string, profileId: string, enabled: boolean): Promise<void> {
  return oneAtATime(async () => {
    const preferences = await loadReminderPreferences(accountId, profileId);
    await saveReminderPreferences(accountId, profileId, { ...preferences, enabled });
  });
}

export async function areProfileRemindersEnabled(accountId: string, profileId: string): Promise<boolean> {
  return (await loadReminderPreferences(accountId, profileId)).enabled;
}

/**
 * Cancels a profile's pending reminders on this phone and turns them off, e.g. after the
 * profile is deleted or this account loses access to it (FR09).
 */
export async function clearProfileReminders(accountId: string, profileId: string): Promise<void> {
  return oneAtATime(async () => {
    const preferences = await loadReminderPreferences(accountId, profileId);
    await cancelNotifications(Object.values(preferences.scheduledIds).flat());
    await saveReminderPreferences(accountId, profileId, { enabled: false, scheduledIds: {} });
  });
}
