import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorView from '../../components/ErrorView';
import Icon from '../../components/ledger/Icon';
import LedgerScreen from '../../components/ledger/LedgerScreen';
import MenuRow from '../../components/ledger/MenuRow';
import Pill from '../../components/ledger/Pill';
import SectionLabel from '../../components/ledger/SectionLabel';
import Tile from '../../components/ledger/Tile';
import LinkAction from '../../components/LinkAction';
import LoadingView from '../../components/LoadingView';
import { formatIsoDate } from '../../models/dates';
import { useThemeColors } from '../../theme';
import { useProfileDetailsViewModel } from '../../viewmodels/profiles/useProfileDetailsViewModel';

// One profile's main page (FR01): basic details, links to its features, edit and delete.
// The health summary sits on top, the features are a grid of tiles with a live line each,
// and sharing and deleting come last.
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
  const lines = vm.tileLines;
  const base = `/profiles/${profile.id}` as const;

  return (
    <LedgerScreen>
      <Stack.Screen options={{ title: profile.name }} />

      {/* who this profile is about */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.notice }]}>
          <Text style={[styles.initial, { color: colors.primary }]}>{profile.name.trim().charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerText}>
          <Text accessibilityRole="header" style={[styles.name, { color: colors.text }]}>
            {profile.name}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>Born {formatIsoDate(profile.dateOfBirth)}</Text>
          <View style={styles.pillRow}>
            <Pill label={vm.isCreator ? 'Creator' : 'Shared'} color={colors.primary} borderColor={colors.primary} />
          </View>
        </View>
      </View>
      <Text style={[styles.note, { color: colors.textMuted }]}>
        {vm.isCreator ? 'You created this profile.' : 'Shared with you by the profile creator.'}
      </Text>
      <View style={styles.editLink}>
        <LinkAction label="Edit name and date of birth" accessibilityLabel="Edit name and date of birth" onPress={() => router.push(`${base}/edit`)} />
      </View>

      {/* health information at a glance: three facts side by side. Missing means "Not recorded", never "none" (FR02). */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Health information"
        onPress={() => router.push(`${base}/health`)}
        style={({ pressed }) => [
          styles.healthCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && { backgroundColor: colors.notice },
        ]}>
        <View style={styles.healthTop}>
          <Icon name="heart" size={20} color={colors.primary} />
          <Text style={[styles.healthTitle, { color: colors.text }]}>Health information</Text>
          <Icon name="next" size={18} color={colors.textMuted} />
        </View>
        <View style={styles.facts}>
          <Fact label="Blood type" value={profile.bloodType} />
          <Fact label="Allergies" value={profile.allergies} />
          <Fact label="Conditions" value={profile.medicalConditions} />
        </View>
      </Pressable>

      <SectionLabel label="Records" />
      <View style={styles.grid}>
        <Tile icon="pill" title="Medications" line={lines?.medications} onPress={() => router.push(`${base}/medications`)} />
        <Tile
          icon="box"
          title="Medicine stock"
          line={lines?.stock}
          lineColor={lines?.lowStock ? colors.danger : undefined}
          onPress={() => router.push(`${base}/stock`)}
        />
        <Tile icon="calendar" title="Appointments" line={lines?.appointments} onPress={() => router.push(`${base}/appointments`)} />
        <Tile icon="activity" title="Health measurements" line={lines?.measurements} onPress={() => router.push(`${base}/measurements`)} />
        <Tile icon="clipboard" title="Prescriptions" line={lines?.prescriptions} onPress={() => router.push(`${base}/prescriptions`)} />
        <Tile icon="folder" title="Medical documents" line={lines?.documents} onPress={() => router.push(`${base}/documents`)} />
      </View>

      <SectionLabel label="Family" />
      <View style={[styles.sharing, { borderColor: colors.border }]}>
        <MenuRow
          icon="users"
          title="Sharing and invitations"
          description={
            (lines ? `${lines.sharing} · ` : '') +
            (vm.isCreator ? 'Invite family members and manage access' : 'See who has access, or leave this profile')
          }
          onPress={() => router.push(`${base}/sharing`)}
        />
      </View>

      {/* the dangerous action sits on its own at the end */}
      <View style={[styles.danger, { borderColor: colors.border }]}>
        {vm.isCreator ? (
          <Button title="Delete entire profile" variant="danger" onPress={vm.askToDelete} />
        ) : (
          <Text style={[styles.dangerNote, { color: colors.textMuted }]}>Only the profile creator can delete this profile.</Text>
        )}
      </View>

      <View style={styles.demoNotice}>
        <DemoDataNotice />
      </View>

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
    </LedgerScreen>
  );
}

// One fact in the health card. A missing value is "Not recorded", in grey italics.
function Fact({ label, value }: { label: string; value: string | null }) {
  const colors = useThemeColors();
  return (
    <View style={styles.fact}>
      <Text style={[styles.factLabel, { color: colors.textMuted }]}>{label}</Text>
      {value ? (
        <Text style={[styles.factValue, { color: colors.text }]} numberOfLines={2}>
          {value}
        </Text>
      ) : (
        <Text style={[styles.factEmpty, { color: colors.textMuted }]}>Not recorded</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingTop: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 26, fontWeight: '700' },
  headerText: { flex: 1, gap: 2 },
  name: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  meta: { fontSize: 15 },
  pillRow: { flexDirection: 'row', marginTop: 4 },
  note: { fontSize: 14, paddingHorizontal: 16, paddingTop: 12 },
  editLink: { paddingHorizontal: 12, alignItems: 'flex-start' },
  healthCard: { marginHorizontal: 16, marginTop: 8, borderWidth: 1, borderRadius: 16, padding: 14, gap: 12 },
  healthTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  healthTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
  facts: { flexDirection: 'row', gap: 10 },
  fact: { flex: 1, gap: 2 },
  factLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  factValue: { fontSize: 15, fontWeight: '600' },
  factEmpty: { fontSize: 14, fontStyle: 'italic' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 },
  sharing: { marginHorizontal: 16, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  danger: { marginTop: 28, paddingHorizontal: 16, paddingTop: 16, borderTopWidth: 1 },
  dangerNote: { fontSize: 14, textAlign: 'center' },
  demoNotice: { paddingHorizontal: 16, paddingTop: 20 },
});
