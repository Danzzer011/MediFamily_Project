import { useLocalSearchParams } from 'expo-router';

import PrescriptionListScreen from '../../../../../views/prescriptions/PrescriptionListScreen';

export default function Prescriptions() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  return <PrescriptionListScreen profileId={profileId} />;
}
