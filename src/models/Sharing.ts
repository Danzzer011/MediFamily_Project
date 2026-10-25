import type { IsoTimestamp, RecordMeta } from './common';

/** An accepted shared member of a profile (FR09). The creator is not listed here. */
export interface ProfileMember {
  profileId: string;
  userId: string;
  email: string;
  joinedAt: IsoTimestamp;
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

/**
 * An invitation for one registered account to access one profile (FR09).
 * `profileName` and `inviterEmail` are copies saved when the invitation is
 * created, so recipients can see them without reading the profile.
 */
export interface ProfileInvitation extends RecordMeta {
  profileId: string;
  recipientUserId: string;
  recipientEmail: string;
  status: InvitationStatus;
  profileName: string;
  inviterEmail: string;
}
