import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import Button from '../../components/Button';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import Dock from '../../components/ledger/Dock';
import Icon from '../../components/ledger/Icon';
import LedgerList from '../../components/ledger/LedgerList';
import LedgerScreen from '../../components/ledger/LedgerScreen';
import PageTitle from '../../components/ledger/PageTitle';
import SectionLabel from '../../components/ledger/SectionLabel';
import LoadingView from '../../components/LoadingView';
import { formatIsoDate } from '../../models/dates';
import { needsRefill, treatmentStatus, type Medication, type TreatmentStatus } from '../../models/Medication';
import { useThemeColors } from '../../theme';
import { monoFont } from '../../theme/medifamily-theme';
import { useMedicationsViewModel } from '../../viewmodels/medications/useMedicationsViewModel';

// The list is split by treatment period, current medications first.
const GROUPS: { status: TreatmentStatus; label: string }[] = [
  { status: 'active', label: 'Taking now' },
  { status: 'not_started', label: 'Not started yet' },
  { status: 'ended', label: 'Treatment ended' },
];

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
    <LedgerScreen>
      <Stack.Screen options={{ title: `${vm.profileName} · Medications` }} />
      <PageTitle text="Medications" />

      {/* this phone's reminder setting for the profile */}
      {vm.remindersSupported ? (
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: vm.remindersEnabled, busy: vm.changingReminders }}
          accessibilityLabel={`Medication reminders for ${vm.profileName} on this phone`}
          disabled={vm.changingReminders}
          onPress={vm.toggleReminders}
          style={[styles.reminders, { borderColor: colors.border }]}>
          <Icon name="bell" size={20} color={colors.text} />
          <View style={styles.remindersText}>
            <Text style={[styles.remindersTitle, { color: colors.text }]}>Reminders on this phone</Text>
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Only you get these reminders, on this phone. They name {vm.profileName} and the medication, and only happen
              during the treatment period. A reminder does not record that the dose was taken.
            </Text>
          </View>
          <View pointerEvents="none">
            <Switch value={vm.remindersEnabled} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} />
          </View>
        </Pressable>
      ) : (
        <View style={[styles.reminders, { borderColor: colors.border }]}>
          <Icon name="bell" size={20} color={colors.textMuted} />
          <Text style={[styles.hint, styles.remindersText, { color: colors.textMuted }]}>
            Reminders need the MediFamily app on a phone. They are not available in the browser.
          </Text>
        </View>
      )}
      {vm.reminderError ? (
        <View style={styles.padded}>
          <ErrorBanner message={vm.reminderError} />
        </View>
      ) : null}

      {vm.medications.length === 0 ? (
        <View style={styles.empty}>
          <Text accessibilityRole="header" style={[styles.emptyTitle, { color: colors.text }]}>No medications yet</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Add a medication with its dosage, daily reminder times and treatment dates.
          </Text>
        </View>
      ) : (
        GROUPS.map((group) => {
          const items = vm.medications.filter((m) => treatmentStatus(m) === group.status);
          if (items.length === 0) return null;
          return (
            <View key={group.status}>
              <SectionLabel label={group.label} count={items.length} />
              <LedgerList>
                {items.map((medication) => (
                  <MedicationRow
                    key={medication.id}
                    medication={medication}
                    onPress={() => router.push(`/profiles/${profileId}/medications/${medication.id}`)}
                  />
                ))}
              </LedgerList>
            </View>
          );
        })
      )}

      <Dock>
        <Button title="Add medication" onPress={() => router.push(`/profiles/${profileId}/medications/new`)} />
      </Dock>
      <View style={styles.demoNotice}>
        <DemoDataNotice />
      </View>
    </LedgerScreen>
  );
}

// One medication: name, dosage, reminder times and treatment period.
function MedicationRow({ medication, onPress }: { medication: Medication; onPress: () => void }) {
  const colors = useThemeColors();
  const period = medication.treatmentEnd
    ? `${formatIsoDate(medication.treatmentStart)} – ${formatIsoDate(medication.treatmentEnd)}`
    : `From ${formatIsoDate(medication.treatmentStart)} · no end date`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${medication.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.notice }]}>
      <View style={styles.rowBody}>
        <Text style={[styles.name, { color: colors.text }]}>{medication.name}</Text>
        <Text style={[styles.dosage, { color: colors.text }]}>{medication.dosageInstructions}</Text>
        <View style={styles.times}>
          {medication.reminderTimes.map((time) => (
            <Text key={time} style={[styles.time, { backgroundColor: colors.notice, color: colors.primary, fontFamily: monoFont }]}>
              {time}
            </Text>
          ))}
        </View>
        <Text style={[styles.period, { color: colors.textMuted }]}>{period}</Text>
        {needsRefill(medication) ? (
          <Text style={[styles.refill, { color: colors.danger }]}>
            Refill needed: {medication.remainingQuantity} {medication.stockUnit} left
          </Text>
        ) : null}
      </View>
      <Icon name="next" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  reminders: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1 },
  remindersText: { flex: 1 },
  remindersTitle: { fontSize: 15, fontWeight: '600' },
  hint: { fontSize: 13, lineHeight: 18 },
  padded: { paddingHorizontal: 16, paddingTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  rowBody: { flex: 1, gap: 4 },
  name: { fontSize: 17, fontWeight: '700' },
  dosage: { fontSize: 15, lineHeight: 21 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  time: { fontSize: 14, fontWeight: '700', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2, overflow: 'hidden' },
  period: { fontSize: 13 },
  refill: { fontSize: 14, fontWeight: '700' },
  empty: { paddingHorizontal: 16, paddingTop: 24, gap: 8 },
  emptyTitle: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  emptyText: { fontSize: 16, lineHeight: 22 },
  demoNotice: { paddingHorizontal: 16, paddingTop: 20 },
});
