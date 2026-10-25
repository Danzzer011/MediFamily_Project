// DEMONSTRATION DATA — see demoDatabase.ts.
import { AppError } from '../../models/errors';
import type { FamilyProfile } from '../../models/FamilyProfile';
import type { ProfileInvitation } from '../../models/Sharing';
import type { SharingRepository } from '../sharingRepository';
import {
  demoRequest,
  demoTables,
  findAccessibleProfile,
  isProfileCreator,
  newDemoId,
  nowIso,
  removeWhere,
  requireDemoAccount,
} from './demoDatabase';

function requireCreatorOf(profileId: string, userId: string): FamilyProfile {
  const profile = findAccessibleProfile(profileId, userId);
  if (!isProfileCreator(profile, userId)) {
    throw new AppError('not_allowed', 'Only the profile creator can manage sharing.');
  }
  return profile;
}

function emailOf(userId: string): string {
  return demoTables.accounts.find((a) => a.id === userId)?.email ?? '';
}

/** Finds an invitation and checks its version, as the backend transaction would. */
function findCurrentInvitation(invitationId: string, expectedVersion: number): ProfileInvitation {
  const invitation = demoTables.invitations.find((i) => i.id === invitationId);
  if (!invitation || invitation.version !== expectedVersion || invitation.status !== 'pending') {
    throw new AppError('stale_record', 'This invitation is no longer pending. Reload to see the latest state.');
  }
  return invitation;
}

function setInvitationStatus(invitation: ProfileInvitation, status: ProfileInvitation['status']): void {
  invitation.status = status;
  invitation.version += 1;
  invitation.updatedAt = nowIso();
}

export const demoSharingRepository: SharingRepository = {
  async listMyPendingInvitations() {
    await demoRequest('read');
    const account = requireDemoAccount();
    return demoTables.invitations
      .filter((i) => i.recipientUserId === account.id && i.status === 'pending')
      .map((i) => ({ ...i }));
  },

  async listPendingInvitations(profileId) {
    await demoRequest('read');
    const account = requireDemoAccount();
    requireCreatorOf(profileId, account.id);
    return demoTables.invitations
      .filter((i) => i.profileId === profileId && i.status === 'pending')
      .map((i) => ({ ...i }));
  },

  async listMembers(profileId) {
    await demoRequest('read');
    const account = requireDemoAccount();
    findAccessibleProfile(profileId, account.id);
    return demoTables.memberships
      .filter((m) => m.profileId === profileId)
      .map((m) => ({ ...m, email: emailOf(m.userId) }));
  },

  async inviteByEmail(profileId, email) {
    await demoRequest('write');
    const account = requireDemoAccount();
    const profile = requireCreatorOf(profileId, account.id);
    const recipient = demoTables.accounts.find((a) => a.email === email.trim().toLowerCase());
    if (!recipient) {
      throw new AppError('validation', 'No registered account uses this email address.');
    }
    if (recipient.id === profile.creatorId) {
      throw new AppError('validation', 'You already own this profile.');
    }
    if (demoTables.memberships.some((m) => m.profileId === profileId && m.userId === recipient.id)) {
      throw new AppError('validation', 'This person already has access to the profile.');
    }
    if (
      demoTables.invitations.some(
        (i) => i.profileId === profileId && i.recipientUserId === recipient.id && i.status === 'pending',
      )
    ) {
      throw new AppError('validation', 'This person already has a pending invitation.');
    }
    const time = nowIso();
    const invitation: ProfileInvitation = {
      id: newDemoId('invitation'),
      version: 1,
      createdAt: time,
      updatedAt: time,
      profileId,
      recipientUserId: recipient.id,
      recipientEmail: recipient.email,
      status: 'pending',
      profileName: profile.name,
      inviterEmail: account.email,
    };
    demoTables.invitations.push(invitation);
    return { ...invitation };
  },

  async cancelInvitation(invitationId, expectedVersion) {
    await demoRequest('write');
    const account = requireDemoAccount();
    const invitation = findCurrentInvitation(invitationId, expectedVersion);
    requireCreatorOf(invitation.profileId, account.id);
    setInvitationStatus(invitation, 'cancelled');
  },

  async respondToInvitation(invitationId, expectedVersion, accept) {
    await demoRequest('write');
    const account = requireDemoAccount();
    const invitation = findCurrentInvitation(invitationId, expectedVersion);
    if (invitation.recipientUserId !== account.id) throw new AppError('not_allowed');
    if (accept) {
      if (!demoTables.profiles.some((p) => p.id === invitation.profileId)) {
        throw new AppError('not_found', 'This profile no longer exists.');
      }
      demoTables.memberships.push({
        profileId: invitation.profileId,
        userId: account.id,
        joinedAt: nowIso(),
      });
    }
    setInvitationStatus(invitation, accept ? 'accepted' : 'declined');
  },

  async revokeMember(profileId, userId) {
    await demoRequest('write');
    const account = requireDemoAccount();
    requireCreatorOf(profileId, account.id);
    removeWhere(demoTables.memberships, (m) => m.profileId === profileId && m.userId === userId);
  },

  async leaveProfile(profileId) {
    await demoRequest('write');
    const account = requireDemoAccount();
    const profile = findAccessibleProfile(profileId, account.id);
    if (isProfileCreator(profile, account.id)) {
      throw new AppError('not_allowed', 'The creator cannot leave their own profile.');
    }
    removeWhere(demoTables.memberships, (m) => m.profileId === profileId && m.userId === account.id);
  },
};
