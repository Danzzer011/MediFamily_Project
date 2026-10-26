import { Pressable, StyleSheet, Text } from 'react-native';

import { useThemeColors } from '../../theme';

// "Cancel" at the left of the header while a form is open (instead of the back arrow).
export default function HeaderCancel({ onPress }: { onPress: () => void }) {
  const colors = useThemeColors();

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Cancel" onPress={onPress} style={styles.button}>
      <Text style={[styles.text, { color: colors.primary }]}>Cancel</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minWidth: 64, minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  text: { fontSize: 16, fontWeight: '700' },
});
