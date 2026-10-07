import { Link } from "react-router-dom";
import { useAuth } from "@/auth/auth";
import { getDefaultDashboard, ROLE_PORTAL_LABELS } from "@/auth/rolePermissions";

export function AccessDeniedPage() {
  const { user, logout } = useAuth();

  const targetDashboard = getDefaultDashboard(user?.role);
  const portalLabel = user?.role ? ROLE_PORTAL_LABELS[user.role] : "My Care Portal";

  return (
    <div className="min-h-screen bg-[#f5f9f8] text-[#111918] flex items-center justify-center p-4 sm:p-6 selection:bg-primary/20">
      <div className="w-full max-w-lg rounded-3xl border border-red-200/80 bg-white/95 p-8 sm:p-10 shadow-2xl backdrop-blur-md text-center">
        {/* Shield Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-600 border border-red-100 shadow-sm mb-6">
          <span className="material-symbols-outlined text-5xl">shield_lock</span>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3.5 py-1 text-xs font-bold text-red-700 mb-3">
          <span className="material-symbols-outlined text-sm">lock</span>
          <span>403 Unauthorized Access</span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111918]">
          Access Denied
        </h1>

        {/* Required Message */}
        <p className="mt-3 text-base sm:text-lg text-[#3a4746] leading-relaxed">
          You do not have permission to access this portal.
        </p>

        {user ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left text-xs text-[#4b5857] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#111918]">Current Authenticated User:</span>
              <span className="font-mono font-bold text-primary">{user.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#111918]">Assigned Role:</span>
              <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 font-bold text-primary">
                {user.role} Tier
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#111918]">Jurisdiction:</span>
              <span className="truncate max-w-[220px]">{user.facilityOrVillage}</span>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            No active session detected. Please authenticate with your role credentials.
          </div>
        )}

        {/* Action Button: Return to My Portal */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={targetDashboard}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 font-bold text-white shadow-md transition hover:bg-primary-hover active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            <span>Return to {portalLabel}</span>
          </Link>

          {user && (
            <button
              type="button"
              onClick={logout}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-[#3a4746] hover:bg-slate-100 transition active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span>Sign Out</span>
            </button>
          )}
        </div>

        <p className="mt-6 text-[11px] text-[#7a8786]">
          Medexa Multi-Tier Care Continuum • Role-Based Access Control Active
        </p>
      </div>
    </div>
  );
}
