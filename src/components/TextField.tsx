import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { radius, spacing, typography, useThemeColors } from '@/theme';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Validation message shown under the field. */
  error?: string | null;
  /** Optional guidance shown under the field when there is no error. */
  hint?: string;
}

export function TextField({ label, error, hint, ...inputProps }: TextFieldProps) {
  const colors = useThemeColors();
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        {...inputProps}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
          },
          inputProps.multiline && styles.multiline,
        ]}
      />
      {error ? (
        <Text style={[styles.caption, { color: colors.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.caption, { color: colors.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: typography.label,
  input: {
    ...typography.body,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  caption: typography.caption,
});
