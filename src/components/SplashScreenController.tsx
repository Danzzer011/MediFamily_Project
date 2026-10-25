import { SplashScreen } from 'expo-router';

import { useSession } from '../context/SessionContext';

// keep the splash screen up until we know whether someone is logged in
SplashScreen.preventAutoHideAsync();

export default function SplashScreenController() {
  const { isLoading } = useSession();
  if (!isLoading) SplashScreen.hide();
  return null;
}
