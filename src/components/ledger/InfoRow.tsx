import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../../theme';

// One "label: value" row in a list. A missing value shows `emptyText` in grey italics.
export default function InfoRow({ label, value, emptyText = 'Not recorded' }: { label: string; value: string | null; emptyText?: string }) {
  const colors = useThemeColors();

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      {value ? (
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      ) : (
        <Text style={[styles.empty, { color: colors.textMuted }]}>{emptyText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 12, paddingHorizontal: 16, gap: 2 },
  label: { fontSize: 13, fontWeight: '600' },
  value: { fontSize: 16, lineHeight: 22 },
  empty: { fontSize: 16, fontStyle: 'italic' },
});
