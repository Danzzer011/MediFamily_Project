import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemeColors } from '../../theme';

// The page's main buttons, under a thin line at the end of the page (as on the Appointments page).
export default function Dock({ children }: { children: ReactNode }) {
  const colors = useThemeColors();

  return <View style={[styles.dock, { borderColor: colors.border }]}>{children}</View>;
}

const styles = StyleSheet.create({
  dock: { marginTop: 20, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, gap: 12 },
});
