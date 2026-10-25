import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { Account } from '../models/Account';
import { authRepository } from '../repositories/authRepository';

type SessionValue = {
  account: Account | null;
  isLoading: boolean;
};

// 1. create the context (the "shared box")
const SessionContext = createContext<SessionValue | null>(null);

// 2. the provider follows the signed-in account and wraps the whole app (see app/_layout.tsx).
//    Logging in and out is done by ViewModels through authRepository; this only listens.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authRepository
      .getCurrentAccount()
      .then(setAccount)
      .catch(() => setAccount(null))
      .finally(() => setIsLoading(false));

    // listen for log in / log out, and stop listening when the app closes
    const unsubscribe = authRepository.onAccountChange(setAccount);
    return unsubscribe;
  }, []);

  return <SessionContext.Provider value={{ account, isLoading }}>{children}</SessionContext.Provider>;
}

// 3. a custom hook: any page calls useSession() to read the signed-in account
export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession() must be used inside <SessionProvider>');
  return value;
}
