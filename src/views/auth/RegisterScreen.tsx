import { Link } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import BrandHeader from '../../components/BrandHeader';
import Button from '../../components/Button';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import { MIN_PASSWORD_LENGTH } from '../../models/validation';
import { useThemeColors } from '../../theme';
import { useRegisterViewModel } from '../../viewmodels/auth/useRegisterViewModel';

// Register page (View). All the logic lives in useRegisterViewModel.
export default function RegisterScreen() {
  const colors = useThemeColors();
  const vm = useRegisterViewModel();
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  return (
    <Screen centered withoutHeader>
      <BrandHeader />

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
          Create an account
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          After signing up you can add health profiles for yourself and your family.
        </Text>

        {vm.formError ? <ErrorBanner message={vm.formError} /> : null}
        {vm.confirmationMessage ? (
          <Text accessibilityRole="alert" style={[styles.confirmation, { color: colors.primary }]}>
            {vm.confirmationMessage}
          </Text>
        ) : null}

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
          onSubmitEditing={() => passwordRef.current?.focus()} // Enter jumps to the next field
        />
        <TextField
          ref={passwordRef}
          label="Password"
          value={vm.password}
          onChangeText={vm.changePassword}
          error={vm.passwordError}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <TextField
          ref={confirmRef}
          label="Confirm password"
          value={vm.confirmPassword}
          onChangeText={vm.changeConfirmPassword}
          error={vm.confirmError}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={vm.register} // Enter creates the account
        />

        <Button title="Create account" onPress={vm.register} loading={vm.loading} />
      </View>

      <View style={styles.loginRow}>
        <Text style={[styles.loginText, { color: colors.textMuted }]}>Already have an account?</Text>
        <Link href="/login" replace style={[styles.loginLink, { color: colors.primary }]}>
          Log in
        </Link>
      </View>

      <DemoDataNotice />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 15, marginTop: -8 },
  confirmation: { fontSize: 16, fontWeight: '600' },
  loginRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 4 },
  loginText: { fontSize: 16 },
  loginLink: { fontSize: 16, fontWeight: '700', paddingVertical: 8 },
});
