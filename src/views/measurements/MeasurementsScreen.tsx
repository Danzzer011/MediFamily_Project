import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import ChoiceChip from '../../components/ChoiceChip';
import ConfirmDialog from '../../components/ConfirmDialog';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import DateColumn from '../../components/ledger/DateColumn';
import DateField from '../../components/ledger/DateField';
import HeaderCancel from '../../components/ledger/HeaderCancel';
import Icon from '../../components/ledger/Icon';
import LedgerField from '../../components/ledger/LedgerField';
import LedgerList from '../../components/ledger/LedgerList';
import LedgerScreen from '../../components/ledger/LedgerScreen';
import LineChart from '../../components/ledger/LineChart';
import PageTitle from '../../components/ledger/PageTitle';
import SectionLabel from '../../components/ledger/SectionLabel';
import LoadingView from '../../components/LoadingView';
import { dayParts, splitTimestamp } from '../../models/dateTime';
import { formatIsoDate } from '../../models/dates';
import { formatReading, MEASUREMENT_TYPES, UNITS_BY_TYPE, type Measurement } from '../../models/Measurement';
import { capitalize } from '../../models/text';
import { useThemeColors } from '../../theme';
import { useMeasurementsViewModel } from '../../viewmodels/measurements/useMeasurementsViewModel';

// Short names for the summary strip, so three fit side by side on a phone.
const STAT_LABELS = { 'blood pressure': 'Pressure', 'blood glucose': 'Glucose', weight: 'Weight' } as const;

// Health Measurements page (FR08): the selected profile's readings with a type filter and an add/edit form.
// It only shows the saved numbers: no diagnosis, no warnings.
export default function MeasurementsScreen({ profileId }: { profileId: string }) {
  const colors = useThemeColors();
  const vm = useMeasurementsViewModel(profileId);

  // the header shows the page name while loading, on an error and in the list
  const pageTitle = <Stack.Screen options={{ title: 'Health measurements' }} />;

  if (vm.loading) {
    return (
      <>
        {pageTitle}
        <LoadingView message="Loading measurements…" />
      </>
    );
  }
  if (vm.loadError || !vm.profile) {
    return (
      <>
        {pageTitle}
        <ErrorView message={vm.loadError} actionTitle="Back to profiles" onAction={() => router.dismissTo('/')} />
      </>
    );
  }
  const profile = vm.profile;

  // ---- add / edit form ----
  if (vm.editing) {
    const isPressure = vm.type === 'blood pressure';
    const { existing } = vm;
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
              <DateField label="Date" tag="Required" value={vm.date} onChangeText={vm.setDate} error={vm.errors.date} />
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
          {existing ? (
            <View style={styles.deleteGap}>
              <Button title="Delete measurement" variant="danger" disabled={vm.saving} onPress={() => vm.askToDelete(existing)} />
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
      <Stack.Screen options={{ title: 'Health measurements', headerTitle: profile.name, headerBackVisible: true, headerLeft: undefined }} />
      <PageTitle text="Health measurements" />
      {vm.total > 0 ? (
        <>
          {/* the newest reading of each type, side by side. Tapping one shows that type. */}
          <View style={styles.strip}>
            {vm.latestByType.map(({ type: t, reading }) => (
              <Pressable
                key={t}
                accessibilityRole="button"
                accessibilityLabel={reading ? `Latest ${t}: ${formatReading(reading)}` : `No ${t} readings yet`}
                onPress={() => vm.setFilter(t)}
                style={[
                  styles.stat,
                  { backgroundColor: colors.surface, borderColor: vm.filter === t ? colors.primary : colors.border },
                ]}>
                <Text style={[styles.statLabel, { color: colors.textMuted }]} numberOfLines={1}>
                  {STAT_LABELS[t]}
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
                  {reading ? (t === 'blood pressure' ? `${reading.value}/${reading.diastolic}` : String(reading.value)) : '—'}
                </Text>
                <Text style={[styles.statUnit, { color: colors.textMuted }]}>{reading ? reading.unit : 'No readings'}</Text>
              </Pressable>
            ))}
          </View>

          <View accessibilityRole="radiogroup" style={styles.filters}>
            <ChoiceChip label="All" selected={vm.filter === 'all'} onPress={() => vm.setFilter('all')} />
            {MEASUREMENT_TYPES.map((t) => (
              <ChoiceChip key={t} label={capitalize(t)} selected={vm.filter === t} onPress={() => vm.setFilter(t)} />
            ))}
          </View>

          {/* recent readings of the chosen type as a line chart: only the numbers, no judgement (FR08) */}
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {vm.chartReadings.length > 0 ? (
              <>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  {`${capitalize(vm.chartReadings[0].type)} · last ${vm.chartReadings.length} · ${vm.chartReadings[0].unit}`}
                </Text>
                <LineChart
                  labels={vm.chartReadings.map((m) => {
                    const p = dayParts(m.measuredAt, vm.zone);
                    return `${Number(p.day)} ${capitalize(p.month.toLowerCase())}`;
                  })}
                  series={
                    vm.chartReadings[0].type === 'blood pressure'
                      ? [
                          { name: 'Top number', values: vm.chartReadings.map((m) => m.value) },
                          { name: 'Bottom number', values: vm.chartReadings.map((m) => m.diastolic ?? 0) },
                        ]
                      : [{ name: capitalize(vm.chartReadings[0].type), values: vm.chartReadings.map((m) => m.value) }]
                  }
                />
              </>
            ) : (
              <Text style={[styles.chartHint, { color: colors.textMuted }]}>
                {vm.filter === 'all' ? 'Choose a type above to see a chart of its recent readings.' : `No ${vm.filter} readings to chart yet.`}
              </Text>
            )}
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
      <View style={styles.demoNotice}>
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

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  stat: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 10, gap: 2 },
  statLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  statValue: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  statUnit: { fontSize: 12 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  chartCard: { marginHorizontal: 16, marginTop: 8, borderWidth: 1, borderRadius: 16, padding: 14, gap: 6 },
  chartTitle: { fontSize: 14, fontWeight: '700' },
  chartHint: { fontSize: 14, lineHeight: 20, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  rowBody: { flex: 1, minWidth: 0 },
  type: { fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  reading: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  unit: { fontSize: 14, fontWeight: '400' },
  noneText: { paddingHorizontal: 16, paddingTop: 8, fontSize: 16, lineHeight: 22 },
  dock: { marginTop: 20, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  deleteGap: { marginTop: 16 },
  demoNotice: { paddingHorizontal: 16, paddingTop: 20 },
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
