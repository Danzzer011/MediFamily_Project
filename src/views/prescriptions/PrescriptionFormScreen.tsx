import { router, Stack } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';

import AttachmentPreview from '../../components/AttachmentPreview';
import Button from '../../components/Button';
import ChoiceChip from '../../components/ChoiceChip';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import DateField from '../../components/ledger/DateField';
import Dock from '../../components/ledger/Dock';
import LedgerField from '../../components/ledger/LedgerField';
import LedgerList from '../../components/ledger/LedgerList';
import LedgerScreen from '../../components/ledger/LedgerScreen';
import PageTitle from '../../components/ledger/PageTitle';
import SectionLabel from '../../components/ledger/SectionLabel';
import LinkAction from '../../components/LinkAction';
import LoadingView from '../../components/LoadingView';
import { useThemeColors } from '../../theme';
import { usePrescriptionFormViewModel } from '../../viewmodels/prescriptions/usePrescriptionFormViewModel';

// Add a prescription (no prescriptionId) or edit one (FR04).
export default function PrescriptionFormScreen({
  profileId,
  prescriptionId,
}: {
  profileId: string;
  prescriptionId?: string;
}) {
  const colors = useThemeColors();
  const vm = usePrescriptionFormViewModel(profileId, prescriptionId);
  const title = vm.isEditing ? 'Edit prescription' : 'Add prescription';

  async function save() {
    const savedId = await vm.save();
    if (!savedId) return;
    if (vm.isEditing) router.back();
    else router.replace(`/profiles/${profileId}/prescriptions/${savedId}`);
  }

  if (vm.loading) return <LoadingView message="Loading prescription…" />;
  if (vm.loadError) {
    return <ErrorView message={vm.loadError} actionTitle="Back" onAction={() => router.back()} />;
  }

  return (
    <LedgerScreen>
      <Stack.Screen options={{ title }} />
      <PageTitle text={title} />
      {vm.formError || vm.staleRecord ? (
        <View style={styles.padded}>
          {vm.formError ? <ErrorBanner message={vm.formError} /> : null}
          {vm.staleRecord ? (
            <Button title="Discard my edits and load latest" variant="secondary" onPress={vm.reloadLatest} />
          ) : null}
        </View>
      ) : null}

      <SectionLabel label="Visit" />
      <View style={styles.form}>
        <LedgerField
          label="Doctor’s name"
          tag="Required"
          value={vm.doctorName}
          onChangeText={vm.changeDoctorName}
          error={vm.doctorError}
          placeholder="e.g. Dr. Sara Ahmed"
          autoCapitalize="words"
        />
        <LedgerField
          label="Speciality"
          tag="Required"
          value={vm.speciality}
          onChangeText={vm.changeSpeciality}
          error={vm.specialityError}
          placeholder="e.g. Cardiology"
          autoCapitalize="words"
        />
        <DateField label="Visit date" tag="Required" value={vm.visitDate} onChangeText={vm.changeVisitDate} error={vm.visitDateError} />
      </View>

      <SectionLabel label="Medicines" count={vm.medicines.length} />
      <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
        Write each medicine as it appears on the prescription. You can link it to one of the profile’s medication schedules.
      </Text>
      {vm.medicinesError ? <Text style={[styles.error, { color: colors.danger }]}>{vm.medicinesError}</Text> : null}
      {vm.medicines.length > 0 ? (
        <LedgerList>
          {vm.medicines.map((medicine, index) => (
            <View key={medicine.key} style={styles.medicine}>
              <View style={styles.medicineHeader}>
                <Text style={[styles.medicineTitle, { color: colors.text }]}>Medicine {index + 1}</Text>
                <LinkAction label="Remove" danger accessibilityLabel={`Remove medicine ${index + 1}`} onPress={() => vm.removeMedicine(medicine.key)} />
              </View>
              <LedgerField
                label="Medicine name"
                tag="Required"
                value={medicine.name}
                onChangeText={(text) => vm.changeMedicine(medicine.key, 'name', text)}
                error={vm.medicineErrors[medicine.key]}
                placeholder="e.g. Amoxicillin 500 mg"
              />
              <LedgerField
                label="Instructions"
                tag="Optional"
                value={medicine.instructions}
                onChangeText={(text) => vm.changeMedicine(medicine.key, 'instructions', text)}
                placeholder="e.g. Every 8 hours for 7 days"
              />
              {vm.medicationOptions.length > 0 ? (
                <View style={styles.block}>
                  <Text style={[styles.label, { color: colors.text }]}>Linked medication schedule</Text>
                  <View accessibilityRole="radiogroup" style={styles.chips}>
                    <ChoiceChip label="Not linked" selected={medicine.medicationId === null} onPress={() => vm.linkMedicine(medicine.key, null)} />
                    {vm.medicationOptions.map((option) => (
                      <ChoiceChip
                        key={option.id}
                        label={option.name}
                        selected={medicine.medicationId === option.id}
                        onPress={() => vm.linkMedicine(medicine.key, option.id)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          ))}
        </LedgerList>
      ) : null}
      <View style={styles.padded}>
        <Button title="Add medicine" variant="secondary" onPress={vm.addMedicine} />
      </View>

      <SectionLabel label="Attachment (optional)" />
      <View style={styles.form}>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          A photo or PDF of the prescription. It is also kept in the profile’s medical documents.
        </Text>
        {vm.attachmentError ? <ErrorBanner message={vm.attachmentError} /> : null}
        {vm.attachmentPreview ? (
          <>
            <AttachmentPreview file={vm.attachmentPreview} />
            <Button title="Remove attachment" variant="secondary" disabled={vm.pickingFile} onPress={vm.removeAttachment} />
          </>
        ) : null}
        <View style={styles.pickers}>
          {Platform.OS !== 'web' ? (
            <View style={styles.picker}>
              <Button
                title={vm.attachmentPreview ? 'New photo' : 'Take photo'}
                variant="secondary"
                loading={vm.pickingFile}
                onPress={() => vm.pickAttachment('camera')}
              />
            </View>
          ) : null}
          <View style={styles.picker}>
            <Button title="Choose image" variant="secondary" disabled={vm.pickingFile} onPress={() => vm.pickAttachment('image')} />
          </View>
          <View style={styles.picker}>
            <Button title="Choose PDF" variant="secondary" disabled={vm.pickingFile} onPress={() => vm.pickAttachment('pdf')} />
          </View>
        </View>
      </View>

      <Dock>
        <Button title={vm.isEditing ? 'Save changes' : 'Add prescription'} loading={vm.saving} onPress={save} />
        <Button title="Cancel" variant="secondary" disabled={vm.saving} onPress={() => router.back()} />
      </Dock>
      <View style={styles.demoNotice}>
        <DemoDataNotice />
      </View>
    </LedgerScreen>
  );
}

const styles = StyleSheet.create({
  padded: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  form: { paddingHorizontal: 16, gap: 14 },
  sectionHint: { fontSize: 13, lineHeight: 18, paddingHorizontal: 16, paddingBottom: 8 },
  hint: { fontSize: 13, lineHeight: 18 },
  error: { fontSize: 13, fontWeight: '600', paddingHorizontal: 16, paddingBottom: 8 },
  medicine: { padding: 16, gap: 12 },
  medicineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  medicineTitle: { fontSize: 15, fontWeight: '700' },
  block: { gap: 6 },
  label: { fontSize: 15, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickers: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  picker: { flexGrow: 1, flexBasis: 120 },
  demoNotice: { paddingHorizontal: 16, paddingTop: 20 },
});
