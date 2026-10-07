import { useSyncStatus } from "@/hooks/useSyncStatus";

/**
 * Matches the sync-status pill markup from all four Stitch screens
 * (mobile header, desktop sidebar, mobile top bar variants). Carries
 * real narrative weight during the live demo — keep it legible from
 * across a room.
 */
export function SyncIndicator() {
  const { isOnline, pending, syncing } = useSyncStatus();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-xs bg-surface-container-low border border-outline-variant px-sm py-xs rounded-full">
        <div className="w-2 h-2 rounded-full bg-error" />
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          Offline
          {pending > 0 && ` — ${pending} record${pending === 1 ? "" : "s"} waiting to sync`}
        </span>
      </div>
    );
  }

  if (syncing) {
    return (
      <div className="flex items-center gap-xs bg-surface-container-low border border-outline-variant px-sm py-xs rounded-full">
        <div className="w-2 h-2 rounded-full bg-amber-accent animate-pulse" />
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          Syncing {pending} record{pending === 1 ? "" : "s"}...
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-xs bg-surface-container-low border border-outline-variant px-sm py-xs rounded-full">
      <div className="w-2 h-2 rounded-full bg-green-accent" />
      <span className="font-label-sm text-label-sm text-on-surface-variant">Online</span>
    </div>
  );
}
