import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../../theme';
import { monoFont } from '../../theme/medifamily-theme';

// "COMING UP ........ 2": a small caps label with a count.
export default function SectionLabel({ label, count }: { label: string; count: number }) {
  const colors = useThemeColors();

  return (
    <View style={styles.row} accessibilityRole="header">
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.count, { color: colors.textMuted, fontFamily: monoFont }]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  count: { fontSize: 13 },
});
