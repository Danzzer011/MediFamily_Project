import { useEffect, useState } from 'react';

import { useSelectedProfile } from '../../context/SelectedProfileContext';
import { useSession } from '../../context/SessionContext';
import { toAppError } from '../../models/errors';
import type { ProfileSummary } from '../../models/FamilyProfile';
import type { ProfileInvitation } from '../../models/Sharing';
import { authRepository } from '../../repositories/authRepository';
import { profileRepository } from '../../repositories/profileRepository';
import { sharingRepository } from '../../repositories/sharingRepository';
import { useReloadOnFocus } from '../shared/useReloadOnFocus';

// ViewModel for the Family Profiles page (FR01) with the incoming invitations (FR09),
// so invitations can be answered before choosing a profile.
export function useProfilesViewModel() {
  const { account } = useSession();
  const { selectedProfile, selectProfile, clearSelectedProfile } = useSelectedProfile();
  const { reloadKey, reload } = useReloadOnFocus();

  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [invitations, setInvitations] = useState<ProfileInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [invitationError, setInvitationError] = useState('');
  const [respondingId, setRespondingId] = useState('');

  // load profiles and invitations together every time the page is shown
  useEffect(() => {
    if (reloadKey === 0) return;
    let active = true;
    Promise.all([profileRepository.listAccessibleProfiles(), sharingRepository.listMyPendingInvitations()])
      .then(([loadedProfiles, loadedInvitations]) => {
        if (!active) return;
        setLoadError('');
        setProfiles(loadedProfiles);
        setInvitations(loadedInvitations);
      })
      .catch((error) => active && setLoadError(toAppError(error).message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  // if the selected profile is no longer accessible (deleted, revoked, left), forget it
  useEffect(() => {
    if (loading || loadError || !selectedProfile) return;
    if (!profiles.some((p) => p.id === selectedProfile.id)) clearSelectedProfile();
  }, [loading, loadError, profiles, selectedProfile, clearSelectedProfile]);

  function openProfile(profile: ProfileSummary) {
    selectProfile(profile);
  }

  async function respondToInvitation(invitation: ProfileInvitation, accept: boolean) {
    if (respondingId) return;
    setRespondingId(invitation.id);
    setInvitationError('');
    try {
      await sharingRepository.respondToInvitation(invitation.id, invitation.version, accept);
    } catch (error) {
      setInvitationError(toAppError(error).message);
    }
    setRespondingId('');
    reload(); // an accepted invitation adds the existing profile to the list
  }

  async function logOut() {
    clearSelectedProfile();
    await authRepository.signOut();
  }

  return {
    email: account?.email ?? '',
    profiles,
    invitations,
    loading,
    loadError,
    invitationError,
    respondingId,
    reload,
    openProfile,
    respondToInvitation,
    logOut,
  };
}
