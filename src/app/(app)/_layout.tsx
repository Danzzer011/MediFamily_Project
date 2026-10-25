import { Stack } from 'expo-router';

// Signed-in pages. Profile pages set their own title (the profile's name) when they load.
export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Family profiles' }} />
      <Stack.Screen name="profiles/new" options={{ title: 'New profile' }} />
      <Stack.Screen name="profiles/[profileId]/index" options={{ title: 'Profile' }} />
      <Stack.Screen name="profiles/[profileId]/edit" options={{ title: 'Edit profile' }} />
      <Stack.Screen name="profiles/[profileId]/health" options={{ title: 'Health information' }} />
      <Stack.Screen name="profiles/[profileId]/sharing" options={{ title: 'Sharing and invitations' }} />
    </Stack>
  );
}
