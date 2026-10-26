import { useLocalSearchParams } from 'expo-router';

import AppointmentsScreen from '../../../../views/appointments/AppointmentsScreen';

export default function Appointments() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  return <AppointmentsScreen profileId={profileId} />;
}
