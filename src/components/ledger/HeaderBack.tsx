import { Pressable, StyleSheet } from 'react-native';

import { useThemeColors } from '../../theme';
import Icon from './Icon';

// A back arrow for a header, for when "back" means "back to the list on this page", not "leave the page".
export default function HeaderBack({ onPress, label }: { onPress: () => void; label: string }) {
  const colors = useThemeColors();

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.button}>
      <Icon name="back" size={24} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
