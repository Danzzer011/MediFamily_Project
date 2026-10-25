import { useState, type Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useThemeColors } from '../theme';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string; // shown in red under the field
  hint?: string; // shown in grey under the field when there is no error
  ref?: Ref<TextInput>;
};

// A labelled text input. The border turns teal while typing and red when there is an error.
export default function TextField({ label, error, hint, ref, onFocus, onBlur, ...inputProps }: TextFieldProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);

  let borderColor = colors.border;
  if (error) borderColor = colors.danger;
  else if (focused) borderColor = colors.primary;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={error || hint}
        placeholderTextColor={colors.textMuted}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...inputProps}
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.surface, borderColor },
          inputProps.multiline && styles.multiline,
        ]}
      />
      {error ? <Text style={[styles.message, { color: colors.danger }]}>{error}</Text> : null}
      {!error && hint ? <Text style={[styles.message, { color: colors.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 15, fontWeight: '600' },
  input: { minHeight: 52, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  multiline: { minHeight: 104, textAlignVertical: 'top' },
  message: { fontSize: 13 },
});
