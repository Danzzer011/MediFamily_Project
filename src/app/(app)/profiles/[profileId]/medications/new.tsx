import { useLocalSearchParams } from 'expo-router';

import MedicationFormScreen from '../../../../../views/medications/MedicationFormScreen';

// /profiles/<id>/medications/new, optionally with ?prescriptionId=…&medicineId=…
// when the schedule is created from a prescribed medicine (FR04).
export default function NewMedication() {
  const params = useLocalSearchParams<{
    profileId: string;
    prescriptionId?: string;
    prescriptionVersion?: string;
    medicineId?: string;
    name?: string;
    dosage?: string;
  }>();
  const fromPrescription =
    params.prescriptionId && params.medicineId
      ? {
          prescriptionId: params.prescriptionId,
          prescriptionVersion: Number(params.prescriptionVersion),
          medicineId: params.medicineId,
          name: params.name ?? '',
          dosage: params.dosage ?? '',
        }
      : undefined;
  return <MedicationFormScreen profileId={params.profileId} fromPrescription={fromPrescription} />;
}
