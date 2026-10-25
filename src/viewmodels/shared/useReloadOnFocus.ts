import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

// Gives a ViewModel a number that goes up every time its page comes back into view
// (and whenever reload() is called). ViewModels load their data in a useEffect that
// depends on reloadKey, so returning to a page always shows the latest saved data.
export function useReloadOnFocus() {
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setReloadKey((key) => key + 1);
    }, []),
  );

  function reload() {
    setReloadKey((key) => key + 1);
  }

  return { reloadKey, reload };
}
