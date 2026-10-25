import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import { useThemeColors } from '../../theme';
import { useSharingViewModel } from '../../viewmodels/sharing/useSharingViewModel';

// Sharing and Invitations page (FR09) for one profile.
export default function SharingScreen({ profileId }: { profileId: string }) {
  const colors = useThemeColors();
  const vm = useSharingViewModel(profileId);

  async function confirmAction() {
    const result = await vm.confirmAction();
    if (result === 'left') router.dismissTo('/'); // no access any more, go back to the profile list
  }

  if (vm.loading) return <LoadingView message="Loading sharing…" />;
  if (vm.loadError || !vm.profile) {
    return <ErrorView message={vm.loadError} actionTitle="Back to profiles" onAction={() => router.dismissTo('/')} />;
  }
  const profile = vm.profile;

  return (
    <Screen>
      <Stack.Screen options={{ title: `${profile.name} · Sharing` }} />
      <Text style={[styles.intro, { color: colors.textMuted }]}>
        Everyone with access can view and update this profile’s information and records.{' '}
        {vm.isCreator
          ? 'As the creator, only you can invite people, cancel invitations, remove access or delete the profile.'
          : 'Only the profile creator can invite people, remove access or delete the profile.'}
      </Text>

      {vm.isCreator ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>
            Invite someone
          </Text>
          <TextField
            label="Email of a registered MediFamily user"
            placeholder="name@example.com"
            value={vm.inviteEmail}
            onChangeText={vm.changeInviteEmail}
            error={vm.inviteError}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="send"
            onSubmitEditing={vm.invite}
          />
          {vm.inviteMessage ? (
            <Text accessibilityRole="alert" style={[styles.success, { color: colors.primary }]}>
              {vm.inviteMessage}
            </Text>
          ) : null}
          <Button title="Send invitation" loading={vm.inviting} onPress={vm.invite} />
        </View>
      ) : null}

      {vm.listError ? <ErrorBanner message={vm.listError} /> : null}

      {vm.isCreator ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>
            Pending invitations
          </Text>
          {vm.invitations.length === 0 ? (
            <Text style={[styles.muted, { color: colors.textMuted }]}>No pending invitations.</Text>
          ) : (
            vm.invitations.map((invitation) => (
              <View key={invitation.id} style={styles.personRow}>
                <Text style={[styles.person, { color: colors.text }]}>{invitation.recipientEmail}</Text>
                <SmallAction
                  label={vm.cancellingId === invitation.id ? 'Cancelling…' : 'Cancel invitation'}
                  accessibilityLabel={`Cancel invitation for ${invitation.recipientEmail}`}
                  onPress={() => vm.cancelInvitation(invitation)}
                />
              </View>
            ))
          )}
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>
          Shared with
        </Text>
        {vm.members.length === 0 ? (
          <Text style={[styles.muted, { color: colors.textMuted }]}>Not shared with anyone yet.</Text>
        ) : (
          vm.members.map((member) => (
            <View key={member.userId} style={styles.personRow}>
              <Text style={[styles.person, { color: colors.text }]}>
                {member.email}
                {member.userId === vm.accountId ? ' (you)' : ''}
              </Text>
              {vm.isCreator ? (
                <SmallAction
                  label="Remove access"
                  accessibilityLabel={`Remove access for ${member.email}`}
                  onPress={() => vm.askToRevoke(member)}
                />
              ) : null}
            </View>
          ))
        )}
      </View>

      {!vm.isCreator ? <Button title="Leave this profile" variant="danger" onPress={vm.askToLeave} /> : null}

      <DemoDataNotice />

      <ConfirmDialog
        visible={vm.pendingAction !== null}
        title={vm.pendingAction?.type === 'leave' ? `Leave ${profile.name}’s profile?` : 'Remove access?'}
        message={
          vm.pendingAction?.type === 'leave'
            ? 'You will no longer be able to see or update this profile. The profile and its records stay as they are for everyone else.'
            : `${vm.pendingAction?.type === 'revoke' ? vm.pendingAction.member.email : ''} will no longer be able to see or update ${profile.name}’s profile. The profile and its records are not changed.`
        }
        confirmTitle={vm.pendingAction?.type === 'leave' ? 'Leave profile' : 'Remove access'}
        destructive
        loading={vm.actionLoading}
        error={vm.actionError}
        onConfirm={confirmAction}
        onCancel={vm.cancelAction}
      />
    </Screen>
  );
}

// A small red text button used inside list rows.
function SmallAction({ label, accessibilityLabel, onPress }: { label: string; accessibilityLabel: string; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={styles.smallAction}>
      <Text style={[styles.smallActionText, { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 15, lineHeight: 21 },
  card: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 12 },
  heading: { fontSize: 17, fontWeight: '700' },
  muted: { fontSize: 15 },
  success: { fontSize: 15, fontWeight: '600' },
  personRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  person: { fontSize: 15, flexShrink: 1 },
  smallAction: { paddingVertical: 8, paddingHorizontal: 4 },
  smallActionText: { fontSize: 14, fontWeight: '700' },
});
