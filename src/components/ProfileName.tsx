import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../theme';

type ProfileNameProps = {
  name: string;
  timeZone?: string; // pass it on pages that show times, so everyone knows which clock is meant
};

// Shows whose records a page lists (all data belongs to the selected profile).
export default function ProfileName({ name, timeZone }: ProfileNameProps) {
  const colors = useThemeColors();
  return (
    <View style={styles.box}>
      <Text accessibilityRole="header" style={[styles.name, { color: colors.text }]}>
        Profile: {name}
      </Text>
      {timeZone ? <Text style={[styles.zone, { color: colors.textMuted }]}>Times are shown in {timeZone}.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 2 },
  name: { fontSize: 18, fontWeight: '700' },
  zone: { fontSize: 13 },
});
