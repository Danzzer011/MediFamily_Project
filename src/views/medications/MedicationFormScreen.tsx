import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import { useThemeColors } from '../../theme';
import {
  useMedicationFormViewModel,
  type FromPrescription,
} from '../../viewmodels/medications/useMedicationFormViewModel';

// Add medication (no medicationId) or edit / remove one (FR03).
// `fromPrescription` starts a new schedule from a prescribed medicine (FR04).
export default function MedicationFormScreen({
  profileId,
  medicationId,
  fromPrescription,
}: {
  profileId: string;
  medicationId?: string;
  fromPrescription?: FromPrescription;
}) {
  const colors = useThemeColors();
  const vm = useMedicationFormViewModel(profileId, medicationId, fromPrescription);

  async function save() {
    const saved = await vm.save();
    if (saved) router.back();
  }

  async function confirmDelete() {
    const deleted = await vm.confirmDelete();
    if (deleted) router.back();
  }

  if (vm.loading) return <LoadingView message="Loading medication…" />;
  if (vm.loadError) {
    return <ErrorView message={vm.loadError} actionTitle="Back to medications" onAction={() => router.back()} />;
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: vm.isEditing ? 'Edit medication' : 'Add medication' }} />
      {vm.formError ? <ErrorBanner message={vm.formError} /> : null}
      {vm.staleRecord ? (
        <Button title="Discard my edits and load latest" variant="secondary" onPress={vm.reloadLatest} />
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextField
          label="Medication name"
          value={vm.name}
          onChangeText={vm.changeName}
          error={vm.nameError}
          placeholder="e.g. Metformin 500 mg"
          autoCapitalize="words"
        />
        <TextField
          label="Dosage instructions"
          value={vm.dosage}
          onChangeText={vm.changeDosage}
          error={vm.dosageError}
          placeholder="e.g. 1 tablet after breakfast"
          multiline
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily reminder times</Text>
        <Text style={[styles.muted, { color: colors.textMuted }]}>
          24-hour format, e.g. 08:00 or 20:30. Add one time for each dose of the day.
        </Text>
        {vm.timesError ? <Text style={[styles.error, { color: colors.danger }]}>{vm.timesError}</Text> : null}
        {vm.times.map((time, index) => (
          <View key={time.key} style={styles.timeRow}>
            <View style={styles.timeField}>
              <TextField
                label={`Time ${index + 1}`}
                value={time.value}
                onChangeText={(text) => vm.changeTime(time.key, text)}
                error={vm.timeErrors[time.key]}
                placeholder="HH:mm"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove time ${index + 1}`}
              onPress={() => vm.removeTime(time.key)}
              style={styles.removeButton}>
              <Text style={[styles.remove, { color: colors.danger }]}>Remove</Text>
            </Pressable>
          </View>
        ))}
        <Button title="Add reminder time" variant="secondary" onPress={vm.addTime} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Treatment period</Text>
        <TextField
          label="Start date"
          value={vm.startDate}
          onChangeText={vm.changeStartDate}
          error={vm.startError}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        <TextField
          label="End date (optional)"
          value={vm.endDate}
          onChangeText={vm.changeEndDate}
          error={vm.endError}
          hint="Leave blank if there is no end date — reminders continue until the medication is removed."
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
      </View>

      <Button title={vm.isEditing ? 'Save changes' : 'Add medication'} loading={vm.saving} onPress={save} />
      <Button title="Cancel" variant="secondary" disabled={vm.saving} onPress={() => router.back()} />
      {vm.isEditing ? (
        <Button title="Remove medication" variant="danger" disabled={vm.saving} onPress={vm.askToDelete} />
      ) : null}
      <DemoDataNotice />

      <ConfirmDialog
        visible={vm.confirmingDelete}
        title={`Remove ${vm.name.trim() || 'this medication'}?`}
        message={
          'This removes the medication schedule and its stock details. ' +
          'Prescriptions that list this medicine keep their written details.'
        }
        confirmTitle="Remove medication"
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
  card: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  muted: { fontSize: 14 },
  error: { fontSize: 13 },
  timeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timeField: { flex: 1 },
  removeButton: { marginTop: 36, paddingVertical: 6, paddingHorizontal: 4 },
  remove: { fontSize: 15, fontWeight: '700' },
});
