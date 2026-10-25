import { useLocalSearchParams } from 'expo-router';

import PrescriptionFormScreen from '../../../../../../views/prescriptions/PrescriptionFormScreen';

export default function EditPrescription() {
  const { profileId, prescriptionId } = useLocalSearchParams<{ profileId: string; prescriptionId: string }>();
  return <PrescriptionFormScreen profileId={profileId} prescriptionId={prescriptionId} />;
}
