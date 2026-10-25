import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { spacing, typography, useThemeColors } from '@/theme';
import { Button } from './Button';

/** Full-area spinner for screens that are loading their data. */
export function LoadingView({ message }: { message?: string }) {
  const colors = useThemeColors();
  return (
    <View style={[styles.centered, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.primary} size="large" />
      {message ? <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text> : null}
    </View>
  );
}

/** Error message with an optional retry or reload action. */
export function ErrorView({
  message,
  actionTitle = 'Try again',
  onAction,
}: {
  message: string;
  actionTitle?: string;
  onAction?: () => void;
}) {
  const colors = useThemeColors();
  return (
    <View style={[styles.centered, { backgroundColor: colors.background }]}>
      <Text accessibilityRole="alert" style={[styles.message, { color: colors.text }]}>
        {message}
      </Text>
      {onAction ? <Button title={actionTitle} variant="secondary" onPress={onAction} /> : null}
    </View>
  );
}

/** Inline error banner for forms, e.g. a failed save. */
export function ErrorBanner({ message }: { message: string }) {
  const colors = useThemeColors();
  return (
    <Text accessibilityRole="alert" style={[styles.banner, { color: colors.danger, borderColor: colors.danger }]}>
      {message}
    </Text>
  );
}

/** Marks screens that run on Phase 1 demonstration data. */
export function DemoDataNotice() {
  const colors = useThemeColors();
  return (
    <Text style={[styles.banner, { backgroundColor: colors.notice, color: colors.onNotice, borderColor: colors.notice }]}>
      Demo data — changes are not saved to the cloud and reset when the app reloads.
    </Text>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  message: { ...typography.body, textAlign: 'center' },
  banner: { ...typography.caption, borderWidth: 1, borderRadius: 6, padding: spacing.sm },
});
