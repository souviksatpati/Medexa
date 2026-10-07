import { Link } from "react-router-dom";
import type { ReferralUser } from "@/sync/referralAuth";
import { NotificationsBell } from "./NotificationsBell";
import { LanguageSelector } from "./LanguageSelector";
import { useConnectivityStore } from "@/sync/connectivityStore";

interface PortalHeaderProps {
  portalName: string;
  portalIcon: string;
  tierBadge: string;
  themeColor?: "teal" | "indigo" | "purple" | "rose";
  user: ReferralUser | null;
  onLogout: () => void;
  onOpenAuth?: () => void;
  allReferralsPath?: string;
  actionButton?: React.ReactNode;
}

export function PortalHeader({
  portalName,
  portalIcon,
  tierBadge,
  themeColor = "teal",
  user,
  onLogout,
  onOpenAuth,
  allReferralsPath = "/",
  actionButton,
}: PortalHeaderProps) {
  const { isOnline, isSyncing, queuedChangesCount, toggleConnectivity, triggerManualSync } =
    useConnectivityStore();

  const themeStyles = {
    teal: {
      border: "border-primary/20",
      bg: "bg-primary/5",
      iconBg: "bg-primary/10 text-primary",
      badge: "bg-primary/15 text-primary border-primary/25",
      role: "asha" as const,
    },
    indigo: {
      border: "border-indigo-500/20",
      bg: "bg-indigo-500/5",
      iconBg: "bg-indigo-600/10 text-indigo-700",
      badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
      role: "block" as const,
    },
    purple: {
      border: "border-purple-500/20",
      bg: "bg-purple-500/5",
      iconBg: "bg-purple-600/10 text-purple-700",
      badge: "bg-purple-50 text-purple-700 border-purple-200",
      role: "district" as const,
    },
    rose: {
      border: "border-rose-500/20",
      bg: "bg-rose-500/5",
      iconBg: "bg-rose-600/10 text-rose-700",
      badge: "bg-rose-50 text-rose-700 border-rose-200",
      role: "district" as const,
    },
  }[themeColor];

  return (
    <header className="mb-6 rounded-2xl border border-outline-variant bg-surface p-4 sm:p-5 shadow-xs">
      {/* Offline banner warning if offline */}
      {!isOnline && (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-amber-500/15 border border-amber-500/30 px-3.5 py-2 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-amber-700 text-sm">wifi_off</span>
            <span>
              <strong>Village Offline Mode:</strong> Changes are saved locally to IndexedDB & queued for automatic sync.
            </span>
          </div>
          <button
            type="button"
            onClick={triggerManualSync}
            disabled={isSyncing}
            className="font-bold text-teal-800 underline hover:text-teal-950 ml-2"
          >
            {isSyncing ? "Syncing..." : "Simulate Reconnect & Sync"}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        
        {/* Left Side: Back Link, Icon, Portal Name & Tier Badge */}
        <div className="flex items-start sm:items-center gap-3.5">
          <Link
            to={allReferralsPath}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
            title="Back to Portal Chooser"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>

          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${themeStyles.iconBg}`}>
            <span className="material-symbols-outlined text-2xl">{portalIcon}</span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-on-surface sm:text-2xl">{portalName}</h1>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${themeStyles.badge}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {tierBadge}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Dedicated isolated portal with role-scoped data visibility and authentication
            </p>
          </div>
        </div>

        {/* Right Side: Connectivity Toggle, Language, Notifications & Auth */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Offline/Online Interactive Demo Pill */}
          <button
            type="button"
            onClick={toggleConnectivity}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
              isOnline
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                : "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
            }`}
            title="Click to toggle Online / Offline connectivity for demo"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isOnline ? "bg-emerald-500" : "bg-amber-600 animate-pulse"
              }`}
            />
            <span>{isOnline ? "Online (4G)" : "Offline (Village)"}</span>
            {queuedChangesCount > 0 && !isOnline && (
              <span className="rounded-full bg-amber-200 text-amber-900 px-1.5 text-[10px] font-bold">
                {queuedChangesCount}
              </span>
            )}
          </button>

          {/* Sync Now Trigger if queued */}
          {queuedChangesCount > 0 && (
            <button
              type="button"
              onClick={triggerManualSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 hover:bg-teal-100 transition"
              title="Flush queued changes to server"
            >
              <span
                className={`material-symbols-outlined text-[14px] ${
                  isSyncing ? "animate-spin text-teal-600" : "text-teal-700"
                }`}
              >
                sync
              </span>
              <span>{isSyncing ? "Syncing..." : "Sync"}</span>
            </button>
          )}

          {/* Multilingual Selector */}
          <LanguageSelector />

          {/* Role Scoped Notifications Bell */}
          <NotificationsBell role={themeStyles.role} />

          {actionButton}

          {user ? (
            <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-base">verified_user</span>
              </div>
              <div className="text-left leading-tight pr-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-on-surface">{user.name}</span>
                  <span className="rounded-sm bg-emerald-500/10 px-1 text-[10px] font-bold text-emerald-600">
                    VERIFIED
                  </span>
                </div>
                <div className="text-[11px] text-on-surface-variant truncate max-w-[120px] sm:max-w-[160px]">
                  {user.designation || user.facilityOrVillage}
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="ml-1 inline-flex items-center gap-1 rounded-lg border border-outline-variant px-2 py-1 text-xs font-medium text-error hover:bg-error/5 hover:border-error/30 transition"
                title="Sign out of this role"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-xs transition hover:bg-primary-hover active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-sm">login</span>
                <span>Authenticate</span>
              </button>
            )
          )}
        </div>

      </div>
    </header>
  );
}
