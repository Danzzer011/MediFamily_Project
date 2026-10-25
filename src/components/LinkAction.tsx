import { Pressable, StyleSheet, Text } from 'react-native';

import { useThemeColors } from '../theme';

type LinkActionProps = {
  label: string;
  accessibilityLabel: string; // say what it acts on, e.g. "Delete appointment with Dr. Ali"
  onPress: () => void;
  danger?: boolean; // red text, e.g. for Delete
};

// A small text button for list rows (Edit, Delete…). At least 44 px tall so it is easy to tap.
export default function LinkAction({ label, accessibilityLabel, onPress, danger = false }: LinkActionProps) {
  const colors = useThemeColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={styles.link}>
      <Text style={[styles.text, { color: danger ? colors.danger : colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  text: { fontSize: 15, fontWeight: '700' },
});
