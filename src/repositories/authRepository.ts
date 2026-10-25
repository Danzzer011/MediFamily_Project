import type { Account } from '../models/Account';
import { demoAuthRepository } from './demo/demoAuthRepository';

export type RegisterResult = {
  /** True when the provider requires the email address to be confirmed before signing in. */
  needsEmailConfirmation: boolean;
};

/** Account registration, sign-in and the current session. */
export type AuthRepository = {
  getCurrentAccount(): Promise<Account | null>;
  signIn(email: string, password: string): Promise<Account>;
  /** Creates an account only — never a health profile (FR01). */
  register(email: string, password: string): Promise<RegisterResult>;
  signOut(): Promise<void>;
  /** Notifies on sign-in and sign-out. Returns an unsubscribe function. */
  onAccountChange(listener: (account: Account | null) => void): () => void;
};

// Phase 1: demonstration data. Replace with the Supabase adapter in Phase 2.
export const authRepository: AuthRepository = demoAuthRepository;
