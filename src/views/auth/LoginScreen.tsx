import { Link } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import BrandHeader from '../../components/BrandHeader';
import Button from '../../components/Button';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import { useThemeColors } from '../../theme';
import { useLoginViewModel } from '../../viewmodels/auth/useLoginViewModel';

// Login page (View). All the logic lives in useLoginViewModel.
export default function LoginScreen() {
  const colors = useThemeColors();
  const vm = useLoginViewModel();
  const passwordRef = useRef<TextInput>(null);

  return (
    <Screen centered withoutHeader>
      <BrandHeader />

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
          Log in
        </Text>

        {vm.formError ? <ErrorBanner message={vm.formError} /> : null}

        <TextField
          label="Email"
          placeholder="name@example.com"
          value={vm.email}
          onChangeText={vm.changeEmail}
          error={vm.emailError}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()} // Enter jumps to the password field
        />
        <TextField
          ref={passwordRef}
          label="Password"
          value={vm.password}
          onChangeText={vm.changePassword}
          error={vm.passwordError}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={vm.logIn} // Enter logs in
        />

        <Button title="Log in" onPress={vm.logIn} loading={vm.loading} />
      </View>

      <View style={styles.registerRow}>
        <Text style={[styles.registerText, { color: colors.textMuted }]}>New to MediFamily?</Text>
        <Link href="/register" style={[styles.registerLink, { color: colors.primary }]}>
          Create an account
        </Link>
      </View>

      <DemoDataNotice />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  registerRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 4 },
  registerText: { fontSize: 16 },
  registerLink: { fontSize: 16, fontWeight: '700', paddingVertical: 8 },
});
