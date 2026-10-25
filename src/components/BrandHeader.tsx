import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../theme';

// The MediFamily logo, name and tagline shown on the Login and Register pages.
export default function BrandHeader() {
  const colors = useThemeColors();

  return (
    <View style={styles.header}>
      {/* a white cross on a teal square, hidden from screen readers because it is decoration */}
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.logo, { backgroundColor: colors.primary }]}>
        <View style={[styles.crossUp, { backgroundColor: colors.onPrimary }]} />
        <View style={[styles.crossAcross, { backgroundColor: colors.onPrimary }]} />
      </View>
      <Text accessibilityRole="header" style={[styles.name, { color: colors.text }]}>
        Medi<Text style={{ color: colors.primary }}>Family</Text>
      </Text>
      <Text style={[styles.tagline, { color: colors.textMuted }]}>Your family’s health, together.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 8, marginBottom: 16 },
  logo: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  crossUp: { position: 'absolute', width: 12, height: 34, borderRadius: 3 },
  crossAcross: { position: 'absolute', width: 34, height: 12, borderRadius: 3 },
  name: { fontSize: 32, fontWeight: '700' },
  tagline: { fontSize: 16, textAlign: 'center' },
});
