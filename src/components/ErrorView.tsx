import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../theme';
import Button from './Button';

type ErrorViewProps = {
  message: string;
  actionTitle?: string;
  onAction?: () => void; // e.g. try again, or reload the latest version
};

// A full-page error message with an optional button.
export default function ErrorView({ message, actionTitle = 'Try again', onAction }: ErrorViewProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text accessibilityRole="alert" style={[styles.message, { color: colors.text }]}>
        {message}
      </Text>
      {onAction ? <Button title={actionTitle} variant="secondary" onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  message: { fontSize: 16, textAlign: 'center' },
});
