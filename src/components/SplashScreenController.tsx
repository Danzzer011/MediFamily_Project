import { SplashScreen } from 'expo-router';

import { useSession } from '@/context/SessionContext';

// Keep the splash screen up until we know whether someone is signed in.
SplashScreen.preventAutoHideAsync();

export function SplashScreenController() {
  const { status } = useSession();
  if (status !== 'loading') SplashScreen.hide();
  return null;
}
