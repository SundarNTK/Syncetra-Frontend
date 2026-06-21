import { useEffect } from 'react';

/**
 * Re-runs `load` whenever the offline queue finishes syncing.
 * Add this to any component that renders a list to get fresh server data
 * automatically after coming back online.
 *
 * Usage:
 *   useOnlineReload(load);
 */
export const useOnlineReload = (load) => {
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('syncetra:synced', handler);
    return () => window.removeEventListener('syncetra:synced', handler);
  }, [load]);
};
