import { Platform, useColorScheme } from 'react-native';

import { useThemeColors } from './index';

// My extra styles for the Appointments, Documents and Measurements screens.
// Everything reuses the team's theme (./index) through useThemeColors(). The only new colours are for "completed".

export type StatusKey = 'scheduled' | 'completed' | 'cancelled' | 'missed';
export type StatusStyle = { fg: string; bg: string };

/** The phone's built-in monospace font. Used only for dates and times. */
export const monoFont: string = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace, Menlo, Consolas, monospace',
});

// The team's palette has a single hue, so "completed" gets its own green.
const COMPLETED = {
  light: { fg: '#527A0C', bg: '#EEF5E0' },
  dark: { fg: '#A3D977', bg: '#24331A' },
};

/** Chip colours for the four appointment statuses, for the current light/dark setting. */
export function useStatusStyles(): Record<StatusKey, StatusStyle> {
  const colors = useThemeColors();
  const dark = useColorScheme() === 'dark';
  return {
    scheduled: { fg: colors.primary, bg: colors.notice },
    completed: dark ? COMPLETED.dark : COMPLETED.light,
    cancelled: { fg: colors.textMuted, bg: colors.border },
    missed: { fg: colors.danger, bg: colors.dangerSurface },
  };
}
