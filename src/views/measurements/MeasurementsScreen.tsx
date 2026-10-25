import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import ChoiceChip from '../../components/ChoiceChip';
import ConfirmDialog from '../../components/ConfirmDialog';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import LinkAction from '../../components/LinkAction';
import LoadingView from '../../components/LoadingView';
import ProfileName from '../../components/ProfileName';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import { formatTimestamp } from '../../models/dateTime';
import { formatReading, MEASUREMENT_TYPES, UNITS_BY_TYPE } from '../../models/Measurement';
import { useThemeColors } from '../../theme';
import { useMeasurementsViewModel } from '../../viewmodels/measurements/useMeasurementsViewModel';

// Health Measurements page (FR08): list of the selected profile's readings with a type filter and an add/edit form.
export default function MeasurementsScreen({ profileId }: { profileId: string }) {
  const colors = useThemeColors();
  const vm = useMeasurementsViewModel(profileId);
  const card = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }];

  if (vm.loading) return <LoadingView message="Loading measurements…" />;
  if (vm.loadError || !vm.profile) {
    return <ErrorView message={vm.loadError} actionTitle="Back to profiles" onAction={() => router.dismissTo('/')} />;
  }
  const profile = vm.profile;

  // ---- add / edit form ----
  if (vm.editing) {
    const isPressure = vm.type === 'blood pressure';
    return (
      <Screen>
        <Stack.Screen options={{ title: vm.isNew ? 'New measurement' : 'Edit measurement' }} />
        <ProfileName name={profile.name} timeZone={profile.timeZone} />
        {vm.formError ? <ErrorBanner message={vm.formError} /> : null}

        <View style={card}>
          <Text style={[styles.label, { color: colors.text }]}>Type</Text>
          <View accessibilityRole="radiogroup" style={styles.chips}>
            {MEASUREMENT_TYPES.map((t) => (
              <ChoiceChip key={t} label={capitalize(t)} selected={vm.type === t} onPress={() => vm.changeType(t)} />
            ))}
          </View>
        </View>

        <View style={card}>
          <TextField
            label={isPressure ? 'Systolic (top number)' : 'Value'}
            value={vm.value}
            onChangeText={vm.setValue}
            error={vm.errors.value}
            keyboardType="decimal-pad"
          />
          {isPressure ? (
            <TextField
              label="Diastolic (bottom number)"
              value={vm.diastolic}
              onChangeText={vm.setDiastolic}
              error={vm.errors.diastolic}
              keyboardType="decimal-pad"
            />
          ) : null}
          <Text style={[styles.label, { color: colors.text }]}>Unit</Text>
          <View accessibilityRole="radiogroup" style={styles.chips}>
            {UNITS_BY_TYPE[vm.type].map((u) => (
              <ChoiceChip key={u} label={u} selected={vm.unit === u} onPress={() => vm.setUnit(u)} />
            ))}
          </View>
        </View>

        <View style={card}>
          <TextField
            label="Date measured"
            value={vm.date}
            onChangeText={vm.setDate}
            error={vm.errors.date}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
          />
          <TextField
            label="Time measured (24-hour)"
            value={vm.time}
            onChangeText={vm.setTime}
            error={vm.errors.time}
            placeholder="HH:MM"
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <Button title="Save measurement" loading={vm.saving} onPress={vm.save} />
        <Button title="Cancel" variant="secondary" disabled={vm.saving} onPress={vm.cancelEditing} />
        <DemoDataNotice />
      </Screen>
    );
  }

  // ---- list ----
  return (
    <Screen>
      <Stack.Screen options={{ title: `${profile.name} · Measurements` }} />
      <ProfileName name={profile.name} timeZone={profile.timeZone} />
      <Button title="Add measurement" onPress={vm.startAdding} />

      <View accessibilityRole="radiogroup" style={styles.chips}>
        <ChoiceChip label="All" selected={vm.filter === 'all'} onPress={() => vm.setFilter('all')} />
        {MEASUREMENT_TYPES.map((t) => (
          <ChoiceChip key={t} label={capitalize(t)} selected={vm.filter === t} onPress={() => vm.setFilter(t)} />
        ))}
      </View>

      {vm.visible.length === 0 ? (
        <Text style={[styles.muted, { color: colors.textMuted }]}>
          {vm.filter === 'all' ? 'No measurements yet.' : `No ${vm.filter} measurements yet.`}
        </Text>
      ) : (
        vm.visible.map((m) => (
          <View key={m.id} style={card}>
            <View style={styles.rowTop}>
              <Text style={[styles.reading, styles.flex, { color: colors.text }]}>{formatReading(m)}</Text>
              <Text style={[styles.badge, { color: colors.primary, borderColor: colors.primary }]}>{capitalize(m.type)}</Text>
            </View>
            <Text style={[styles.muted, { color: colors.textMuted }]}>{formatTimestamp(m.measuredAt, profile.timeZone)}</Text>
            <View style={styles.actions}>
              <LinkAction label="Edit" accessibilityLabel={`Edit ${m.type} measurement`} onPress={() => vm.startEditing(m)} />
              <LinkAction label="Delete" danger accessibilityLabel={`Delete ${m.type} measurement`} onPress={() => vm.askToDelete(m)} />
            </View>
          </View>
        ))
      )}

      <DemoDataNotice />

      <ConfirmDialog
        visible={vm.pendingDelete !== null}
        title="Delete measurement?"
        message={`${vm.pendingDelete ? formatReading(vm.pendingDelete) : ''} will be deleted for ${profile.name}. This cannot be undone.`}
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

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 12 },
  label: { fontSize: 15, fontWeight: '600' },
  reading: { fontSize: 22, fontWeight: '700' },
  muted: { fontSize: 14, lineHeight: 20 },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { fontSize: 13, fontWeight: '700', borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  actions: { flexDirection: 'row', gap: 16 },
});
