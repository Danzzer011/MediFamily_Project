import { StyleSheet, Text } from 'react-native';

import DemoDataNotice from '../../components/DemoDataNotice';
import Screen from '../../components/Screen';
import { useThemeColors } from '../../theme';

// Placeholder page until the Register View is built.
export default function Register() {
  const colors = useThemeColors();

  return (
    <Screen>
      <DemoDataNotice />
      <Text style={[styles.text, { color: colors.text }]}>Register page — not built yet.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 16 },
});
