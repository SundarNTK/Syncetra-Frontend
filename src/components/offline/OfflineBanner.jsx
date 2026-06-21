import { useOffline } from '../../context/OfflineContext';

export default function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing } = useOffline();

  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  const base = "fixed top-0 left-0 right-0 z-[60] h-9 flex items-center justify-center text-sm font-medium px-4 text-center";

  if (isSyncing) {
    return (
      <div className={`${base} bg-blue-600 text-white`}>
        Syncing {pendingCount} saved action{pendingCount !== 1 ? 's' : ''} to server…
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className={`${base} bg-yellow-500 text-black`}>
        {pendingCount > 0
          ? `Offline · ${pendingCount} action${pendingCount !== 1 ? 's' : ''} saved — will sync when connected`
          : 'You are offline · Changes will sync when reconnected'}
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className={`${base} bg-green-600 text-white`}>
        Back online — syncing {pendingCount} pending action{pendingCount !== 1 ? 's' : ''}…
      </div>
    );
  }

  return null;
}
