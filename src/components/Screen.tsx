import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { maxContentWidth, useThemeColors } from '../theme';

type ScreenProps = {
  children: ReactNode;
  centered?: boolean; // centre the content vertically, e.g. for the Login form
  withoutHeader?: boolean; // leave space for the status bar when the page has no header
};

// Page wrapper: background colour, padding, scrolling, and keeps the keyboard from covering inputs.
// The content is limited to a readable width so it also looks right in the browser.
export default function Screen({ children, centered = false, withoutHeader = false }: ScreenProps) {
  const colors = useThemeColors();

  return (
    <SafeAreaView
      edges={withoutHeader ? ['top', 'bottom', 'left', 'right'] : ['bottom', 'left', 'right']}
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, centered && styles.centered]}
          keyboardShouldPersistTaps="handled">
          <View style={styles.content}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1, padding: 16 },
  centered: { justifyContent: 'center', paddingVertical: 32 },
  content: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', gap: 16 },
});
