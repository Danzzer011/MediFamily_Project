import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../theme';

// A full-page spinner while a page loads its data.
export default function LoadingView({ message }: { message?: string }) {
  const colors = useThemeColors();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.primary} size="large" />
      {message ? <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  message: { fontSize: 16, textAlign: 'center' },
});
