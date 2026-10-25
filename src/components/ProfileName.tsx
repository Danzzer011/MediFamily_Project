import { StyleSheet, Text } from 'react-native';

import { useThemeColors } from '../theme';

// Shows whose records a page lists (all data belongs to the selected profile).
export default function ProfileName({ name }: { name: string }) {
  const colors = useThemeColors();
  return (
    <Text accessibilityRole="header" style={[styles.name, { color: colors.text }]}>
      Profile: {name}
    </Text>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 18, fontWeight: '700' },
});
