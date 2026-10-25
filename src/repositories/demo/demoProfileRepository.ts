// DEMONSTRATION DATA — see demoDatabase.ts.
import { AppError } from '../../models/errors';
import {
  BLOOD_TYPES,
  type FamilyProfile,
  type HealthInformation,
  type ProfileBasicInput,
} from '../../models/FamilyProfile';
import { validateDateOfBirth, validateEmergencyContact, validateProfileName } from '../../models/validation';
import type { ProfileRepository } from '../profileRepository';
import {
  copyProfile,
  demoRequest,
  demoTables,
  findAccessibleProfile,
  hasProfileAccess,
  isProfileCreator,
  newDemoId,
  nowIso,
  removeWhere,
  requireDemoAccount,
} from './demoDatabase';

// The backend checks the same rules as the forms (database constraints in Phase 2).
function checkBasicInput(input: ProfileBasicInput): void {
  const problem = validateProfileName(input.name) ?? validateDateOfBirth(input.dateOfBirth);
  if (problem) throw new AppError('validation', problem);
}

function checkHealthInformation(info: HealthInformation): void {
  if (info.bloodType !== null && !BLOOD_TYPES.includes(info.bloodType)) {
    throw new AppError('validation', 'Choose a valid blood type.');
  }
  for (const contact of info.emergencyContacts) {
    const problems = validateEmergencyContact(contact);
    if (problems.name || problems.phone) {
      throw new AppError('validation', 'Every emergency contact needs a name and a valid telephone number.');
    }
  }
}

function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
}

/** Applies a versioned change, as the backend's atomic version check would. */
function applyVersionedChange(
  profileId: string,
  expectedVersion: number,
  change: Partial<FamilyProfile>,
): FamilyProfile {
  const account = requireDemoAccount();
  const profile = demoTables.profiles.find((p) => p.id === profileId);
  if (!profile) throw new AppError('stale_record');
  if (!hasProfileAccess(profile, account.id)) throw new AppError('not_allowed');
  if (profile.version !== expectedVersion) throw new AppError('stale_record');
  Object.assign(profile, change, { version: profile.version + 1, updatedAt: nowIso() });
  return copyProfile(profile);
}

export const demoProfileRepository: ProfileRepository = {
  async listAccessibleProfiles() {
    await demoRequest('read');
    const account = requireDemoAccount();
    return demoTables.profiles
      .filter((p) => hasProfileAccess(p, account.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        dateOfBirth: p.dateOfBirth,
        isCreator: isProfileCreator(p, account.id),
      }));
  },

  async getProfile(profileId) {
    await demoRequest('read');
    const account = requireDemoAccount();
    return copyProfile(findAccessibleProfile(profileId, account.id));
  },

  async createProfile(input) {
    await demoRequest('write');
    const account = requireDemoAccount();
    checkBasicInput(input);
    const time = nowIso();
    const profile: FamilyProfile = {
      id: newDemoId('profile'),
      version: 1,
      createdAt: time,
      updatedAt: time,
      creatorId: account.id,
      name: input.name.trim(),
      dateOfBirth: input.dateOfBirth,
      timeZone: deviceTimeZone(),
      bloodType: null,
      allergies: null,
      medicalConditions: null,
      pastSurgeries: null,
      emergencyContacts: [],
    };
    demoTables.profiles.push(profile);
    return copyProfile(profile);
  },

  async updateBasicInfo(profileId, expectedVersion, input) {
    await demoRequest('write');
    checkBasicInput(input);
    return applyVersionedChange(profileId, expectedVersion, {
      name: input.name.trim(),
      dateOfBirth: input.dateOfBirth,
    });
  },

  async updateHealthInformation(profileId, expectedVersion, info) {
    await demoRequest('write');
    checkHealthInformation(info);
    return applyVersionedChange(profileId, expectedVersion, {
      bloodType: info.bloodType,
      allergies: info.allergies,
      medicalConditions: info.medicalConditions,
      pastSurgeries: info.pastSurgeries,
      emergencyContacts: info.emergencyContacts.map((c) => ({ ...c })),
    });
  },

  async deleteProfile(profileId, expectedVersion) {
    await demoRequest('write');
    const account = requireDemoAccount();
    const profile = demoTables.profiles.find((p) => p.id === profileId);
    if (!profile) throw new AppError('stale_record');
    if (!isProfileCreator(profile, account.id)) {
      throw new AppError('not_allowed', 'Only the profile creator can delete this profile.');
    }
    if (profile.version !== expectedVersion) throw new AppError('stale_record');
    removeWhere(demoTables.profiles, (p) => p.id === profileId);
    removeWhere(demoTables.memberships, (m) => m.profileId === profileId);
    removeWhere(demoTables.invitations, (i) => i.profileId === profileId);
    removeWhere(demoTables.medications, (m) => m.profileId === profileId);
    removeWhere(demoTables.prescriptions, (p) => p.profileId === profileId);
    removeWhere(demoTables.documents, (d) => d.profileId === profileId);
  },
};
