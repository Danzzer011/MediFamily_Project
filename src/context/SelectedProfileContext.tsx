import { createContext, use, useState, type PropsWithChildren } from 'react';

import type { ProfileSummary } from '@/models/FamilyProfile';
import { useSession } from './SessionContext';

interface SelectedProfileValue {
  /** The profile chosen on the selection screen, or null if none is selected. */
  selectedProfile: ProfileSummary | null;
  selectProfile: (profile: ProfileSummary) => void;
  clearSelectedProfile: () => void;
}

const SelectedProfileContext = createContext<SelectedProfileValue | null>(null);

/**
 * Remembers which profile the user is working on, as a navigation
 * convenience. It never replaces backend permission checks. The selection
 * belongs to the account that made it, so it disappears on sign-out or when
 * another account signs in.
 */
export function SelectedProfileProvider({ children }: PropsWithChildren) {
  const { account } = useSession();
  const [selection, setSelection] = useState<{ accountId: string; profile: ProfileSummary } | null>(
    null,
  );

  const selectedProfile =
    selection && account && selection.accountId === account.id ? selection.profile : null;

  const value: SelectedProfileValue = {
    selectedProfile,
    selectProfile: (profile) => {
      if (account) setSelection({ accountId: account.id, profile });
    },
    clearSelectedProfile: () => setSelection(null),
  };

  return <SelectedProfileContext value={value}>{children}</SelectedProfileContext>;
}

export function useSelectedProfile(): SelectedProfileValue {
  const value = use(SelectedProfileContext);
  if (!value) throw new Error('useSelectedProfile must be used inside <SelectedProfileProvider>.');
  return value;
}
