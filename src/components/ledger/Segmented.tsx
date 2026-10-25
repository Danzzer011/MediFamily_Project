import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../../theme';

type SegmentedProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
};

// A row of connected buttons where exactly one is on, e.g. the appointment status.
export default function Segmented<T extends string>({ options, selected, onSelect }: SegmentedProps<T>) {
  const colors = useThemeColors();

  return (
    <View accessibilityRole="radiogroup" style={[styles.box, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      {options.map((option, index) => {
        const on = option.value === selected;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onSelect(option.value)}
            style={[styles.segment, index > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border }, on && { backgroundColor: colors.primary }]}>
            <Text style={[styles.text, { color: on ? colors.onPrimary : colors.textMuted }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', borderWidth: 1.5, borderRadius: 12, overflow: 'hidden' },
  segment: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 13, fontWeight: '700' },
});
