import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import ProfileCard from '../../components/ProfileCard';
import Screen from '../../components/Screen';
import { useThemeColors } from '../../theme';
import { useProfilesViewModel } from '../../viewmodels/profiles/useProfilesViewModel';

// Family Profiles page (FR01): choose a profile, create one, or answer invitations (FR09).
export default function ProfilesScreen() {
  const colors = useThemeColors();
  const vm = useProfilesViewModel();

  if (vm.loading) return <LoadingView message="Loading your profiles…" />;
  if (vm.loadError) return <ErrorView message={vm.loadError} onAction={vm.reload} />;

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Family profiles' }} />
      <Text style={[styles.signedIn, { color: colors.textMuted }]}>Signed in as {vm.email}</Text>

      {vm.invitations.length > 0 ? (
        <View style={styles.section}>
          <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>
            Invitations ({vm.invitations.length})
          </Text>
          {vm.invitationError ? <ErrorBanner message={vm.invitationError} /> : null}
          {vm.invitations.map((invitation) => (
            <View key={invitation.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
              <Text style={[styles.cardText, { color: colors.text }]}>
                <Text style={styles.bold}>{invitation.inviterEmail}</Text> invited you to help manage{' '}
                <Text style={styles.bold}>{invitation.profileName}</Text>’s health profile.
              </Text>
              <View style={styles.row}>
                <View style={styles.rowButton}>
                  <Button
                    title="Accept"
                    loading={vm.respondingId === invitation.id}
                    disabled={vm.respondingId !== ''}
                    onPress={() => vm.respondToInvitation(invitation, true)}
                  />
                </View>
                <View style={styles.rowButton}>
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
        </View>
      ) : null}

      <View style={styles.section}>
        <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>
          Your profiles
        </Text>
        {vm.profiles.length === 0 ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No health profiles yet</Text>
            <Text style={[styles.cardText, { color: colors.textMuted }]}>
              Create a profile for yourself or a family member, or accept an invitation from someone who already
              manages one.
            </Text>
          </View>
        ) : (
          vm.profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onPress={() => {
                vm.openProfile(profile);
                router.push(`/profiles/${profile.id}`);
              }}
            />
          ))
        )}
      </View>

      <Button title="Create a profile" onPress={() => router.push('/profiles/new')} />
      <Button title="Log out" variant="secondary" onPress={vm.logOut} />
      <DemoDataNotice />
    </Screen>
  );
}

const styles = StyleSheet.create({
  signedIn: { fontSize: 14 },
  section: { gap: 10 },
  heading: { fontSize: 18, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  cardText: { fontSize: 15, lineHeight: 21 },
  bold: { fontWeight: '700' },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10 },
  rowButton: { flex: 1 },
});
