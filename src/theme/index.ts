import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';
import { useColorScheme } from 'react-native';

const lightColors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#1A1F2B',
  textMuted: '#5B6475',
  border: '#D5DBE5',
  primary: '#1F6FEB',
  onPrimary: '#FFFFFF',
  danger: '#C62828',
  onDanger: '#FFFFFF',
  /** Background for the "demo data" banner and other notices. */
  notice: '#FFF4D6',
  onNotice: '#6B4E00',
};

export type ThemeColors = typeof lightColors;

const darkColors: ThemeColors = {
  background: '#0F1218',
  surface: '#1A1F2B',
  text: '#ECEFF4',
  textMuted: '#A3ACBC',
  border: '#2E3646',
  primary: '#5B9BFF',
  onPrimary: '#0F1218',
  danger: '#FF6B6B',
  onDanger: '#0F1218',
  notice: '#3A2F0F',
  onNotice: '#FFE29A',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { sm: 6, md: 10 } as const;

export const typography = {
  title: { fontSize: 24, fontWeight: '700' },
  heading: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16 },
  label: { fontSize: 14, fontWeight: '600' },
  caption: { fontSize: 13 },
} as const;

/** Colours for the device's current light/dark setting. */
export function useThemeColors(): ThemeColors {
  return useColorScheme() === 'dark' ? darkColors : lightColors;
}

/** Navigation (header, screen background) theme matching the app colours. */
export function useNavigationTheme(): Theme {
  const dark = useColorScheme() === 'dark';
  const base = dark ? DarkTheme : DefaultTheme;
  const colors = dark ? darkColors : lightColors;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };
}
