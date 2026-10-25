import { Modal, StyleSheet, Text, View } from 'react-native';

import { maxContentWidth, useThemeColors } from '../theme';
import Button from './Button';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmTitle: string;
  destructive?: boolean; // red confirm button, e.g. for deleting
  loading?: boolean;
  error?: string; // shown inside the dialog if the action failed
  onConfirm: () => void;
  onCancel: () => void;
};

// A yes/no question shown on top of the page. Used before deleting, revoking or leaving.
// (React Native's Alert does nothing in the browser, so we use a Modal that works everywhere.)
export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmTitle,
  destructive = false,
  loading = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const colors = useThemeColors();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View
          accessibilityRole="alert"
          accessibilityViewIsModal
          style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
          <View style={styles.buttons}>
            <Button title={confirmTitle} variant={destructive ? 'danger' : 'primary'} loading={loading} onPress={onConfirm} />
            <Button title="Cancel" variant="secondary" disabled={loading} onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  dialog: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', borderWidth: 1, borderRadius: 20, padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  message: { fontSize: 16, lineHeight: 22 },
  error: { fontSize: 14 },
  buttons: { gap: 10, marginTop: 8 },
});
