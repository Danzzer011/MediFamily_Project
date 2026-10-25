// DEMONSTRATION DATA — see demoDatabase.ts.
import { AppError } from '../../models/errors';
import type { AuthRepository } from '../authRepository';
import {
  demoRequest,
  demoTables,
  getDemoCurrentAccount,
  newDemoId,
  setDemoCurrentAccount,
  subscribeDemoAccount,
} from './demoDatabase';

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const demoAuthRepository: AuthRepository = {
  async getCurrentAccount() {
    return getDemoCurrentAccount();
  },

  async signIn(email, password) {
    await demoRequest('write');
    const account = demoTables.accounts.find((a) => a.email === normaliseEmail(email));
    if (!account || account.password !== password) {
      throw new AppError('auth', 'Incorrect email or password.');
    }
    setDemoCurrentAccount(account.id);
    return { id: account.id, email: account.email };
  },

  async register(email, password) {
    await demoRequest('write');
    const normalised = normaliseEmail(email);
    if (demoTables.accounts.some((a) => a.email === normalised)) {
      throw new AppError('auth', 'An account with this email already exists.');
    }
    const id = newDemoId('account');
    demoTables.accounts.push({ id, email: normalised, password });
    setDemoCurrentAccount(id);
    return { needsEmailConfirmation: false };
  },

  async signOut() {
    setDemoCurrentAccount(null);
  },

  onAccountChange(listener) {
    return subscribeDemoAccount(listener);
  },
};
