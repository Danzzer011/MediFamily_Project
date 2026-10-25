import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import AttachmentPreview from '../../components/AttachmentPreview';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import Screen from '../../components/Screen';
import { formatIsoDate } from '../../models/dates';
import { useThemeColors } from '../../theme';
import { usePrescriptionDetailsViewModel } from '../../viewmodels/prescriptions/usePrescriptionDetailsViewModel';

// One prescription (FR04): doctor, visit, prescribed medicines with their schedules, and the attachment.
export default function PrescriptionDetailsScreen({
  profileId,
  prescriptionId,
}: {
  profileId: string;
  prescriptionId: string;
}) {
  const colors = useThemeColors();
  const vm = usePrescriptionDetailsViewModel(prescriptionId);

  async function confirmDelete() {
    const deleted = await vm.confirmDelete();
    if (deleted) router.back();
  }

  if (vm.loading) return <LoadingView message="Loading prescription…" />;
  if (vm.loadError || !vm.prescription) {
    return <ErrorView message={vm.loadError} actionTitle="Back to prescriptions" onAction={() => router.back()} />;
  }
  const prescription = vm.prescription;

  return (
    <Screen>
      <Stack.Screen options={{ title: prescription.doctorName }} />

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text accessibilityRole="header" style={[styles.doctor, { color: colors.text }]}>
          {prescription.doctorName}
        </Text>
        <Text style={[styles.muted, { color: colors.textMuted }]}>{prescription.speciality}</Text>
        <Text style={[styles.muted, { color: colors.textMuted }]}>Visit on {formatIsoDate(prescription.visitDate)}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Prescribed medicines</Text>
        {prescription.medicines.map((medicine) => {
          const linked = vm.linkedMedication(medicine.medicationId);
          return (
            <View key={medicine.id} style={[styles.medicine, { borderColor: colors.border }]}>
              <Text style={[styles.medicineName, { color: colors.text }]}>{medicine.medicineName}</Text>
              {medicine.dosageInstructions ? (
                <Text style={[styles.body, { color: colors.text }]}>{medicine.dosageInstructions}</Text>
              ) : null}
              {linked ? (
                <Button
                  title={`Schedule: ${linked.name}`}
                  variant="secondary"
                  onPress={() => router.push(`/profiles/${profileId}/medications/${linked.id}`)}
                />
              ) : (
                <Button
                  title="Create medication schedule"
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: '/profiles/[profileId]/medications/new',
                      params: {
                        profileId,
                        prescriptionId: prescription.id,
                        prescriptionVersion: String(prescription.version),
                        medicineId: medicine.id,
                        name: medicine.medicineName,
                        dosage: medicine.dosageInstructions ?? '',
                      },
                    })
                  }
                />
              )}
            </View>
          );
        })}
        <Text style={[styles.note, { color: colors.textMuted }]}>
          Changing or removing a schedule never changes what is written on the prescription.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Attachment</Text>
        {prescription.attachment ? (
          <AttachmentPreview
            file={{
              uri: prescription.attachment.storagePath,
              fileName: prescription.attachment.originalFileName,
              mimeType: prescription.attachment.mimeType,
            }}
          />
        ) : (
          <Text style={[styles.muted, { color: colors.textMuted }]}>No photo or PDF attached.</Text>
        )}
      </View>

      <Button
        title="Edit prescription"
        onPress={() => router.push(`/profiles/${profileId}/prescriptions/${prescription.id}/edit`)}
      />
      <Button title="Delete prescription" variant="danger" onPress={vm.askToDelete} />
      <DemoDataNotice />

      <ConfirmDialog
        visible={vm.confirmingDelete}
        title="Delete this prescription?"
        message={
          `This deletes the prescription from ${prescription.doctorName} and its medicine list. ` +
          'Medication schedules created from it and its attached document are kept.'
        }
        confirmTitle="Delete prescription"
        destructive
        loading={vm.deleting}
        error={vm.deleteError}
        onConfirm={confirmDelete}
        onCancel={vm.cancelDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 10 },
  doctor: { fontSize: 22, fontWeight: '700' },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  muted: { fontSize: 15 },
  body: { fontSize: 15, lineHeight: 21 },
  medicine: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  medicineName: { fontSize: 16, fontWeight: '700' },
  note: { fontSize: 13 },
});
