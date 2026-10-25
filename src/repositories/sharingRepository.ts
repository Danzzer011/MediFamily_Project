import type { ProfileInvitation, ProfileMember } from '../models/Sharing';
import { demoSharingRepository } from './demo/demoSharingRepository';

/**
 * Invitations and memberships (FR09). Only a profile's creator can invite,
 * cancel invitations or revoke members; shared members can leave.
 */
export type SharingRepository = {
  /** Pending invitations addressed to the signed-in account. */
  listMyPendingInvitations(): Promise<ProfileInvitation[]>;
  /** Creator only: pending invitations sent for a profile. */
  listPendingInvitations(profileId: string): Promise<ProfileInvitation[]>;
  /** Accepted shared members of a profile (excluding the creator). */
  listMembers(profileId: string): Promise<ProfileMember[]>;
  /**
   * Creator only. Rejects unknown emails, the creator, existing members and
   * accounts that already have a pending invitation for this profile.
   */
  inviteByEmail(profileId: string, email: string): Promise<ProfileInvitation>;
  cancelInvitation(invitationId: string, expectedVersion: number): Promise<void>;
  /** Accepting grants access to the existing profile; no copy is made. */
  respondToInvitation(invitationId: string, expectedVersion: number, accept: boolean): Promise<void>;
  revokeMember(profileId: string, userId: string): Promise<void>;
  leaveProfile(profileId: string): Promise<void>;
};

// Phase 1: demonstration data. Replace with the Supabase adapter in Phase 2.
export const sharingRepository: SharingRepository = demoSharingRepository;
