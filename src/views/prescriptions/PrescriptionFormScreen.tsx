import { router, Stack } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import AttachmentPreview from '../../components/AttachmentPreview';
import Button from '../../components/Button';
import ChoiceChip from '../../components/ChoiceChip';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
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
    <Screen>
      <Stack.Screen options={{ title: vm.isEditing ? 'Edit prescription' : 'Add prescription' }} />
      {vm.formError ? <ErrorBanner message={vm.formError} /> : null}
      {vm.staleRecord ? (
        <Button title="Discard my edits and load latest" variant="secondary" onPress={vm.reloadLatest} />
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextField
          label="Doctor’s name"
          value={vm.doctorName}
          onChangeText={vm.changeDoctorName}
          error={vm.doctorError}
          placeholder="e.g. Dr. Sara Ahmed"
          autoCapitalize="words"
        />
        <TextField
          label="Speciality"
          value={vm.speciality}
          onChangeText={vm.changeSpeciality}
          error={vm.specialityError}
          placeholder="e.g. Cardiology"
          autoCapitalize="words"
        />
        <TextField
          label="Visit date"
          value={vm.visitDate}
          onChangeText={vm.changeVisitDate}
          error={vm.visitDateError}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Medicines</Text>
        <Text style={[styles.muted, { color: colors.textMuted }]}>
          Write each medicine as it appears on the prescription. You can link it to one of the profile’s medication
          schedules.
        </Text>
        {vm.medicinesError ? <Text style={[styles.error, { color: colors.danger }]}>{vm.medicinesError}</Text> : null}
        {vm.medicines.map((medicine, index) => (
          <View key={medicine.key} style={[styles.medicineCard, { borderColor: colors.border }]}>
            <View style={styles.medicineHeader}>
              <Text style={[styles.medicineTitle, { color: colors.text }]}>Medicine {index + 1}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove medicine ${index + 1}`}
                onPress={() => vm.removeMedicine(medicine.key)}>
                <Text style={[styles.remove, { color: colors.danger }]}>Remove</Text>
              </Pressable>
            </View>
            <TextField
              label="Medicine name"
              value={medicine.name}
              onChangeText={(text) => vm.changeMedicine(medicine.key, 'name', text)}
              error={vm.medicineErrors[medicine.key]}
              placeholder="e.g. Amoxicillin 500 mg"
            />
            <TextField
              label="Instructions (optional)"
              value={medicine.instructions}
              onChangeText={(text) => vm.changeMedicine(medicine.key, 'instructions', text)}
              placeholder="e.g. Every 8 hours for 7 days"
            />
            {vm.medicationOptions.length > 0 ? (
              <>
                <Text style={[styles.label, { color: colors.text }]}>Linked medication schedule</Text>
                <View accessibilityRole="radiogroup" style={styles.chips}>
                  <ChoiceChip
                    label="Not linked"
                    selected={medicine.medicationId === null}
                    onPress={() => vm.linkMedicine(medicine.key, null)}
                  />
                  {vm.medicationOptions.map((option) => (
                    <ChoiceChip
                      key={option.id}
                      label={option.name}
                      selected={medicine.medicationId === option.id}
                      onPress={() => vm.linkMedicine(medicine.key, option.id)}
                    />
                  ))}
                </View>
              </>
            ) : null}
          </View>
        ))}
        <Button title="Add medicine" variant="secondary" onPress={vm.addMedicine} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Attachment (optional)</Text>
        <Text style={[styles.muted, { color: colors.textMuted }]}>
          A photo or PDF of the prescription. It is also kept in the profile’s medical documents.
        </Text>
        {vm.attachmentError ? <ErrorBanner message={vm.attachmentError} /> : null}
        {vm.attachmentPreview ? (
          <>
            <AttachmentPreview file={vm.attachmentPreview} />
            <Button title="Remove attachment" variant="secondary" disabled={vm.pickingFile} onPress={vm.removeAttachment} />
          </>
        ) : null}
        {Platform.OS !== 'web' ? (
          <Button
            title={vm.attachmentPreview ? 'Take a new photo' : 'Take photo'}
            variant="secondary"
            loading={vm.pickingFile}
            onPress={() => vm.pickAttachment('camera')}
          />
        ) : null}
        <Button
          title="Choose image"
          variant="secondary"
          disabled={vm.pickingFile}
          onPress={() => vm.pickAttachment('image')}
        />
        <Button title="Choose PDF" variant="secondary" disabled={vm.pickingFile} onPress={() => vm.pickAttachment('pdf')} />
      </View>

      <Button title={vm.isEditing ? 'Save changes' : 'Add prescription'} loading={vm.saving} onPress={save} />
      <Button title="Cancel" variant="secondary" disabled={vm.saving} onPress={() => router.back()} />
      <DemoDataNotice />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  muted: { fontSize: 14 },
  label: { fontSize: 15, fontWeight: '600' },
  error: { fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  medicineCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 12 },
  medicineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  medicineTitle: { fontSize: 15, fontWeight: '700' },
  remove: { fontSize: 15, fontWeight: '700', paddingVertical: 6, paddingHorizontal: 4 },
});
