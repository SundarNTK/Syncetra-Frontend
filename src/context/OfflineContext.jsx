import { createContext, useContext } from 'react';
import { useOfflineSync } from '../hooks/useOfflineSync';

const OfflineContext = createContext({ isOnline: true, pendingCount: 0, isSyncing: false });

export function OfflineProvider({ children }) {
  const state = useOfflineSync();
  return <OfflineContext.Provider value={state}>{children}</OfflineContext.Provider>;
}

export const useOffline = () => useContext(OfflineContext);
