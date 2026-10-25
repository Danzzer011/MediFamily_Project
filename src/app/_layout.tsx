import { Stack, ThemeProvider } from 'expo-router';

import SplashScreenController from '../components/SplashScreenController';
import { SelectedProfileProvider } from '../context/SelectedProfileContext';
import { SessionProvider, useSession } from '../context/SessionContext';
import { useNavigationTheme } from '../theme';

// Root layout: the providers wrap every page so they all share the same session and selected profile.
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

// Logged in -> the (app) pages. Logged out -> the (auth) pages (Login, Register).
// This only steers navigation; the backend is what really protects the data.
function RootNavigator() {
  const { account } = useSession();
  const loggedIn = account !== null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={loggedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!loggedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
