import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import type { Account } from '@/models/Account';
import { authRepository } from '@/repositories/authRepository';

type SessionState =
  | { status: 'loading'; account: null }
  | { status: 'signedOut'; account: null }
  | { status: 'signedIn'; account: Account };

const SessionContext = createContext<SessionState | null>(null);

/**
 * Exposes the signed-in account to the whole app. Sign-in, registration and
 * sign-out are performed by ViewModels through `authRepository`; this
 * provider only follows the resulting session changes.
 */
export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionState>({ status: 'loading', account: null });

  useEffect(() => {
    const apply = (account: Account | null) =>
      setSession(account ? { status: 'signedIn', account } : { status: 'signedOut', account: null });

    let active = true;
    authRepository
      .getCurrentAccount()
      .then((account) => active && apply(account))
      .catch(() => active && apply(null));
    const unsubscribe = authRepository.onAccountChange(apply);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return <SessionContext value={session}>{children}</SessionContext>;
}

export function useSession(): SessionState {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>.');
  return value;
}

/** For screens behind the signed-in guard, where an account is guaranteed. */
export function useSignedInAccount(): Account {
  const session = useSession();
  if (session.status !== 'signedIn') throw new Error('No signed-in account.');
  return session.account;
}
