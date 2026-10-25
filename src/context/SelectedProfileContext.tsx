import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

import type { ProfileSummary } from '../models/FamilyProfile';
import { useSession } from './SessionContext';

type SelectedProfileValue = {
  selectedProfile: ProfileSummary | null;
  selectProfile: (profile: ProfileSummary) => void;
  clearSelectedProfile: () => void;
};

// 1. create the context
const SelectedProfileContext = createContext<SelectedProfileValue | null>(null);

// 2. the provider remembers which profile the user is working on.
//    This only helps navigation; the backend still checks who can see each profile.
export function SelectedProfileProvider({ children }: { children: ReactNode }) {
  const { account } = useSession();
  const [selection, setSelection] = useState<{ accountId: string; profile: ProfileSummary } | null>(null);

  // a selection only counts for the account that made it, so it disappears on log out
  const selectedProfile = selection && account && selection.accountId === account.id ? selection.profile : null;

  // useCallback keeps these functions the same between renders, so pages can safely
  // call them from inside a useEffect
  const accountId = account?.id;
  const selectProfile = useCallback(
    (profile: ProfileSummary) => {
      if (accountId) setSelection({ accountId, profile });
    },
    [accountId],
  );
  const clearSelectedProfile = useCallback(() => setSelection(null), []);

  const value: SelectedProfileValue = { selectedProfile, selectProfile, clearSelectedProfile };

  return <SelectedProfileContext.Provider value={value}>{children}</SelectedProfileContext.Provider>;
}

// 3. a custom hook: any page calls useSelectedProfile() to read or change the selection
export function useSelectedProfile() {
  const value = useContext(SelectedProfileContext);
  if (!value) throw new Error('useSelectedProfile() must be used inside <SelectedProfileProvider>');
  return value;
}
