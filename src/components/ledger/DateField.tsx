import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useThemeColors } from '../../theme';
import { monoFont } from '../../theme/medifamily-theme';

type DateFieldProps = {
  label: string;
  value: string; // "YYYY-MM-DD", or part of it while typing
  onChangeText: (text: string) => void;
  tag?: string; // small grey note at the right of the label, e.g. "Required"
  error?: string;
  hint?: string;
};

// Only the digits, at most `max` of them.
function digitsOnly(text: string, max: number): string {
  return text.replace(/\D/g, '').slice(0, max);
}

// A date typed in three boxes: year, month, day. The "-" between them is added for you,
// and the cursor moves to the next box as soon as one is full.
// The page still gets one "YYYY-MM-DD" text, so the form's checks stay the same.
export default function DateField({ label, value, onChangeText, tag, error, hint }: DateFieldProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  const monthRef = useRef<TextInput>(null);
  const dayRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  const [year = '', month = '', day = ''] = value.split('-');

  // put the three parts back together; all empty means no date
  function update(nextYear: string, nextMonth: string, nextDay: string) {
    onChangeText(nextYear || nextMonth || nextDay ? `${nextYear}-${nextMonth}-${nextDay}` : '');
  }

  function changeYear(text: string) {
    const digits = digitsOnly(text, 4);
    update(digits, month, day);
    if (digits.length === 4) monthRef.current?.focus();
  }

  function changeMonth(text: string) {
    const digits = digitsOnly(text, 2);
    update(year, digits, day);
    if (digits.length === 2) dayRef.current?.focus();
  }

  function changeDay(text: string) {
    update(year, month, digitsOnly(text, 2));
  }

  let borderColor = colors.border;
  if (error) borderColor = colors.danger;
  else if (focused) borderColor = colors.primary;

  const boxStyle = [styles.box, { color: colors.text, backgroundColor: colors.surface, borderColor }];
  const dash = <Text style={[styles.dash, { color: colors.textMuted }]}>-</Text>;
  const focusProps = { onFocus: () => setFocused(true), onBlur: () => setFocused(false) };

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {tag ? <Text style={[styles.tag, { color: colors.textMuted }]}>{tag}</Text> : null}
      </View>
      <View style={styles.row}>
        <TextInput
          ref={yearRef}
          accessibilityLabel={`${label}, year`}
          accessibilityHint={error || hint}
          value={year}
          onChangeText={changeYear}
          placeholder="YYYY"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={4}
          {...focusProps}
          style={[boxStyle, styles.year]}
        />
        {dash}
        <TextInput
          ref={monthRef}
          accessibilityLabel={`${label}, month`}
          value={month}
          onChangeText={changeMonth}
          // backspace in an empty box goes back to the previous one
          onKeyPress={(event) => event.nativeEvent.key === 'Backspace' && !month && yearRef.current?.focus()}
          placeholder="MM"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={2}
          {...focusProps}
          style={[boxStyle, styles.small]}
        />
        {dash}
        <TextInput
          ref={dayRef}
          accessibilityLabel={`${label}, day`}
          value={day}
          onChangeText={changeDay}
          onKeyPress={(event) => event.nativeEvent.key === 'Backspace' && !day && monthRef.current?.focus()}
          placeholder="DD"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={2}
          {...focusProps}
          style={[boxStyle, styles.small]}
        />
      </View>
      {error ? <Text style={[styles.message, styles.error, { color: colors.danger }]}>{error}</Text> : null}
      {!error && hint ? <Text style={[styles.message, { color: colors.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontSize: 15, fontWeight: '600' },
  tag: { fontSize: 13 },
  // the boxes share the width, so the field also fits next to a Time field
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 260 },
  box: { minHeight: 52, minWidth: 0, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 4, fontSize: 16, textAlign: 'center', fontFamily: monoFont },
  year: { flex: 2 },
  small: { flex: 1.4 },
  dash: { fontSize: 18, fontWeight: '600' },
  message: { fontSize: 13, lineHeight: 18 },
  error: { fontWeight: '600' },
});
