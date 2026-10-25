import { StyleSheet, Text } from 'react-native';

import { useThemeColors } from '../theme';

// A small grey note on pages that still use Phase 1 demo data instead of the cloud.
export default function DemoDataNotice() {
  const colors = useThemeColors();

  return (
    <Text style={[styles.notice, { backgroundColor: colors.notice, color: colors.onNotice }]}>
      Demo data — changes are not saved to the cloud and reset when the app reloads.
    </Text>
  );
}

const styles = StyleSheet.create({
  notice: { fontSize: 13, textAlign: 'center', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
});
