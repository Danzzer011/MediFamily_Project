import { StyleSheet, Text } from 'react-native';

import { useThemeColors } from '../../theme';

// The one big heading of a Ledger page (the team's "title" size).
export default function PageTitle({ text }: { text: string }) {
  const colors = useThemeColors();

  return (
    <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
});
