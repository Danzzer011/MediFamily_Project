import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import ChoiceChip from '../../components/ChoiceChip';
import ConfirmDialog from '../../components/ConfirmDialog';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import DateColumn from '../../components/ledger/DateColumn';
import HeaderCancel from '../../components/ledger/HeaderCancel';
import Icon from '../../components/ledger/Icon';
import LedgerField from '../../components/ledger/LedgerField';
import LedgerList from '../../components/ledger/LedgerList';
import LedgerScreen from '../../components/ledger/LedgerScreen';
import PageTitle from '../../components/ledger/PageTitle';
import SectionLabel from '../../components/ledger/SectionLabel';
import LoadingView from '../../components/LoadingView';
import { dayParts, splitTimestamp } from '../../models/dateTime';
import { formatIsoDate } from '../../models/dates';
import { formatReading, MEASUREMENT_TYPES, UNITS_BY_TYPE, type Measurement } from '../../models/Measurement';
import { useThemeColors } from '../../theme';
import { useMeasurementsViewModel } from '../../viewmodels/measurements/useMeasurementsViewModel';

// Health Measurements page (FR08): the selected profile's readings with a type filter and an add/edit form.
// It only shows the saved numbers: no diagnosis, no warnings.
export default function MeasurementsScreen({ profileId }: { profileId: string }) {
  const colors = useThemeColors();
  const vm = useMeasurementsViewModel(profileId);

  if (vm.loading) return <LoadingView message="Loading measurements…" />;
  if (vm.loadError || !vm.profile) {
    return <ErrorView message={vm.loadError} actionTitle="Back to profiles" onAction={() => router.dismissTo('/')} />;
  }
  const profile = vm.profile;

  // ---- add / edit form ----
  if (vm.editing) {
    const isPressure = vm.type === 'blood pressure';
    const pending = vm.pendingDelete;
    const when = pending ? splitTimestamp(pending.measuredAt, vm.zone) : null;
    return (
      <LedgerScreen>
        <Stack.Screen options={{ title: profile.name, headerBackVisible: false, headerLeft: () => <HeaderCancel onPress={vm.cancelEditing} /> }} />
        <PageTitle text={vm.isNew ? 'New measurement' : 'Edit measurement'} />
        {vm.formError ? <ErrorBanner message={vm.formError} /> : null}
        <View style={styles.form}>
          <View style={styles.block}>
            <Text style={[styles.label, { color: colors.text }]}>Type</Text>
            <View accessibilityRole="radiogroup" style={styles.chips}>
              {MEASUREMENT_TYPES.map((t) => (
                <ChoiceChip key={t} label={capitalize(t)} selected={vm.type === t} onPress={() => vm.changeType(t)} />
              ))}
            </View>
          </View>

          {isPressure ? (
            <View style={styles.pair}>
              <View style={styles.half}>
                <LedgerField label="Top number" tag="Systolic" value={vm.value} onChangeText={vm.setValue} error={vm.errors.value} keyboardType="decimal-pad" />
              </View>
              <View style={styles.half}>
                <LedgerField label="Bottom number" tag="Diastolic" value={vm.diastolic} onChangeText={vm.setDiastolic} error={vm.errors.diastolic} keyboardType="decimal-pad" />
              </View>
            </View>
          ) : (
            <LedgerField label="Value" tag="Required" value={vm.value} onChangeText={vm.setValue} error={vm.errors.value} keyboardType="decimal-pad" />
          )}

          <View style={styles.block}>
            <Text style={[styles.label, { color: colors.text }]}>Unit</Text>
            <View accessibilityRole="radiogroup" style={styles.chips}>
              {UNITS_BY_TYPE[vm.type].map((u) => (
                <ChoiceChip key={u} label={u} selected={vm.unit === u} onPress={() => vm.setUnit(u)} />
              ))}
            </View>
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              {isPressure ? 'Blood pressure is always in mmHg.' : 'The unit is saved with the reading and shown next to it.'}
            </Text>
          </View>

          <View style={styles.pair}>
            <View style={styles.wide}>
              <LedgerField
                label="Date"
                tag="Required"
                mono
                value={vm.date}
                onChangeText={vm.setDate}
                error={vm.errors.date}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={styles.narrow}>
              <LedgerField
                label="Time"
                tag="Required"
                mono
                value={vm.time}
                onChangeText={vm.setTime}
                error={vm.errors.time}
                placeholder="07:30"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        </View>

        <View style={[styles.dock, { borderColor: colors.border }]}>
          <Button title={vm.isNew ? 'Save measurement' : 'Save changes'} loading={vm.saving} onPress={vm.save} />
          {typeof vm.editing === 'object' ? (
            <View style={styles.deleteGap}>
              <Button title="Delete measurement" variant="danger" disabled={vm.saving} onPress={() => vm.askToDelete(vm.editing as Measurement)} />
            </View>
          ) : null}
        </View>

        <ConfirmDialog
          visible={pending !== null}
          title={`Delete this ${pending?.type ?? ''} reading?`}
          message={`${pending ? formatReading(pending) : ''}, measured on ${when ? formatIsoDate(when.date) : ''} at ${when?.time ?? ''}, will be deleted for ${profile.name}. This cannot be undone.`}
          confirmTitle="Delete"
          destructive
          loading={vm.deleting}
          error={vm.deleteError}
          onConfirm={vm.confirmDelete}
          onCancel={vm.cancelDelete}
        />
      </LedgerScreen>
    );
  }

  // ---- list ----
  return (
    <LedgerScreen>
      <Stack.Screen options={{ title: profile.name, headerBackVisible: true, headerLeft: undefined }} />
      <PageTitle text="Health measurements" />
      {vm.total > 0 ? (
        <>
          <View accessibilityRole="radiogroup" style={styles.filters}>
            <ChoiceChip label="All" selected={vm.filter === 'all'} onPress={() => vm.setFilter('all')} />
            {MEASUREMENT_TYPES.map((t) => (
              <ChoiceChip key={t} label={capitalize(t)} selected={vm.filter === t} onPress={() => vm.setFilter(t)} />
            ))}
          </View>
          <SectionLabel label="Newest first" count={vm.visible.length} />
          {vm.visible.length > 0 ? (
            <LedgerList>
              {vm.visible.map((m) => (
                <ReadingRow key={m.id} measurement={m} zone={vm.zone} onOpen={() => vm.startEditing(m)} />
              ))}
            </LedgerList>
          ) : (
            <Text style={[styles.noneText, { color: colors.textMuted }]}>{`No ${vm.filter} readings yet.`}</Text>
          )}
          <View style={[styles.dock, { borderColor: colors.border }]}>
            <Button title="Add measurement" onPress={vm.startAdding} />
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text accessibilityRole="header" style={[styles.emptyTitle, { color: colors.text }]}>{`No measurements for ${profile.name} yet.`}</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Add a blood pressure, blood glucose or weight reading.</Text>
          <Button title="Add the first measurement" onPress={vm.startAdding} />
        </View>
      )}
      <View style={styles.noticeWrap}>
        <DemoDataNotice />
      </View>
    </LedgerScreen>
  );
}

// One reading: date and time, the type, then the number with its saved unit beside it.
function ReadingRow({ measurement: m, zone, onOpen }: { measurement: Measurement; zone: string; onOpen: () => void }) {
  const colors = useThemeColors();
  const p = dayParts(m.measuredAt, zone);
  const number = m.type === 'blood pressure' ? `${m.value}/${m.diastolic}` : String(m.value);

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${m.type} reading ${formatReading(m)}`} onPress={onOpen} style={styles.row}>
      <DateColumn top={`${p.day} ${p.month}`} bottom={p.time} />
      <View style={styles.rowBody}>
        <Text style={[styles.type, { color: colors.textMuted }]}>{m.type}</Text>
        <Text style={[styles.reading, { color: colors.text }]}>
          {number} <Text style={[styles.unit, { color: colors.textMuted }]}>{m.unit}</Text>
        </Text>
      </View>
      <Icon name="next" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  rowBody: { flex: 1, minWidth: 0 },
  type: { fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  reading: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  unit: { fontSize: 14, fontWeight: '400' },
  noneText: { paddingHorizontal: 16, paddingTop: 8, fontSize: 16, lineHeight: 22 },
  dock: { marginTop: 20, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  deleteGap: { marginTop: 16 },
  noticeWrap: { paddingHorizontal: 16, paddingTop: 20 },
  empty: { paddingHorizontal: 16, paddingTop: 24, gap: 8 },
  emptyTitle: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  emptyText: { fontSize: 16, lineHeight: 22, marginBottom: 10 },
  form: { paddingHorizontal: 16, gap: 14 },
  block: { gap: 6 },
  label: { fontSize: 15, fontWeight: '600' },
  hint: { fontSize: 13, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pair: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  wide: { flex: 1.25 },
  narrow: { flex: 1 },
});
