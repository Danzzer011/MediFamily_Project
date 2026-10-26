import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import Dock from '../../components/ledger/Dock';
import Icon from '../../components/ledger/Icon';
import LedgerList from '../../components/ledger/LedgerList';
import LedgerScreen from '../../components/ledger/LedgerScreen';
import PageTitle from '../../components/ledger/PageTitle';
import Pill from '../../components/ledger/Pill';
import SectionLabel from '../../components/ledger/SectionLabel';
import LinkAction from '../../components/LinkAction';
import LoadingView from '../../components/LoadingView';
import { formatIsoDate } from '../../models/dates';
import type { ProfileSummary } from '../../models/FamilyProfile';
import { useThemeColors } from '../../theme';
import { useProfilesViewModel } from '../../viewmodels/profiles/useProfilesViewModel';

// Family Profiles page (FR01): choose a profile, create one, or answer invitations (FR09).
export default function ProfilesScreen() {
  const colors = useThemeColors();
  const vm = useProfilesViewModel();

  if (vm.loading) return <LoadingView message="Loading your profiles…" />;
  if (vm.loadError) return <ErrorView message={vm.loadError} onAction={vm.reload} />;

  return (
    <LedgerScreen>
      <Stack.Screen options={{ title: 'Family profiles', headerTitle: 'MediFamily' }} />
      <PageTitle text="Family profiles" />
      <Text style={[styles.signedIn, { color: colors.textMuted }]}>Signed in as {vm.email}</Text>

      {vm.invitations.length > 0 ? (
        <>
          <SectionLabel label="Invitations" count={vm.invitations.length} />
          {vm.invitationError ? (
            <View style={styles.padded}>
              <ErrorBanner message={vm.invitationError} />
            </View>
          ) : null}
          <LedgerList>
            {vm.invitations.map((invitation) => (
              <View key={invitation.id} style={styles.invitation}>
                <Text style={[styles.invitationText, { color: colors.text }]}>
                  <Text style={styles.bold}>{invitation.inviterEmail}</Text> invited you to help manage{' '}
                  <Text style={styles.bold}>{invitation.profileName}</Text>’s health profile.
                </Text>
                <View style={styles.buttons}>
                  <View style={styles.half}>
                    <Button
                      title="Accept"
                      loading={vm.respondingId === invitation.id}
                      disabled={vm.respondingId !== ''}
                      onPress={() => vm.respondToInvitation(invitation, true)}
                    />
                  </View>
                  <View style={styles.half}>
                    <Button
                      title="Decline"
                      variant="secondary"
                      disabled={vm.respondingId !== ''}
                      onPress={() => vm.respondToInvitation(invitation, false)}
                    />
                  </View>
                </View>
              </View>
            ))}
          </LedgerList>
        </>
      ) : null}

      <SectionLabel label="Your profiles" count={vm.profiles.length} />
      {vm.profiles.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No health profiles yet</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Create a profile for yourself or a family member, or accept an invitation from someone who already manages
            one.
          </Text>
        </View>
      ) : (
        <LedgerList>
          {vm.profiles.map((profile) => (
            <ProfileRow
              key={profile.id}
              profile={profile}
              onPress={() => {
                vm.openProfile(profile);
                router.push(`/profiles/${profile.id}`);
              }}
            />
          ))}
        </LedgerList>
      )}

      <Dock>
        <Button title="Create a profile" onPress={() => router.push('/profiles/new')} />
        <View style={styles.center}>
          <LinkAction label="Log out" accessibilityLabel="Log out" onPress={vm.logOut} />
        </View>
      </Dock>
      <View style={styles.demoNotice}>
        <DemoDataNotice />
      </View>
    </LedgerScreen>
  );
}

// One profile: the first letter in a circle, the name and birth date, and who created it.
function ProfileRow({ profile, onPress }: { profile: ProfileSummary; onPress: () => void }) {
  const colors = useThemeColors();
  const initial = profile.name.trim().charAt(0).toUpperCase();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${profile.name}'s profile`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.notice }]}>
      <View style={[styles.avatar, { backgroundColor: colors.notice }]}>
        <Text style={[styles.initial, { color: colors.primary }]}>{initial}</Text>
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.name, { color: colors.text }]}>{profile.name}</Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>Born {formatIsoDate(profile.dateOfBirth)}</Text>
      </View>
      <Pill label={profile.isCreator ? 'Creator' : 'Shared'} color={colors.primary} borderColor={colors.primary} />
      <Icon name="next" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  signedIn: { fontSize: 14, paddingHorizontal: 16, marginTop: -6 },
  padded: { paddingHorizontal: 16, paddingBottom: 8 },
  invitation: { padding: 16, gap: 12 },
  invitationText: { fontSize: 15, lineHeight: 21 },
  bold: { fontWeight: '700' },
  buttons: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 18, fontWeight: '700' },
  rowText: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700' },
  meta: { fontSize: 14, marginTop: 2 },
  empty: { paddingHorizontal: 16, paddingTop: 4, gap: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 15, lineHeight: 21 },
  center: { alignItems: 'center' },
  demoNotice: { paddingHorizontal: 16, paddingTop: 20 },
});
