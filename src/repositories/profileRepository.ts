import type {
  FamilyProfile,
  HealthInformation,
  ProfileBasicInput,
  ProfileSummary,
} from '@/models/FamilyProfile';
import { demoProfileRepository } from './demo/demoProfileRepository';

/**
 * Family profiles (FR01) and their health information (FR02).
 * Every operation acts as the signed-in account. Updates and deletions take
 * the version that was loaded and throw `AppError('stale_record')` if the
 * profile has changed since.
 */
export interface ProfileRepository {
  /** Profiles the account created or accepted an invitation to. */
  listAccessibleProfiles(): Promise<ProfileSummary[]>;
  getProfile(profileId: string): Promise<FamilyProfile>;
  createProfile(input: ProfileBasicInput): Promise<FamilyProfile>;
  updateBasicInfo(
    profileId: string,
    expectedVersion: number,
    input: ProfileBasicInput,
  ): Promise<FamilyProfile>;
  updateHealthInformation(
    profileId: string,
    expectedVersion: number,
    info: HealthInformation,
  ): Promise<FamilyProfile>;
  /** Creator only. Removes the profile with all its records, members and invitations. */
  deleteProfile(profileId: string, expectedVersion: number): Promise<void>;
}

// Phase 1: demonstration data. Replace with the Supabase adapter in Phase 2.
export const profileRepository: ProfileRepository = demoProfileRepository;
