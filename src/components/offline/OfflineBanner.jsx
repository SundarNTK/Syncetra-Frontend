import { useOffline } from '../../context/OfflineContext';

export default function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing } = useOffline();

  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  if (isSyncing) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white text-center text-sm py-1.5 px-4">
        Syncing {pendingCount} saved action{pendingCount !== 1 ? 's' : ''} to server...
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black text-center text-sm py-1.5 px-4">
        {pendingCount > 0
          ? `Offline · ${pendingCount} action${pendingCount !== 1 ? 's' : ''} saved — will sync when connected`
          : 'You are offline · Changes will sync when reconnected'}
      </div>
    );
  }

  // Online but still has unsynced items (e.g. just came back online, drain in progress start)
  if (pendingCount > 0) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white text-center text-sm py-1.5 px-4">
        Back online — syncing {pendingCount} pending action{pendingCount !== 1 ? 's' : ''}...
      </div>
    );
  }

  return null;
}
