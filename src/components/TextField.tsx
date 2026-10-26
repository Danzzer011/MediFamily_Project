import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useThemeColors } from '../theme';
import Icon from './ledger/Icon';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string; // shown in red under the field
  hint?: string; // shown in grey under the field when there is no error
  ref?: Ref<TextInput>;
};

// A labelled text input. The border turns teal while typing and red when there is an error.
// A password field (secureTextEntry) gets an eye button to show or hide what was typed.
export default function TextField({ label, error, hint, ref, onFocus, onBlur, secureTextEntry, ...inputProps }: TextFieldProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  let borderColor = colors.border;
  if (error) borderColor = colors.danger;
  else if (focused) borderColor = colors.primary;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View>
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
          secureTextEntry={secureTextEntry && !showPassword}
          style={[
            styles.input,
            { color: colors.text, backgroundColor: colors.surface, borderColor },
            inputProps.multiline && styles.multiline,
            secureTextEntry && styles.withEye,
          ]}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eye}>
            <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
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
  withEye: { paddingRight: 52 },
  eye: { position: 'absolute', right: 4, top: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  message: { fontSize: 13 },
});
