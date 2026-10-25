import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

const ANDROID_CHANNEL_ID = 'medication-reminders';

// Show reminders even while the app is open.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Scheduled phone notifications are not available in the browser. */
export function notificationsSupported(): boolean {
  return Platform.OS !== 'web';
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied';
  const { status } = await Notifications.getPermissionsAsync();
  return status as NotificationPermission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied';
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Medication reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status as NotificationPermission;
}

/** Schedules one notification at an exact time. Returns its id, used to cancel it later. */
export async function scheduleNotification(title: string, body: string, at: Date): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: ANDROID_CHANNEL_ID },
  });
}

export async function cancelNotifications(ids: string[]): Promise<void> {
  if (!notificationsSupported()) return;
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}
