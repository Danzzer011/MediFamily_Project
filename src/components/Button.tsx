import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { useThemeColors } from '../theme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean; // shows a spinner and blocks taps while something is saving
  disabled?: boolean;
};

// The app's button: teal for the main action, outlined for secondary, red for delete.
export default function Button({ title, onPress, variant = 'primary', loading = false, disabled = false }: ButtonProps) {
  const colors = useThemeColors();

  let backgroundColor = colors.primary;
  let textColor = colors.onPrimary;
  if (variant === 'secondary') {
    backgroundColor = colors.surface;
    textColor = colors.primary;
  } else if (variant === 'danger') {
    backgroundColor = colors.danger;
    textColor = colors.onDanger;
  }
  const borderColor = variant === 'secondary' ? colors.primary : backgroundColor;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, borderColor },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.text, { color: textColor }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
