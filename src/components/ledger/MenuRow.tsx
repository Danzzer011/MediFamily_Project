import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../../theme';
import Icon, { type IconName } from './Icon';

type MenuRowProps = {
  title: string;
  description?: string;
  icon?: IconName;
  onPress: () => void;
};

// One tappable row in a list: an icon in a soft square, the title and a short description, and an arrow.
export default function MenuRow({ title, description, icon, onPress }: MenuRowProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.notice }]}>
      {icon ? (
        <View style={[styles.tile, { backgroundColor: colors.notice }]}>
          <Icon name={icon} size={20} color={colors.primary} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {description ? <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text> : null}
      </View>
      <Icon name="next" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 12, paddingHorizontal: 16 },
  tile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: '700' },
  description: { fontSize: 14, lineHeight: 19 },
});
