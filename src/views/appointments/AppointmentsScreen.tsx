import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import Button from '../../components/Button';
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
import Pill from '../../components/ledger/Pill';
import SectionLabel from '../../components/ledger/SectionLabel';
import Segmented from '../../components/ledger/Segmented';
import LinkAction from '../../components/LinkAction';
import LoadingView from '../../components/LoadingView';
import { APPOINTMENT_STATUSES, type Appointment } from '../../models/Appointment';
import { dayParts, splitTimestamp, zoneLabel } from '../../models/dateTime';
import { formatIsoDate } from '../../models/dates';
import { capitalize } from '../../models/text';
import { useThemeColors } from '../../theme';
import { monoFont, useStatusStyles } from '../../theme/medifamily-theme';
import { useAppointmentsViewModel } from '../../viewmodels/appointments/useAppointmentsViewModel';

const STATUS_OPTIONS = APPOINTMENT_STATUSES.map((value) => ({ value, label: capitalize(value) }));

// Appointments page (FR05): the selected profile's appointments, with an add/edit form.
export default function AppointmentsScreen({ profileId }: { profileId: string }) {
  const colors = useThemeColors();
  const vm = useAppointmentsViewModel(profileId);

  // the header shows the page name while loading, on an error and in the list
  const pageTitle = <Stack.Screen options={{ title: 'Appointments' }} />;

  if (vm.loading) {
    return (
      <>
        {pageTitle}
        <LoadingView message="Loading appointments…" />
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
  // the profile name is always in the header; the time zone sits at its right
  const zoneText = <Text style={[styles.zone, { color: colors.textMuted }]}>{zoneLabel(profile.timeZone)}</Text>;

  // ---- add / edit form ----
  if (vm.editing) {
    const { existing } = vm;
    const pending = vm.pendingDelete;
    const when = pending ? splitTimestamp(pending.startsAt, vm.zone) : null;
    return (
      <LedgerScreen>
        <Stack.Screen
          options={{ title: profile.name, headerBackVisible: false, headerLeft: () => <HeaderCancel onPress={vm.cancelEditing} />, headerRight: () => zoneText }}
        />
        <PageTitle text={vm.isNew ? 'New appointment' : 'Edit appointment'} />
        {vm.formError ? <ErrorBanner message={vm.formError} /> : null}
        <View style={styles.form}>
          <LedgerField label="Doctor name" tag="Required" value={vm.doctor} onChangeText={vm.setDoctor} error={vm.errors.doctor} autoCapitalize="words" />
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
                placeholder="18:30"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
          <LedgerField label="Location" tag="Optional" value={vm.location} onChangeText={vm.setLocation} />
          <LedgerField label="Notes" tag="Optional" value={vm.notes} onChangeText={vm.setNotes} multiline />
          <View style={styles.status}>
            <Text style={[styles.label, { color: colors.text }]}>Status</Text>
            <Segmented options={STATUS_OPTIONS} selected={vm.status} onSelect={vm.setStatus} />
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              {vm.isNew
                ? 'New appointments start as Scheduled. You change the status yourself later.'
                : 'The status only changes when you change it, even after the date has passed.'}
            </Text>
          </View>
        </View>
        <View style={[styles.dock, { borderColor: colors.border }]}>
          <Button title={vm.isNew ? 'Save appointment' : 'Save changes'} loading={vm.saving} onPress={vm.save} />
          {existing ? (
            <View style={styles.deleteGap}>
              <Button title="Delete appointment" variant="danger" disabled={vm.saving} onPress={() => vm.askToDelete(existing)} />
            </View>
          ) : null}
        </View>
        <ConfirmDialog
          visible={pending !== null}
          title="Delete this appointment?"
          message={`The visit with ${pending?.doctorName ?? ''} on ${when ? formatIsoDate(when.date) : ''} at ${when?.time ?? ''} will be deleted for ${profile.name}. This cannot be undone.`}
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
  const nextParts = vm.next ? dayParts(vm.next.startsAt, vm.zone) : null;
  const daysLabel = vm.daysToNext <= 0 ? 'today' : vm.daysToNext === 1 ? 'tomorrow' : `in ${vm.daysToNext} days`;

  return (
    <LedgerScreen>
      <Stack.Screen options={{ title: 'Appointments', headerBackVisible: true, headerLeft: undefined, headerRight: () => zoneText }} />
      <PageTitle text="Appointments" />

      {vm.next && nextParts ? (
        <View style={[styles.next, { borderColor: colors.text, backgroundColor: colors.surface }]}>
          <Text style={[styles.nextLabel, { color: colors.primary }]}>{`Next · ${daysLabel}`}</Text>
          <Text style={[styles.nextName, { color: colors.text }]}>{vm.next.doctorName}</Text>
          <Text style={[styles.nextLine, { color: colors.text }]} numberOfLines={1}>
            <Text style={{ fontFamily: monoFont }}>{`${capitalize(nextParts.weekday.toLowerCase())} ${Number(nextParts.day)} ${capitalize(nextParts.month.toLowerCase())} · ${nextParts.time}`}</Text>
            {vm.next.location ? ` · ${vm.next.location}` : ''}
          </Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: vm.remindersOn }}
        accessibilityLabel={`Appointment reminders for ${profile.name} on this phone`}
        onPress={() => vm.setRemindersOn(!vm.remindersOn)}
        style={[styles.reminders, { borderColor: colors.border }]}>
        <Icon name="bell" size={20} color={colors.text} />
        <View style={styles.remindersText}>
          <Text style={[styles.remindersTitle, { color: colors.text }]}>Reminders on this phone</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>{`Only for ${profile.name}`}</Text>
        </View>
        <View pointerEvents="none">
          <Switch value={vm.remindersOn} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} />
        </View>
      </Pressable>

      {vm.exportMessage ? (
        <Text accessibilityRole="alert" style={[styles.notice, { backgroundColor: colors.notice, color: colors.text }]}>
          {vm.exportMessage}
        </Text>
      ) : null}

      {vm.hasAppointments ? (
        <>
          {vm.upcoming.length > 0 ? (
            <>
              <SectionLabel label="Coming up" count={vm.upcoming.length} />
              <LedgerList>
                {vm.upcoming.map((a) => (
                  <AppointmentRow key={a.id} appointment={a} zone={vm.zone} onOpen={() => vm.startEditing(a)} onExport={() => vm.exportToGoogleCalendar(a)} />
                ))}
              </LedgerList>
            </>
          ) : null}
          {vm.earlier.length > 0 ? (
            <>
              <SectionLabel label="Earlier" count={vm.earlier.length} />
              <LedgerList>
                {vm.earlier.map((a) => (
                  <AppointmentRow key={a.id} appointment={a} zone={vm.zone} onOpen={() => vm.startEditing(a)} onExport={() => vm.exportToGoogleCalendar(a)} />
                ))}
              </LedgerList>
            </>
          ) : null}
          <View style={[styles.dock, { borderColor: colors.border }]}>
            <Button title="New appointment" onPress={vm.startAdding} />
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text accessibilityRole="header" style={[styles.emptyTitle, { color: colors.text }]}>{`Nothing booked for ${profile.name}.`}</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Add the first appointment. Doctor, date and time are enough.</Text>
          <Button title="Add the first appointment" onPress={vm.startAdding} />
        </View>
      )}

      <View style={styles.demoNotice}>
        <DemoDataNotice />
      </View>
    </LedgerScreen>
  );
}

// One appointment: a colour bar for the status, the date, the name and time, details, status chip.
function AppointmentRow({ appointment: a, zone, onOpen, onExport }: { appointment: Appointment; zone: string; onOpen: () => void; onExport: () => void }) {
  const colors = useThemeColors();
  const statuses = useStatusStyles();
  const s = statuses[a.status];
  const p = dayParts(a.startsAt, zone);

  // The Export button sits next to the tappable row, not inside it (a button cannot contain a button on the web).
  return (
    <View style={styles.row}>
      <View style={[styles.bar, { backgroundColor: s.fg }]} />
      <View style={styles.rowMain}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Edit appointment with ${a.doctorName}`} onPress={onOpen} style={styles.rowTap}>
          <DateColumn top={`${p.day} ${p.month}`} bottom={p.weekday} />
          <View style={styles.body}>
            <View style={styles.line}>
              <Text style={[styles.name, { color: colors.text }]}>{a.doctorName}</Text>
              <Text style={[styles.time, { color: colors.text, fontFamily: monoFont }]}>{p.time}</Text>
            </View>
            {a.location ? <Text style={[styles.small, { color: colors.textMuted }]}>{a.location}</Text> : null}
            {a.notes ? <Text style={[styles.small, styles.notes, { color: colors.text }]}>{a.notes}</Text> : null}
            <View style={styles.chips}>
              <Pill label={capitalize(a.status)} color={s.fg} background={s.bg} icon={a.status} />
            </View>
          </View>
        </Pressable>
        {a.status === 'scheduled' ? (
          <View style={styles.exportRow}>
            <LinkAction label="Export to Google Calendar" icon="calendar-plus" accessibilityLabel={`Export the visit with ${a.doctorName} to Google Calendar`} onPress={onExport} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: { fontSize: 13 },
  next: { marginHorizontal: 16, marginBottom: 12, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  nextLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  nextName: { fontSize: 18, lineHeight: 24, fontWeight: '700', marginVertical: 2 },
  nextLine: { fontSize: 14 },
  reminders: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, minHeight: 56, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1 },
  remindersText: { flex: 1 },
  remindersTitle: { fontSize: 15, fontWeight: '600' },
  hint: { fontSize: 13, lineHeight: 18 },
  notice: { marginHorizontal: 16, marginTop: 12, fontSize: 14, lineHeight: 20, borderRadius: 12, padding: 12 },
  demoNotice: { paddingHorizontal: 16, paddingTop: 20 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 12, paddingRight: 16 },
  rowMain: { flex: 1, minWidth: 0 },
  rowTap: { flexDirection: 'row', gap: 12 },
  exportRow: { paddingLeft: 70 }, // lines up under the name (58 px date column + 12 px gap)
  bar: { width: 4, alignSelf: 'stretch', borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  body: { flex: 1, minWidth: 0 },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '700' },
  time: { fontSize: 14, lineHeight: 22, fontWeight: '600' },
  small: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  notes: { marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10, marginTop: 6 },
  dock: { marginTop: 20, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  deleteGap: { marginTop: 16 },
  empty: { paddingHorizontal: 16, paddingTop: 24, gap: 8 },
  emptyTitle: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  emptyText: { fontSize: 16, lineHeight: 22, marginBottom: 10 },
  form: { paddingHorizontal: 16, gap: 14 },
  pair: { flexDirection: 'row', gap: 12 },
  wide: { flex: 1.25 },
  narrow: { flex: 1 },
  status: { gap: 6 },
  label: { fontSize: 15, fontWeight: '600' },
});
