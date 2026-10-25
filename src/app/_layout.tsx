import { Stack, ThemeProvider } from 'expo-router';

import { SplashScreenController } from '@/components/SplashScreenController';
import { SelectedProfileProvider } from '@/context/SelectedProfileContext';
import { SessionProvider, useSession } from '@/context/SessionContext';
import { useNavigationTheme } from '@/theme';

export default function RootLayout() {
  return (
    <ThemeProvider value={useNavigationTheme()}>
      <SessionProvider>
        <SplashScreenController />
        <SelectedProfileProvider>
          <RootNavigator />
        </SelectedProfileProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { status } = useSession();
  const signedIn = status === 'signedIn';

  // Client-side guards only steer navigation; the backend enforces access.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
