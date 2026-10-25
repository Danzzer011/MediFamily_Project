import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * This phone's reminder settings for one account and one profile (data-storage plan §5).
 * They are never shared: each caregiver turns reminders on for themselves (FR03).
 */
export type ReminderPreferences = {
  enabled: boolean;
  /** Notification ids scheduled on this phone, per medication id, so they can be cancelled. */
  scheduledIds: Record<string, string[]>;
};

const EMPTY: ReminderPreferences = { enabled: false, scheduledIds: {} };

function storageKey(accountId: string, profileId: string): string {
  return `medifamily:reminders:${accountId}:${profileId}`;
}

export async function loadReminderPreferences(accountId: string, profileId: string): Promise<ReminderPreferences> {
  const saved = await AsyncStorage.getItem(storageKey(accountId, profileId));
  if (!saved) return { ...EMPTY, scheduledIds: {} };
  try {
    const parsed = JSON.parse(saved) as Partial<ReminderPreferences>;
    return { enabled: parsed.enabled === true, scheduledIds: parsed.scheduledIds ?? {} };
  } catch {
    return { ...EMPTY, scheduledIds: {} };
  }
}

export async function saveReminderPreferences(
  accountId: string,
  profileId: string,
  preferences: ReminderPreferences,
): Promise<void> {
  await AsyncStorage.setItem(storageKey(accountId, profileId), JSON.stringify(preferences));
}
