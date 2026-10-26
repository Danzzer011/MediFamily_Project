import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import DateField from '../../components/ledger/DateField';
import Dock from '../../components/ledger/Dock';
import LedgerField from '../../components/ledger/LedgerField';
import LedgerScreen from '../../components/ledger/LedgerScreen';
import PageTitle from '../../components/ledger/PageTitle';
import SectionLabel from '../../components/ledger/SectionLabel';
import LinkAction from '../../components/LinkAction';
import LoadingView from '../../components/LoadingView';
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
  const title = vm.isEditing ? 'Edit medication' : 'Add medication';

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

      <SectionLabel label="Medicine" />
      <View style={styles.form}>
        <LedgerField
          label="Medication name"
          tag="Required"
          value={vm.name}
          onChangeText={vm.changeName}
          error={vm.nameError}
          placeholder="e.g. Metformin 500 mg"
          autoCapitalize="words"
        />
        <LedgerField
          label="Dosage instructions"
          tag="Required"
          value={vm.dosage}
          onChangeText={vm.changeDosage}
          error={vm.dosageError}
          placeholder="e.g. 1 tablet after breakfast"
          multiline
        />
      </View>

      <SectionLabel label="Daily reminder times" count={vm.times.length} />
      <View style={styles.form}>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          24-hour format, e.g. 08:00 or 20:30. Add one time for each dose of the day.
        </Text>
        {vm.timesError ? <Text style={[styles.error, { color: colors.danger }]}>{vm.timesError}</Text> : null}
        {vm.times.map((time, index) => (
          <View key={time.key} style={styles.timeRow}>
            <View style={styles.timeField}>
              <LedgerField
                label={`Time ${index + 1}`}
                mono
                value={time.value}
                onChangeText={(text) => vm.changeTime(time.key, text)}
                error={vm.timeErrors[time.key]}
                placeholder="HH:mm"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
            <View style={styles.removeTime}>
              <LinkAction label="Remove" danger accessibilityLabel={`Remove time ${index + 1}`} onPress={() => vm.removeTime(time.key)} />
            </View>
          </View>
        ))}
        <Button title="Add reminder time" variant="secondary" onPress={vm.addTime} />
      </View>

      <SectionLabel label="Treatment period" />
      <View style={styles.form}>
        <DateField label="Start date" tag="Required" value={vm.startDate} onChangeText={vm.changeStartDate} error={vm.startError} />
        <DateField
          label="End date"
          tag="Optional"
          value={vm.endDate}
          onChangeText={vm.changeEndDate}
          error={vm.endError}
          hint="Leave blank if there is no end date — reminders continue until the medication is removed."
        />
      </View>

      <Dock>
        <Button title={vm.isEditing ? 'Save changes' : 'Add medication'} loading={vm.saving} onPress={save} />
        <Button title="Cancel" variant="secondary" disabled={vm.saving} onPress={() => router.back()} />
      </Dock>
      {vm.isEditing ? (
        <View style={[styles.danger, { borderColor: colors.border }]}>
          <Button title="Remove medication" variant="danger" disabled={vm.saving} onPress={vm.askToDelete} />
        </View>
      ) : null}
      <View style={styles.demoNotice}>
        <DemoDataNotice />
      </View>

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
    </LedgerScreen>
  );
}

const styles = StyleSheet.create({
  padded: { paddingHorizontal: 16, gap: 12 },
  form: { paddingHorizontal: 16, gap: 14 },
  hint: { fontSize: 13, lineHeight: 18 },
  error: { fontSize: 13, fontWeight: '600' },
  timeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timeField: { flex: 1 },
  removeTime: { marginTop: 26 },
  danger: { marginTop: 28, paddingHorizontal: 16, paddingTop: 16, borderTopWidth: 1 },
  demoNotice: { paddingHorizontal: 16, paddingTop: 20 },
});
