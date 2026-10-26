import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { maxContentWidth, useThemeColors } from '../../theme';

// Page wrapper for the Ledger screens. Like the shared Screen, but with no side padding,
// so the lists can run edge to edge. Each block adds its own 16 px padding.
export default function LedgerScreen({ children }: { children: ReactNode }) {
  const colors = useThemeColors();

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 24 },
  content: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' },
});
