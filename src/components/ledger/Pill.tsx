import { StyleSheet, Text, View } from 'react-native';

import Icon, { type IconName } from './Icon';

type PillProps = {
  label: string;
  color: string;
  background?: string; // filled pill, e.g. a status
  borderColor?: string; // outlined pill, e.g. a category
  icon?: IconName;
};

// A small rounded label. The text always says what it is, so colour is never the only signal.
export default function Pill({ label, color, background, borderColor, icon }: PillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: background, borderColor, borderWidth: borderColor ? 1 : 0 }, icon && styles.withIcon]}>
      {icon ? <Icon name={icon} size={13} color={color} /> : null}
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999 },
  withIcon: { paddingLeft: 8 },
  text: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
});
