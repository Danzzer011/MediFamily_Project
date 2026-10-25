import { useLocalSearchParams } from 'expo-router';

import MedicationFormScreen from '../../../../../../views/medications/MedicationFormScreen';

// /profiles/<id>/medications/<medicationId> -> edit or remove that medication
export default function EditMedication() {
  const { profileId, medicationId } = useLocalSearchParams<{ profileId: string; medicationId: string }>();
  return <MedicationFormScreen profileId={profileId} medicationId={medicationId} />;
}
