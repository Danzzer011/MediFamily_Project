import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../theme';

// A red box for a form-wide error, e.g. "Incorrect email or password."
export default function ErrorBanner({ message }: { message: string }) {
  const colors = useThemeColors();

  return (
    <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: colors.dangerSurface, borderColor: colors.danger }]}>
      <Text style={[styles.title, { color: colors.danger }]}>Error</Text>
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 8, padding: 16, gap: 2 },
  title: { fontSize: 13, fontWeight: '700' },
  message: { fontSize: 16 },
});
