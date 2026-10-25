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
      <Stack.Screen name="profiles/[profileId]/medications/index" options={{ title: 'Medications' }} />
      <Stack.Screen name="profiles/[profileId]/medications/new" options={{ title: 'Add medication' }} />
      <Stack.Screen name="profiles/[profileId]/medications/[medicationId]/index" options={{ title: 'Edit medication' }} />
      <Stack.Screen name="profiles/[profileId]/medications/[medicationId]/stock" options={{ title: 'Update stock' }} />
      <Stack.Screen name="profiles/[profileId]/stock" options={{ title: 'Medicine stock' }} />
      <Stack.Screen name="profiles/[profileId]/prescriptions/index" options={{ title: 'Prescriptions' }} />
      <Stack.Screen name="profiles/[profileId]/prescriptions/new" options={{ title: 'Add prescription' }} />
      <Stack.Screen name="profiles/[profileId]/prescriptions/[prescriptionId]/index" options={{ title: 'Prescription' }} />
      <Stack.Screen name="profiles/[profileId]/prescriptions/[prescriptionId]/edit" options={{ title: 'Edit prescription' }} />
    </Stack>
  );
}
