import { useEffect, useRef, useState } from 'react';
import { useOffline } from '../../context/OfflineContext';

export default function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing } = useOffline();

  // Show a brief "All synced!" toast after pending → 0
  const [justSynced, setJustSynced]   = useState(false);
  const prevPendingRef                 = useRef(pendingCount);
  const justSyncedTimer                = useRef(null);

  // Detect when pending count drops to 0 while online → show success flash
  useEffect(() => {
    const prev = prevPendingRef.current;
    prevPendingRef.current = pendingCount;

    if (prev > 0 && pendingCount === 0 && isOnline) {
      setJustSynced(true);
      clearTimeout(justSyncedTimer.current);
      justSyncedTimer.current = setTimeout(() => setJustSynced(false), 2500);
    }
    return () => clearTimeout(justSyncedTimer.current);
  }, [pendingCount, isOnline]);

  const base =
    "fixed top-0 left-0 right-0 z-[60] h-9 flex items-center justify-center gap-2 text-sm font-medium px-4 text-center";

  // ① Brief "All synced!" confirmation
  if (justSynced) {
    return (
      <div className={`${base} bg-emerald-600 text-white`}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        All actions synced!
      </div>
    );
  }

  // ② Actively syncing (blue)
  if (isSyncing) {
    return (
      <div className={`${base} bg-blue-600 text-white`}>
        <span className="w-3.5 h-3.5 shrink-0 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        Syncing {pendingCount} saved action{pendingCount !== 1 ? 's' : ''} to server…
      </div>
    );
  }

  // ③ Offline
  if (!isOnline) {
    return (
      <div className={`${base} bg-yellow-500 text-black`}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M3 3l18 18" />
        </svg>
        {pendingCount > 0
          ? `Offline · ${pendingCount} action${pendingCount !== 1 ? 's' : ''} queued — will sync when reconnected`
          : 'You are offline · Changes will sync when reconnected'}
      </div>
    );
  }

  // ④ Back online but retry pending (shown only briefly — retry fires in 3 s)
  if (pendingCount > 0) {
    return (
      <div className={`${base} bg-green-600 text-white`}>
        <span className="w-3.5 h-3.5 shrink-0 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        Back online — syncing {pendingCount} pending action{pendingCount !== 1 ? 's' : ''}…
      </div>
    );
  }

  return null;
}
