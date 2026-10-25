import { useLocalSearchParams } from 'expo-router';

import PrescriptionDetailsScreen from '../../../../../../views/prescriptions/PrescriptionDetailsScreen';

// /profiles/<id>/prescriptions/<prescriptionId> -> that prescription's page
export default function PrescriptionDetails() {
  const { profileId, prescriptionId } = useLocalSearchParams<{ profileId: string; prescriptionId: string }>();
  return <PrescriptionDetailsScreen profileId={profileId} prescriptionId={prescriptionId} />;
}
