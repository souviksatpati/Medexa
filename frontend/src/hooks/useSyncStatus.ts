import { useEffect, useState } from "react";
import { onSyncStatusChange, type SyncStatus } from "@/sync/syncEngine";

/**
 * Backs the "Offline — 3 records waiting to sync" / "3/3 records
 * synchronized" UI described in Build Guide Section 14 (Acts 1 & 3).
 * This is a small hook, but it's the one that has to work flawlessly
 * during a live demo — treat it with more care than its size suggests.
 */
export function useSyncStatus(): SyncStatus & { isOnline: boolean } {
  const [status, setStatus] = useState<SyncStatus>({
    pending: 0,
    syncing: false,
    lastSyncedAt: null,
    lastError: null,
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const unsubscribe = onSyncStatusChange(setStatus);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      unsubscribe();
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return { ...status, isOnline };
}
