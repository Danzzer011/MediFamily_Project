import { router, Stack, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import Screen from '../../components/Screen';
import { formatIsoDate } from '../../models/dates';
import { useThemeColors } from '../../theme';
import { useProfileDetailsViewModel } from '../../viewmodels/profiles/useProfileDetailsViewModel';

// One profile's main page (FR01): basic details, links to its features, edit and delete.
export default function ProfileDetailsScreen({ profileId }: { profileId: string }) {
  const colors = useThemeColors();
  const vm = useProfileDetailsViewModel(profileId);

  async function confirmDelete() {
    const deleted = await vm.confirmDelete();
    if (deleted) router.dismissTo('/');
  }

  if (vm.loading) return <LoadingView message="Loading profile…" />;
  if (vm.loadError || !vm.profile) {
    return <ErrorView message={vm.loadError} actionTitle="Back to profiles" onAction={() => router.dismissTo('/')} />;
  }
  const profile = vm.profile;

  return (
    <Screen>
      <Stack.Screen options={{ title: profile.name }} />

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text accessibilityRole="header" style={[styles.name, { color: colors.text }]}>
          {profile.name}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>Born {formatIsoDate(profile.dateOfBirth)}</Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {vm.isCreator ? 'You created this profile.' : 'Shared with you by the profile creator.'}
        </Text>
        <Button title="Edit name and date of birth" variant="secondary" onPress={() => router.push(`/profiles/${profile.id}/edit`)} />
      </View>

      <View style={styles.menu}>
        <MenuItem
          title="Health information"
          description="Blood type, allergies, conditions, surgeries and emergency contacts"
          href={`/profiles/${profile.id}/health`}
        />
        <MenuItem
          title="Sharing and invitations"
          description={vm.isCreator ? 'Invite family members and manage access' : 'See who has access, or leave this profile'}
          href={`/profiles/${profile.id}/sharing`}
        />
        <MenuItem
          title="Medications"
          description="Medication schedules, dosage and daily reminder times"
          href={`/profiles/${profile.id}/medications`}
        />
        <MenuItem
          title="Medicine stock"
          description="Remaining quantities and refill alerts"
          href={`/profiles/${profile.id}/stock`}
        />
        <MenuItem
          title="Prescriptions"
          description="Doctor, visit date, prescribed medicines and attachments"
          href={`/profiles/${profile.id}/prescriptions`}
        />
        <MenuItem
          title="Appointments"
          description="Doctor visits and reminders"
          href={`/profiles/${profile.id}/appointments`}
        />
        <MenuItem
          title="Medical documents"
          description="Prescriptions, lab reports and scans"
          href={`/profiles/${profile.id}/documents`}
        />
        <MenuItem
          title="Health measurements"
          description="Blood pressure, blood glucose and weight"
          href={`/profiles/${profile.id}/measurements`}
        />
      </View>

      {vm.isCreator ? (
        <Button title="Delete entire profile" variant="danger" onPress={vm.askToDelete} />
      ) : (
        <Text style={[styles.note, { color: colors.textMuted }]}>Only the profile creator can delete this profile.</Text>
      )}

      <DemoDataNotice />

      <ConfirmDialog
        visible={vm.confirmingDelete}
        title={`Delete ${profile.name}’s profile?`}
        message={
          'This permanently deletes the profile and all of its healthcare records and documents — health information, ' +
          'medications, prescriptions, appointments, measurements and files — for everyone it is shared with. ' +
          'This cannot be undone.'
        }
        confirmTitle="Delete profile and all records"
        destructive
        loading={vm.deleting}
        error={vm.deleteError}
        onConfirm={confirmDelete}
        onCancel={vm.cancelDelete}
      />
    </Screen>
  );
}

// A tappable row that opens one of the profile's feature pages.
function MenuItem({ title, description, href }: { title: string; description: string; href: Href }) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => router.push(href)}
      style={({ pressed }) => [
        styles.menuItem,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.menuText}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.menuDescription, { color: colors.textMuted }]}>{description}</Text>
      </View>
      <Text style={[styles.chevron, { color: colors.primary }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 8 },
  name: { fontSize: 24, fontWeight: '700' },
  meta: { fontSize: 15 },
  menu: { gap: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 16 },
  pressed: { opacity: 0.8 },
  menuText: { flex: 1, gap: 2 },
  menuTitle: { fontSize: 17, fontWeight: '700' },
  menuDescription: { fontSize: 14 },
  chevron: { fontSize: 28, fontWeight: '300' },
  note: { fontSize: 14, textAlign: 'center' },
});
