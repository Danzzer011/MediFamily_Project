import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { radius, spacing, typography, useThemeColors } from '@/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  /** Shows a spinner and blocks presses while an action is running. */
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false }: ButtonProps) {
  const colors = useThemeColors();
  const inactive = disabled || loading;
  const background =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : 'transparent';
  const foreground =
    variant === 'primary' ? colors.onPrimary : variant === 'danger' ? colors.onDanger : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, borderColor: variant === 'secondary' ? colors.primary : background },
        (pressed || inactive) && styles.dimmed,
      ]}>
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <Text style={[styles.title, { color: foreground }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: typography.label,
  dimmed: { opacity: 0.6 },
});
