import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../../theme';
import { monoFont } from '../../theme/medifamily-theme';

// The left column of a row: a date or time in the mono font ("05 NOV" over "THU").
export default function DateColumn({ top, bottom }: { top: string; bottom: string }) {
  const colors = useThemeColors();

  return (
    <View style={styles.column}>
      <Text style={[styles.top, { color: colors.text, fontFamily: monoFont }]}>{top}</Text>
      <Text style={[styles.bottom, { color: colors.textMuted, fontFamily: monoFont }]}>{bottom}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { width: 58 },
  top: { fontSize: 14, lineHeight: 22, fontWeight: '600' },
  bottom: { fontSize: 12 },
});
