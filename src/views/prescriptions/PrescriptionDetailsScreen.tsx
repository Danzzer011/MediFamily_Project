import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import AttachmentPreview from '../../components/AttachmentPreview';
import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorView from '../../components/ErrorView';
import Dock from '../../components/ledger/Dock';
import LedgerList from '../../components/ledger/LedgerList';
import LedgerScreen from '../../components/ledger/LedgerScreen';
import SectionLabel from '../../components/ledger/SectionLabel';
import LinkAction from '../../components/LinkAction';
import LoadingView from '../../components/LoadingView';
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
    <LedgerScreen>
      <Stack.Screen options={{ title: prescription.doctorName }} />

      {/* who wrote it and when */}
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.doctor, { color: colors.text }]}>
          {prescription.doctorName}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {prescription.speciality} · Visit on {formatIsoDate(prescription.visitDate)}
        </Text>
      </View>

      <SectionLabel label="Prescribed medicines" count={prescription.medicines.length} />
      <LedgerList>
        {prescription.medicines.map((medicine) => {
          const linked = vm.linkedMedication(medicine.medicationId);
          return (
            <View key={medicine.id} style={styles.medicine}>
              <Text style={[styles.medicineName, { color: colors.text }]}>{medicine.medicineName}</Text>
              {medicine.dosageInstructions ? (
                <Text style={[styles.body, { color: colors.text }]}>{medicine.dosageInstructions}</Text>
              ) : null}
              {linked ? (
                <LinkAction
                  label={`Schedule: ${linked.name}`}
                  icon="next"
                  accessibilityLabel={`Open the schedule ${linked.name}`}
                  onPress={() => router.push(`/profiles/${profileId}/medications/${linked.id}`)}
                />
              ) : (
                <LinkAction
                  label="Create medication schedule"
                  icon="calendar-plus"
                  accessibilityLabel={`Create a medication schedule for ${medicine.medicineName}`}
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
      </LedgerList>
      <Text style={[styles.note, { color: colors.textMuted }]}>
        Changing or removing a schedule never changes what is written on the prescription.
      </Text>

      <SectionLabel label="Attachment" />
      <View style={styles.padded}>
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

      <Dock>
        <Button title="Edit prescription" onPress={() => router.push(`/profiles/${profileId}/prescriptions/${prescription.id}/edit`)} />
      </Dock>
      <View style={[styles.danger, { borderColor: colors.border }]}>
        <Button title="Delete prescription" variant="danger" onPress={vm.askToDelete} />
      </View>
      <View style={styles.demoNotice}>
        <DemoDataNotice />
      </View>

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
    </LedgerScreen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 16, gap: 4 },
  doctor: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  meta: { fontSize: 15 },
  medicine: { paddingTop: 12, paddingBottom: 4, paddingHorizontal: 16, gap: 2 },
  medicineName: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 21 },
  note: { fontSize: 13, paddingHorizontal: 16, paddingTop: 8 },
  padded: { paddingHorizontal: 16 },
  muted: { fontSize: 15 },
  danger: { marginTop: 28, paddingHorizontal: 16, paddingTop: 16, borderTopWidth: 1 },
  demoNotice: { paddingHorizontal: 16, paddingTop: 20 },
});
