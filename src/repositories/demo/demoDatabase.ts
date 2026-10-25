/**
 * DEMONSTRATION DATA — Phase 1 prototype only.
 *
 * An in-memory stand-in for the cloud backend, shaped like the planned
 * tables (accounts, family_profiles, profile_members, profile_invitations).
 * It mimics the backend's permission and version checks so ViewModels can be
 * built against realistic behaviour, but it is NOT persistent, shared between
 * devices or secure. Everything resets when the app reloads.
 */
import type { Account } from '../../models/Account';
import type { FamilyProfile } from '../../models/FamilyProfile';
import type { ProfileInvitation } from '../../models/Sharing';
import { AppError } from '../../models/errors';

type DemoAccount = Account & {
  /** Demo only: real passwords are handled by the auth provider, never stored by the app. */
  password: string;
};

type DemoMembership = {
  profileId: string;
  userId: string;
  joinedAt: string;
};

const SEED_TIME = '2026-10-01T09:00:00.000Z';

/** Test logins for the demo. All demo accounts share this password. */
export const DEMO_PASSWORD = 'demo1234';

const accounts: DemoAccount[] = [
  { id: 'demo-account-daniel', email: 'daniel@demo.medifamily', password: DEMO_PASSWORD },
  { id: 'demo-account-mazen', email: 'mazen@demo.medifamily', password: DEMO_PASSWORD },
  { id: 'demo-account-mohab', email: 'mohab@demo.medifamily', password: DEMO_PASSWORD },
];

const profiles: FamilyProfile[] = [
  {
    id: 'demo-profile-father',
    version: 1,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    creatorId: 'demo-account-daniel',
    name: 'Demo Father',
    dateOfBirth: '1962-04-18',
    timeZone: 'Africa/Cairo',
    bloodType: 'O+',
    allergies: 'Penicillin',
    medicalConditions: 'Type 2 diabetes',
    pastSurgeries: null,
    emergencyContacts: [{ name: 'Demo Sister', phone: '+20 100 000 0000' }],
  },
  {
    id: 'demo-profile-grandmother',
    version: 1,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    creatorId: 'demo-account-mazen',
    name: 'Demo Grandmother',
    dateOfBirth: '1940-11-02',
    timeZone: 'Africa/Cairo',
    bloodType: null,
    allergies: null,
    medicalConditions: null,
    pastSurgeries: null,
    emergencyContacts: [],
  },
];

const memberships: DemoMembership[] = [
  { profileId: 'demo-profile-father', userId: 'demo-account-mohab', joinedAt: SEED_TIME },
];

const invitations: ProfileInvitation[] = [
  {
    id: 'demo-invitation-1',
    version: 1,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    profileId: 'demo-profile-grandmother',
    recipientUserId: 'demo-account-daniel',
    recipientEmail: 'daniel@demo.medifamily',
    status: 'pending',
    profileName: 'Demo Grandmother',
    inviterEmail: 'mazen@demo.medifamily',
  },
];

export const demoTables = { accounts, profiles, memberships, invitations };

// ---- Session -------------------------------------------------------------

let currentAccountId: string | null = null;
const accountListeners = new Set<(account: Account | null) => void>();

export function getDemoCurrentAccount(): Account | null {
  const account = accounts.find((a) => a.id === currentAccountId);
  return account ? { id: account.id, email: account.email } : null;
}

export function setDemoCurrentAccount(accountId: string | null): void {
  currentAccountId = accountId;
  const account = getDemoCurrentAccount();
  accountListeners.forEach((listener) => listener(account));
}

export function subscribeDemoAccount(listener: (account: Account | null) => void): () => void {
  accountListeners.add(listener);
  return () => accountListeners.delete(listener);
}

/** Equivalent of the backend reading the caller from the auth token. */
export function requireDemoAccount(): Account {
  const account = getDemoCurrentAccount();
  if (!account) throw new AppError('auth', 'Your session has ended. Please sign in again.');
  return account;
}

// ---- Network simulation --------------------------------------------------

let online = true;

/** Lets a demo show the "internet required" behaviour for writes (FR09). */
export function setDemoOnline(value: boolean): void {
  online = value;
}

/** Simulates request latency so loading states are visible. */
export async function demoRequest(kind: 'read' | 'write'): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (kind === 'write' && !online) throw new AppError('offline');
}

// ---- Helpers shared by the demo repositories ------------------------------

let idCounter = 0;

export function newDemoId(prefix: string): string {
  idCounter += 1;
  return `demo-${prefix}-${Date.now()}-${idCounter}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function isProfileCreator(profile: FamilyProfile, userId: string): boolean {
  return profile.creatorId === userId;
}

export function hasProfileAccess(profile: FamilyProfile, userId: string): boolean {
  return (
    isProfileCreator(profile, userId) ||
    memberships.some((m) => m.profileId === profile.id && m.userId === userId)
  );
}

/** Finds a profile the caller may access, mirroring row-level security. */
export function findAccessibleProfile(profileId: string, userId: string): FamilyProfile {
  const profile = profiles.find((p) => p.id === profileId);
  if (!profile) throw new AppError('not_found');
  if (!hasProfileAccess(profile, userId)) throw new AppError('not_allowed');
  return profile;
}

export function removeWhere<T>(items: T[], predicate: (item: T) => boolean): void {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (predicate(items[i])) items.splice(i, 1);
  }
}

export function copyProfile(profile: FamilyProfile): FamilyProfile {
  return { ...profile, emergencyContacts: profile.emergencyContacts.map((c) => ({ ...c })) };
}
