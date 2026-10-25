import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import Screen from '../../components/Screen';
import { formatIsoDate } from '../../models/dates';
import { needsRefill, treatmentStatus, type Medication, type TreatmentStatus } from '../../models/Medication';
import { useThemeColors } from '../../theme';
import { useMedicationsViewModel } from '../../viewmodels/medications/useMedicationsViewModel';

const STATUS_LABELS: Record<TreatmentStatus, string> = {
  not_started: 'Not started yet',
  active: 'Active',
  ended: 'Treatment ended',
};

// Medications page (FR03): the profile's medication schedules, with a link to add one.
// Tapping a medication opens it for editing or removing.
export default function MedicationListScreen({ profileId }: { profileId: string }) {
  const colors = useThemeColors();
  const vm = useMedicationsViewModel(profileId);

  if (vm.loading) return <LoadingView message="Loading medications…" />;
  if (vm.loadError) {
    return <ErrorView message={vm.loadError} actionTitle="Back to profiles" onAction={() => router.dismissTo('/')} />;
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: `${vm.profileName} · Medications` }} />
      <Button title="Add medication" onPress={() => router.push(`/profiles/${profileId}/medications/new`)} />

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Reminders on this phone: {vm.remindersEnabled ? 'On' : 'Off'}
        </Text>
        {vm.remindersSupported ? (
          <>
            <Text style={[styles.muted, { color: colors.textMuted }]}>
              Only you get these reminders, on this phone. They name {vm.profileName} and the medication, and only
              happen during the treatment period. A reminder does not record that the dose was taken.
            </Text>
            {vm.reminderError ? <ErrorBanner message={vm.reminderError} /> : null}
            <Button
              title={vm.remindersEnabled ? 'Turn reminders off' : 'Turn reminders on'}
              variant="secondary"
              loading={vm.changingReminders}
              onPress={vm.toggleReminders}
            />
          </>
        ) : (
          <Text style={[styles.muted, { color: colors.textMuted }]}>
            Reminders need the MediFamily app on a phone. They are not available in the browser.
          </Text>
        )}
      </View>

      {vm.medications.length === 0 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No medications yet</Text>
          <Text style={[styles.muted, { color: colors.textMuted }]}>
            Add a medication with its dosage, daily reminder times and treatment dates.
          </Text>
        </View>
      ) : (
        vm.medications.map((medication) => (
          <MedicationCard
            key={medication.id}
            medication={medication}
            onPress={() => router.push(`/profiles/${profileId}/medications/${medication.id}`)}
          />
        ))
      )}

      <DemoDataNotice />
    </Screen>
  );
}

// One medication: name, dosage, reminder times and treatment period.
function MedicationCard({ medication, onPress }: { medication: Medication; onPress: () => void }) {
  const colors = useThemeColors();
  const status = treatmentStatus(medication);
  const period = medication.treatmentEnd
    ? `${formatIsoDate(medication.treatmentStart)} – ${formatIsoDate(medication.treatmentEnd)}`
    : `From ${formatIsoDate(medication.treatmentStart)} · no end date`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${medication.name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        status === 'ended' && styles.ended,
        pressed && styles.pressed,
      ]}>
      <View style={styles.header}>
        <Text style={[styles.name, { color: colors.text }]}>{medication.name}</Text>
        <Text style={[styles.badge, { color: colors.primary, borderColor: colors.primary }]}>{STATUS_LABELS[status]}</Text>
      </View>
      <Text style={[styles.dosage, { color: colors.text }]}>{medication.dosageInstructions}</Text>
      <View style={styles.times}>
        {medication.reminderTimes.map((time) => (
          <Text key={time} style={[styles.time, { backgroundColor: colors.notice, color: colors.primary }]}>
            {time}
          </Text>
        ))}
      </View>
      <Text style={[styles.muted, { color: colors.textMuted }]}>{period}</Text>
      {needsRefill(medication) ? (
        <Text style={[styles.refill, { color: colors.danger }]}>
          Refill needed: {medication.remainingQuantity} {medication.stockUnit} left
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 10 },
  pressed: { opacity: 0.8 },
  ended: { opacity: 0.6 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  name: { flex: 1, fontSize: 18, fontWeight: '700' },
  badge: { fontSize: 12, fontWeight: '700', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  dosage: { fontSize: 16, lineHeight: 22 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  time: { fontSize: 15, fontWeight: '700', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, overflow: 'hidden' },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  muted: { fontSize: 14 },
  refill: { fontSize: 14, fontWeight: '700' },
});
