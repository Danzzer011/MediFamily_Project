import { StyleSheet, Text } from 'react-native';

import DemoDataNotice from '../../components/DemoDataNotice';
import Screen from '../../components/Screen';
import { useThemeColors } from '../../theme';

// Placeholder page until the Profile selection (FR01) View is built.
export default function Profiles() {
  const colors = useThemeColors();

  return (
    <Screen>
      <DemoDataNotice />
      <Text style={[styles.text, { color: colors.text }]}>Profile selection (FR01) page — not built yet.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 16 },
});
