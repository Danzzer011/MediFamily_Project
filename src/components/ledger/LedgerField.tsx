import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useThemeColors } from '../../theme';
import { monoFont } from '../../theme/medifamily-theme';

type LedgerFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  tag?: string; // small grey note at the right of the label, e.g. "Required"
  error?: string;
  hint?: string;
  mono?: boolean; // dates and times use the mono font
};

// A boxed text field: label and tag on one line, the team's input shape (52 px, 12 px corners, 1.5 px outline).
export default function LedgerField({ label, tag, error, hint, mono = false, multiline, onFocus, onBlur, ...inputProps }: LedgerFieldProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);

  let borderColor = colors.border;
  if (error) borderColor = colors.danger;
  else if (focused) borderColor = colors.primary;

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {tag ? <Text style={[styles.tag, { color: colors.textMuted }]}>{tag}</Text> : null}
      </View>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error || hint}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
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
          mono && { fontFamily: monoFont, fontSize: 15 },
          multiline && styles.multiline,
        ]}
      />
      {error ? <Text style={[styles.message, { color: colors.danger, fontWeight: '600' }]}>{error}</Text> : null}
      {!error && hint ? <Text style={[styles.message, { color: colors.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontSize: 15, fontWeight: '600' },
  tag: { fontSize: 13 },
  input: { minHeight: 52, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  multiline: { minHeight: 92, textAlignVertical: 'top' },
  message: { fontSize: 13, lineHeight: 18 },
});
