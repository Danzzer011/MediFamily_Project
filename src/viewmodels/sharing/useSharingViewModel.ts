import { useEffect, useState } from 'react';

import { useSelectedProfile } from '../../context/SelectedProfileContext';
import { useSession } from '../../context/SessionContext';
import { toAppError } from '../../models/errors';
import type { FamilyProfile } from '../../models/FamilyProfile';
import type { ProfileInvitation, ProfileMember } from '../../models/Sharing';
import { validateEmail } from '../../models/validation';
import { sharingRepository } from '../../repositories/sharingRepository';
import { profileRepository } from '../../repositories/profileRepository';
import { clearProfileReminders } from '../../services/medicationReminders';
import { useReloadOnFocus } from '../shared/useReloadOnFocus';

// The action waiting for the user to confirm in the dialog.
type PendingAction = { type: 'revoke'; member: ProfileMember } | { type: 'leave' } | null;

// ViewModel for the Sharing and Invitations page (FR09) of one profile.
// The creator invites, cancels invitations and revokes access; shared members can leave.
// The repository checks the same permissions, so hiding buttons is not the only protection.
export function useSharingViewModel(profileId: string) {
  const { account } = useSession();
  const { clearSelectedProfile } = useSelectedProfile();
  const { reloadKey, reload } = useReloadOnFocus();

  const [profile, setProfile] = useState<FamilyProfile | null>(null);
  const [members, setMembers] = useState<ProfileMember[]>([]);
  const [invitations, setInvitations] = useState<ProfileInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);
  const [cancellingId, setCancellingId] = useState('');
  const [listError, setListError] = useState('');

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const isCreator = profile !== null && profile.creatorId === account?.id;

  // load the profile, its members and (for the creator) its pending invitations
  useEffect(() => {
    if (reloadKey === 0) return;
    let active = true;
    async function load() {
      const loadedProfile = await profileRepository.getProfile(profileId);
      const loadedMembers = await sharingRepository.listMembers(profileId);
      const creator = loadedProfile.creatorId === account?.id;
      const loadedInvitations = creator ? await sharingRepository.listPendingInvitations(profileId) : [];
      return { loadedProfile, loadedMembers, loadedInvitations };
    }
    load()
      .then(({ loadedProfile, loadedMembers, loadedInvitations }) => {
        if (!active) return;
        setLoadError('');
        setProfile(loadedProfile);
        setMembers(loadedMembers);
        setInvitations(loadedInvitations);
      })
      .catch((error) => {
        if (!active) return;
        setProfile(null);
        setLoadError(toAppError(error).message);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [profileId, reloadKey, account?.id]);

  function changeInviteEmail(text: string) {
    setInviteEmail(text);
    setInviteError('');
    setInviteMessage('');
  }

  async function invite() {
    if (inviting) return;
    const problem = validateEmail(inviteEmail);
    setInviteMessage('');
    if (problem) {
      setInviteError(problem);
      return;
    }
    setInviting(true);
    try {
      const invitation = await sharingRepository.inviteByEmail(profileId, inviteEmail.trim());
      setInviteEmail('');
      setInviteError('');
      setInviteMessage(`Invitation sent to ${invitation.recipientEmail}.`);
      reload();
    } catch (error) {
      setInviteError(toAppError(error).message);
    }
    setInviting(false);
  }

  async function cancelInvitation(invitation: ProfileInvitation) {
    if (cancellingId) return;
    setCancellingId(invitation.id);
    setListError('');
    setInviteMessage('');
    try {
      await sharingRepository.cancelInvitation(invitation.id, invitation.version);
    } catch (error) {
      setListError(toAppError(error).message);
    }
    setCancellingId('');
    reload();
  }

  function askToRevoke(member: ProfileMember) {
    setActionError('');
    setPendingAction({ type: 'revoke', member });
  }

  function askToLeave() {
    setActionError('');
    setPendingAction({ type: 'leave' });
  }

  function cancelAction() {
    setPendingAction(null);
    setActionError('');
  }

  // runs the confirmed action. Returns 'left' when the user left the profile.
  async function confirmAction(): Promise<'left' | 'done' | 'failed'> {
    if (!pendingAction || actionLoading) return 'failed';
    setActionLoading(true);
    setActionError('');
    try {
      if (pendingAction.type === 'revoke') {
        await sharingRepository.revokeMember(profileId, pendingAction.member.userId);
      } else {
        await sharingRepository.leaveProfile(profileId);
        if (account) clearProfileReminders(account.id, profileId).catch(() => undefined);
        clearSelectedProfile();
      }
      const result = pendingAction.type === 'leave' ? 'left' : 'done';
      setPendingAction(null);
      setActionLoading(false);
      if (result === 'done') reload();
      return result;
    } catch (error) {
      setActionError(toAppError(error).message);
      setActionLoading(false);
      return 'failed';
    }
  }

  return {
    accountId: account?.id ?? '',
    profile,
    isCreator,
    members,
    invitations,
    loading,
    loadError,
    inviteEmail,
    inviteError,
    inviteMessage,
    inviting,
    cancellingId,
    listError,
    pendingAction,
    actionLoading,
    actionError,
    changeInviteEmail,
    invite,
    cancelInvitation,
    askToRevoke,
    askToLeave,
    cancelAction,
    confirmAction,
  };
}
