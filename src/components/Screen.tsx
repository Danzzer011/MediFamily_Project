import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { spacing, useThemeColors } from '@/theme';

/** Scrollable page container with standard padding and background. */
export function Screen({ children }: PropsWithChildren) {
  const colors = useThemeColors();
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic">
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, flexGrow: 1 },
});
