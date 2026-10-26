import { Pressable, StyleSheet, Text } from 'react-native';

import { useThemeColors } from '../theme';
import Icon, { type IconName } from './ledger/Icon';

type LinkActionProps = {
  label: string;
  accessibilityLabel: string; // say what it acts on, e.g. "Export Dr. Ali's appointment to Google Calendar"
  onPress: () => void;
  danger?: boolean; // red text
  icon?: IconName;
};

// A small text button for list rows. At least 44 px tall so it is easy to tap.
export default function LinkAction({ label, accessibilityLabel, onPress, danger = false, icon }: LinkActionProps) {
  const colors = useThemeColors();
  const color = danger ? colors.danger : colors.primary;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={styles.link}>
      {icon ? <Icon name={icon} size={16} color={color} /> : null}
      <Text style={[styles.text, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  text: { fontSize: 14, fontWeight: '700' },
});
