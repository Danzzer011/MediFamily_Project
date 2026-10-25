import { Pressable, StyleSheet, Text } from 'react-native';

import { useThemeColors } from '../theme';

type ChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

// A small rounded option button, e.g. one blood type. Filled teal when selected.
export default function ChoiceChip({ label, selected, onPress }: ChoiceChipProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: colors.primary, backgroundColor: selected ? colors.primary : colors.surface },
      ]}>
      <Text style={[styles.label, { color: selected ? colors.onPrimary : colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { minWidth: 56, minHeight: 44, paddingHorizontal: 14, borderWidth: 1.5, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '700' },
});
