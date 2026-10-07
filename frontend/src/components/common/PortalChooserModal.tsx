import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/auth";

interface PortalChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PortalChooserModal({ isOpen, onClose }: PortalChooserModalProps) {
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showAsha = !user || user.role === "ASHA";
  const showBlock = !user || user.role === "BLOCK";
  const showDistrict = !user || user.role === "DISTRICT";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-outline-variant bg-white p-6 sm:p-8 md:p-10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-slate-100 transition"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-2.5">
            <span className="material-symbols-outlined text-sm">shield_person</span>
            <span>Role-Scoped Access Control</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Select Your Care Tier Portal
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-on-surface-variant">
            {user
              ? `Authenticated as ${user.name} (${user.role}). Only your authorized portal is accessible.`
              : "Select a portal to authenticate into your role-isolated workspace."}
          </p>
        </div>

        {/* Active Session Bar */}
        {user && (
          <div className="mb-6 rounded-2xl border border-primary/25 bg-primary/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl text-primary">verified_user</span>
              <div>
                <p className="text-xs text-on-surface-variant">Current Active Session</p>
                <p className="text-sm font-bold text-on-surface">
                  {user.name} <span className="text-xs font-semibold text-primary">({user.role} Tier)</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center gap-1 rounded-xl border border-outline-variant px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/10 transition"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span>Sign Out / Switch Role</span>
            </button>
          </div>
        )}

        {/* Portal Cards: Filtered by user.role */}
        <div className={`grid gap-4 sm:gap-5 ${user ? "grid-cols-1 max-w-md mx-auto" : "grid-cols-1 md:grid-cols-3"}`}>
          {/* Card 1: ASHA Worker */}
          {showAsha && (
            <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-5 transition-all hover:border-primary hover:bg-white hover:shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-xs transition group-hover:scale-110">
                    <span className="material-symbols-outlined text-2xl">volunteer_activism</span>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    Village Tier
                  </span>
                </div>
                <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                  ASHA / Village Worker
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
                  Log village cases, perform digital clinical triage, and track patient journeys.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-200/60 flex flex-col gap-2">
                {user?.role === "ASHA" ? (
                  <Link
                    to="/dashboard/referrals/asha"
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-on-primary shadow-xs hover:bg-primary-hover transition"
                  >
                    <span>Enter ASHA Portal</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                ) : (
                  <Link
                    to="/login/asha"
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-on-primary shadow-xs hover:bg-primary-hover transition"
                  >
                    <span>Login as ASHA Worker</span>
                    <span className="material-symbols-outlined text-sm">login</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Card 2: Block Health Office */}
          {showBlock && (
            <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-5 transition-all hover:border-indigo-600 hover:bg-white hover:shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-700 shadow-xs transition group-hover:scale-110">
                    <span className="material-symbols-outlined text-2xl">domain</span>
                  </div>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-800">
                    Block PHC / CHC
                  </span>
                </div>
                <h3 className="text-lg font-bold text-on-surface group-hover:text-indigo-700 transition-colors">
                  Block Health Office
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
                  Receive village referrals, manage inpatient triage, and escalate to district via 108.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-200/60 flex flex-col gap-2">
                {user?.role === "BLOCK" ? (
                  <Link
                    to="/dashboard/referrals/block-office"
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-800 transition"
                  >
                    <span>Enter Block Portal</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                ) : (
                  <Link
                    to="/login/block"
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-800 transition"
                  >
                    <span>Login as Block Officer</span>
                    <span className="material-symbols-outlined text-sm">login</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Card 3: District Office */}
          {showDistrict && (
            <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-5 transition-all hover:border-teal-700 hover:bg-white hover:shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600/15 text-teal-800 shadow-xs transition group-hover:scale-110">
                    <span className="material-symbols-outlined text-2xl">local_hospital</span>
                  </div>
                  <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
                    District Hospital
                  </span>
                </div>
                <h3 className="text-lg font-bold text-on-surface group-hover:text-teal-800 transition-colors">
                  District Office (CMOH)
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
                  Manage tertiary admissions, specialist doctors, and district-wide continuity oversight.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-200/60 flex flex-col gap-2">
                {user?.role === "DISTRICT" ? (
                  <Link
                    to="/dashboard/referrals/district-office"
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-800 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-900 transition"
                  >
                    <span>Enter District Portal</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                ) : (
                  <Link
                    to="/login/district"
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-800 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-900 transition"
                  >
                    <span>Login as District Officer</span>
                    <span className="material-symbols-outlined text-sm">login</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

