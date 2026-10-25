import { Children, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemeColors } from '../../theme';

// The list panel: a heavy rule above and below, a thin line between rows, edge to edge.
export default function LedgerList({ children }: { children: ReactNode }) {
  const colors = useThemeColors();

  return (
    <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.text }]}>
      {Children.toArray(children).map((child, index) => (
        <View key={index} style={index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderTopWidth: 1.5, borderBottomWidth: 1.5 },
});
