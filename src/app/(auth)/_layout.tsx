import { Stack } from 'expo-router';

// Login and Register show the MediFamily brand header instead of a navigation header.
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ title: 'Log in' }} />
      <Stack.Screen name="register" options={{ title: 'Create account' }} />
    </Stack>
  );
}
