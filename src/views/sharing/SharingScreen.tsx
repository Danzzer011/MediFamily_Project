import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import ConfirmDialog from '../../components/ConfirmDialog';
import DemoDataNotice from '../../components/DemoDataNotice';
import ErrorBanner from '../../components/ErrorBanner';
import ErrorView from '../../components/ErrorView';
import Dock from '../../components/ledger/Dock';
import LedgerList from '../../components/ledger/LedgerList';
import LedgerScreen from '../../components/ledger/LedgerScreen';
import PageTitle from '../../components/ledger/PageTitle';
import SectionLabel from '../../components/ledger/SectionLabel';
import LinkAction from '../../components/LinkAction';
import LoadingView from '../../components/LoadingView';
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
    <LedgerScreen>
      <Stack.Screen options={{ title: `${profile.name} · Sharing` }} />
      <PageTitle text="Sharing and invitations" />
      <Text style={[styles.intro, { color: colors.textMuted }]}>
        Everyone with access can view and update this profile’s information and records.{' '}
        {vm.isCreator
          ? 'As the creator, only you can invite people, cancel invitations, remove access or delete the profile.'
          : 'Only the profile creator can invite people, remove access or delete the profile.'}
      </Text>

      {vm.isCreator ? (
        <>
          <SectionLabel label="Invite someone" />
          <View style={styles.form}>
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
        </>
      ) : null}

      {vm.listError ? (
        <View style={styles.padded}>
          <ErrorBanner message={vm.listError} />
        </View>
      ) : null}

      {vm.isCreator ? (
        <>
          <SectionLabel label="Pending invitations" count={vm.invitations.length} />
          {vm.invitations.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>No pending invitations.</Text>
          ) : (
            <LedgerList>
              {vm.invitations.map((invitation) => (
                <View key={invitation.id} style={styles.personRow}>
                  <Text style={[styles.person, { color: colors.text }]}>{invitation.recipientEmail}</Text>
                  <LinkAction
                    danger
                    label={vm.cancellingId === invitation.id ? 'Cancelling…' : 'Cancel invitation'}
                    accessibilityLabel={`Cancel invitation for ${invitation.recipientEmail}`}
                    onPress={() => vm.cancelInvitation(invitation)}
                  />
                </View>
              ))}
            </LedgerList>
          )}
        </>
      ) : null}

      <SectionLabel label="Shared with" count={vm.members.length} />
      {vm.members.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>Not shared with anyone yet.</Text>
      ) : (
        <LedgerList>
          {vm.members.map((member) => (
            <View key={member.userId} style={styles.personRow}>
              <Text style={[styles.person, { color: colors.text }]}>
                {member.email}
                {member.userId === vm.accountId ? ' (you)' : ''}
              </Text>
              {vm.isCreator ? (
                <LinkAction
                  danger
                  label="Remove access"
                  accessibilityLabel={`Remove access for ${member.email}`}
                  onPress={() => vm.askToRevoke(member)}
                />
              ) : null}
            </View>
          ))}
        </LedgerList>
      )}

      {!vm.isCreator ? (
        <Dock>
          <Button title="Leave this profile" variant="danger" onPress={vm.askToLeave} />
        </Dock>
      ) : null}

      <View style={styles.demoNotice}>
        <DemoDataNotice />
      </View>

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
    </LedgerScreen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 15, lineHeight: 21, paddingHorizontal: 16 },
  form: { paddingHorizontal: 16, gap: 12 },
  padded: { paddingHorizontal: 16, paddingTop: 12 },
  success: { fontSize: 15, fontWeight: '600' },
  empty: { fontSize: 15, paddingHorizontal: 16 },
  personRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 6, paddingHorizontal: 16 },
  person: { fontSize: 15, flexShrink: 1 },
  demoNotice: { paddingHorizontal: 16, paddingTop: 20 },
});
