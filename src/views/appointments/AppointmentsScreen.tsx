import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import Button from '../../components/Button';
import ChoiceChip from '../../components/ChoiceChip';
import ConfirmDialog from '../../components/ConfirmDialog';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import { APPOINTMENT_STATUSES } from '../../models/Appointment';
import { formatTimestamp } from '../../models/dateTime';
import { useThemeColors } from '../../theme';
import { useAppointmentsViewModel } from '../../viewmodels/appointments/useAppointmentsViewModel';

// Appointments page (FR05): list of the selected profile's appointments with an add/edit form.
export default function AppointmentsScreen({ profileId }: { profileId: string }) {
  const colors = useThemeColors();
  const vm = useAppointmentsViewModel(profileId);

  if (vm.loading) return <LoadingView message="Loading appointments…" />;
  if (vm.loadError || !vm.profile) {
    return <ErrorView message={vm.loadError} actionTitle="Back to profiles" onAction={() => router.dismissTo('/')} />;
  }
  const profile = vm.profile;

  // ---- add / edit form ----
  if (vm.editing) {
    return (
      <Screen>
        <Stack.Screen options={{ title: vm.isNew ? 'New appointment' : 'Edit appointment' }} />
        <ProfileName name={profile.name} />
        {vm.formError ? <ErrorBanner message={vm.formError} /> : null}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextField label="Doctor name" value={vm.doctor} onChangeText={vm.setDoctor} error={vm.errors.doctor} autoCapitalize="words" />
          <TextField
            label="Date"
            value={vm.date}
            onChangeText={vm.setDate}
            error={vm.errors.date}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
          />
          <TextField
            label="Time (24-hour)"
            value={vm.time}
            onChangeText={vm.setTime}
            error={vm.errors.time}
            placeholder="HH:MM"
            keyboardType="numbers-and-punctuation"
          />
          <TextField label="Location (optional)" value={vm.location} onChangeText={vm.setLocation} />
          <TextField label="Notes (optional)" value={vm.notes} onChangeText={vm.setNotes} multiline />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Status</Text>
          <View accessibilityRole="radiogroup" style={styles.chips}>
            {APPOINTMENT_STATUSES.map((s) => (
              <ChoiceChip key={s} label={capitalize(s)} selected={vm.status === s} onPress={() => vm.setStatus(s)} />
            ))}
          </View>
          <Text style={[styles.muted, { color: colors.textMuted }]}>
            The status only changes when you change it here, even after the date has passed. A follow-up visit is a new appointment.
          </Text>
        </View>

        <Button title="Save appointment" loading={vm.saving} onPress={vm.save} />
        <Button title="Cancel" variant="secondary" disabled={vm.saving} onPress={vm.cancelEditing} />
        <DemoDataNotice />
      </Screen>
    );
  }

  // ---- list ----
  return (
    <Screen>
      <Stack.Screen options={{ title: `${profile.name} · Appointments` }} />
      <ProfileName name={profile.name} />

      <View style={[styles.card, styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.switchText}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appointment reminders</Text>
          <Text style={[styles.muted, { color: colors.textMuted }]}>For this profile, on this phone only.</Text>
        </View>
        <Switch
          accessibilityLabel="Appointment reminders for this profile on this phone"
          value={vm.remindersOn}
          onValueChange={vm.setRemindersOn}
          trackColor={{ true: colors.primary }}
        />
      </View>

      <Button title="Add appointment" onPress={vm.startAdding} />
      {vm.exportMessage ? (
        <Text accessibilityRole="alert" style={[styles.notice, { backgroundColor: colors.notice, color: colors.text }]}>
          {vm.exportMessage}
        </Text>
      ) : null}

      {vm.appointments.length === 0 ? (
        <Text style={[styles.muted, { color: colors.textMuted }]}>No appointments yet.</Text>
      ) : (
        vm.appointments.map((a) => (
          <View key={a.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.rowTop}>
              <Text style={[styles.sectionTitle, styles.flex, { color: colors.text }]}>{a.doctorName}</Text>
              <Text style={[styles.badge, { color: colors.primary, borderColor: colors.primary }]}>{capitalize(a.status)}</Text>
            </View>
            <Text style={[styles.body, { color: colors.text }]}>{formatTimestamp(a.startsAt)}</Text>
            {a.location ? <Text style={[styles.muted, { color: colors.textMuted }]}>{a.location}</Text> : null}
            {a.notes ? <Text style={[styles.muted, { color: colors.textMuted }]}>{a.notes}</Text> : null}

            {a.status === 'scheduled' ? (
              <Button title="Export to Google Calendar" variant="secondary" onPress={() => vm.exportToGoogleCalendar(a)} />
            ) : null}
            <View style={styles.actions}>
              <LinkAction label="Edit" accessibilityLabel={`Edit appointment with ${a.doctorName}`} onPress={() => vm.startEditing(a)} />
              <LinkAction label="Delete" danger accessibilityLabel={`Delete appointment with ${a.doctorName}`} onPress={() => vm.askToDelete(a)} />
            </View>
          </View>
        ))
      )}

      <DemoDataNotice />

      <ConfirmDialog
        visible={vm.pendingDelete !== null}
        title="Delete appointment?"
        message={`The appointment with ${vm.pendingDelete?.doctorName ?? ''} will be deleted for ${profile.name}. This cannot be undone.`}
        confirmTitle="Delete"
        destructive
        loading={vm.deleting}
        error={vm.deleteError}
        onConfirm={vm.confirmDelete}
        onCancel={vm.cancelDelete}
      />
    </Screen>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Shows whose appointments these are (all data belongs to the selected profile).
function ProfileName({ name }: { name: string }) {
  const colors = useThemeColors();
  return (
    <Text accessibilityRole="header" style={[styles.profileName, { color: colors.text }]}>
      Profile: {name}
    </Text>
  );
}

function LinkAction({ label, accessibilityLabel, onPress, danger = false }: { label: string; accessibilityLabel: string; onPress: () => void; danger?: boolean }) {
  const colors = useThemeColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={styles.link}>
      <Text style={[styles.linkText, { color: danger ? colors.danger : colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profileName: { fontSize: 18, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 22 },
  muted: { fontSize: 14, lineHeight: 20 },
  notice: { fontSize: 14, lineHeight: 20, borderRadius: 12, padding: 12 },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchText: { flex: 1, gap: 2 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { fontSize: 13, fontWeight: '700', borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  actions: { flexDirection: 'row', gap: 16 },
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  linkText: { fontSize: 15, fontWeight: '700' },
});
