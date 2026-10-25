import { Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { DemoDataNotice } from '@/components/StatusViews';
import { useThemeColors } from '@/theme';

// Placeholder route until the Login View is built.
export default function Placeholder() {
  const colors = useThemeColors();
  return (
    <Screen>
      <DemoDataNotice />
      <Text style={{ color: colors.text }}>Login screen — not built yet.</Text>
    </Screen>
  );
}
