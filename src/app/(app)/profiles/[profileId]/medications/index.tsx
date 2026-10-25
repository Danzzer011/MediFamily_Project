import { useLocalSearchParams } from 'expo-router';

import MedicationListScreen from '../../../../../views/medications/MedicationListScreen';

export default function Medications() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  return <MedicationListScreen profileId={profileId} />;
}
