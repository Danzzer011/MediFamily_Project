import { useLocalSearchParams } from 'expo-router';

import PrescriptionFormScreen from '../../../../../views/prescriptions/PrescriptionFormScreen';

export default function NewPrescription() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  return <PrescriptionFormScreen profileId={profileId} />;
}
