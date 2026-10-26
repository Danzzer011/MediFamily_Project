import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../../theme';
import Icon, { type IconName } from './Icon';

type TileProps = {
  icon: IconName;
  title: string;
  line?: string; // a short live summary, e.g. "3 active"
  lineColor?: string;
  onPress: () => void;
};

// A square-ish button for a grid of two columns: icon on top, the title, then one small line.
export default function Tile({ icon, title, line, lineColor, onPress }: TileProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={line ? `${title}, ${line}` : title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { backgroundColor: colors.notice },
      ]}>
      <View style={[styles.icon, { backgroundColor: colors.notice }]}>
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.line, { color: lineColor ?? colors.textMuted }]} numberOfLines={1}>
        {line ?? ' '}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flexBasis: '45%', flexGrow: 1, minHeight: 124, borderWidth: 1, borderRadius: 16, padding: 14, gap: 6 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  line: { fontSize: 13, fontWeight: '600', marginTop: 'auto' },
});
