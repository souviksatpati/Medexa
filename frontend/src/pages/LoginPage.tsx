import React, { useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth, HEALTH_REGISTRY_DATABASE } from "@/auth/auth";
import type { Role } from "@/auth/authTypes";
import { LanguageSelector } from "@/components/common/LanguageSelector";

interface LoginPageProps {
  role?: Role;
}

interface PortalConfig {
  role: Role;
  title: string;
  subtitle: string;
  tierBadge: string;
  gateBadge: string;
  icon: string;
  themeColor: string;
  buttonClass: string;
  badgeClass: string;
  iconBgClass: string;
  focusClass: string;
  placeholderId: string;
  targetDashboard: string;
  demoId: string;
  demoPin: string;
  demoName: string;
  demoLocation: string;
}

const PORTAL_CONFIGS: Record<Role, PortalConfig> = {
  ASHA: {
    role: "ASHA",
    title: "ASHA Worker Login",
    subtitle: "Frontline Community Health & Village Care Continuum",
    tierBadge: "Village Tier • Frontline Health Worker",
    gateBadge: "Database ID & PIN Authentication",
    icon: "volunteer_activism",
    themeColor: "primary",
    buttonClass: "bg-primary hover:bg-primary-hover text-on-primary shadow-md hover:shadow-lg",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    iconBgClass: "bg-primary/15 text-primary",
    focusClass: "focus:border-primary focus:ring-primary/20",
    placeholderId: "e.g. ASHA-WB-401",
    targetDashboard: "/dashboard/referrals/asha",
    demoId: "ASHA-WB-401",
    demoPin: "1234",
    demoName: "Kavita Roy",
    demoLocation: "Rampur Village / Belur Sector",
  },
  BLOCK: {
    role: "BLOCK",
    title: "Block Health Officer Login",
    subtitle: "Block PHC / CHC Clinical Inpatient & Arrival Triage Gate",
    tierBadge: "Block PHC / CHC Tier",
    gateBadge: "BMOH/MOIC Registry Credential Gate",
    icon: "domain",
    themeColor: "indigo",
    buttonClass: "bg-indigo-700 hover:bg-indigo-800 text-white shadow-md hover:shadow-lg",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
    iconBgClass: "bg-indigo-500/15 text-indigo-700",
    focusClass: "focus:border-indigo-600 focus:ring-indigo-600/20",
    placeholderId: "e.g. BHO-WB-204",
    targetDashboard: "/dashboard/referrals/block-office",
    demoId: "BHO-WB-204",
    demoPin: "4321",
    demoName: "Dr. Anirban Roy",
    demoLocation: "Belur Block Primary Health Centre",
  },
  DISTRICT: {
    role: "DISTRICT",
    title: "District Health Officer Login",
    subtitle: "Tertiary Hospital Command & Chief Medical Specialist Verification",
    tierBadge: "District Hospital Tier • CMOH Command",
    gateBadge: "Chief Medical Specialist Verification",
    icon: "local_hospital",
    themeColor: "teal",
    buttonClass: "bg-teal-800 hover:bg-teal-900 text-white shadow-md hover:shadow-lg",
    badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
    iconBgClass: "bg-teal-600/15 text-teal-800",
    focusClass: "focus:border-teal-700 focus:ring-teal-700/20",
    placeholderId: "e.g. CMOH-DIST-101",
    targetDashboard: "/dashboard/referrals/district-office",
    demoId: "CMOH-DIST-101",
    demoPin: "5678",
    demoName: "Dr. A. Sen",
    demoLocation: "Bankura District General Hospital",
  },
};

function resolveRole(propRole?: Role, paramRole?: string): Role {
  if (propRole) return propRole;
  const p = (paramRole || "").toLowerCase();
  if (p === "asha" || p === "village") return "ASHA";
  if (p === "block" || p === "phc" || p === "chc" || p === "rural") return "BLOCK";
  if (p === "district" || p === "cmoh" || p === "dh") return "DISTRICT";
  return "ASHA";
}

export function LoginPage({ role: propRole }: LoginPageProps) {
  const { portalRole } = useParams<{ portalRole?: string }>();
  const targetRole = resolveRole(propRole, portalRole);
  const cfg = PORTAL_CONFIGS[targetRole];

  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [workerId, setWorkerId] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);

  const pinInputRef = useRef<HTMLInputElement>(null);
  const workerIdInputRef = useRef<HTMLInputElement>(null);

  const handleUseDemo = () => {
    setWorkerId(cfg.demoId);
    setPin(cfg.demoPin);
    setError(null);
    if (pinInputRef.current) {
      pinInputRef.current.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedId = workerId.trim();
    const trimmedPin = pin.trim();

    if (!trimmedId || !trimmedPin) {
      setError("Please enter both Worker ID and Security PIN.");
      return;
    }

    // Look up entry in health registry database
    const foundEntry = HEALTH_REGISTRY_DATABASE[trimmedId] || Object.values(HEALTH_REGISTRY_DATABASE).find(r => r.id.toLowerCase() === trimmedId.toLowerCase());
    if (!foundEntry || foundEntry.pin !== trimmedPin || foundEntry.role !== targetRole) {
      // Generic rejection: no distinction between wrong ID, wrong PIN, or wrong portal role
      setError("Invalid Worker ID or PIN for this portal.");
      setPin("");
      setTimeout(() => pinInputRef.current?.focus(), 50);
      return;
    }

    // Perform auth login (persists session & updates global store)
    const res = await login(trimmedId, trimmedPin, targetRole);
    if (!res.success) {
      setError("Invalid Worker ID or PIN for this portal.");
      setPin("");
      setTimeout(() => pinInputRef.current?.focus(), 50);
      return;
    }

    // Display "Checking access..." resolution state briefly before navigating
    setIsCheckingAccess(true);
    setTimeout(() => {
      navigate(cfg.targetDashboard);
    }, 550);
  };

  return (
    <div className="min-h-screen bg-[#f5f9f8] text-[#111918] flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      {/* Checking access resolution loader */}
      {isCheckingAccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="text-center p-8 max-w-sm rounded-3xl border border-outline-variant bg-white shadow-2xl">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
            <h3 className="text-lg font-bold text-[#111918]">Checking access...</h3>
            <p className="text-xs text-[#4c5655] mt-1.5">
              Verifying cryptographic and role permissions
            </p>
          </div>
        </div>
      )}

      {/* Top App Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-white/60 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <span className="material-symbols-outlined text-2xl">health_and_safety</span>
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-[#111918]">Medexa</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-primary/90">
                Care Continuity
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link
              to="/#portals"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#4c5655] hover:border-primary hover:text-primary transition"
            >
              <span className="material-symbols-outlined text-sm">apps</span>
              <span className="hidden sm:inline">Portals</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Back to portal selection link */}
          <div className="mb-4">
            <Link
              to="/#portals"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4c5655] hover:text-primary transition-colors group"
            >
              <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-0.5">
                arrow_back
              </span>
              <span>Back to portal selection</span>
            </Link>
          </div>

          {/* Active Session Notification (if already logged in) */}
          {user && (
            <div className="mb-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-lg">verified_user</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#4c5655] truncate">Current Active Session</p>
                    <p className="text-xs font-bold text-[#111918] truncate">
                      {user.name} <span className="text-primary font-semibold">({user.role} Tier)</span>
                    </p>
                  </div>
                </div>
                {user.role === targetRole ? (
                  <Link
                    to={cfg.targetDashboard}
                    className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-hover transition shrink-0"
                  >
                    <span>Enter</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="inline-flex items-center gap-1 rounded-xl border border-outline-variant px-2.5 py-1.5 text-[11px] font-semibold text-error hover:bg-error/10 transition shrink-0"
                  >
                    <span className="material-symbols-outlined text-xs">logout</span>
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Login Card */}
          <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-6 sm:p-8 shadow-xl backdrop-blur-md">
            {/* Card Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-xs transition-transform ${cfg.iconBgClass}`}
                >
                  <span className="material-symbols-outlined text-3xl">{cfg.icon}</span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-2.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-[11px] font-bold ${cfg.badgeClass}`}
                >
                  <span className="material-symbols-outlined text-[13px]">shield</span>
                  <span>{cfg.tierBadge}</span>
                </span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-[#111918]">{cfg.title}</h1>
              <p className="mt-1 text-xs text-[#4c5655] leading-relaxed max-w-sm mx-auto">
                {cfg.gateBadge}
              </p>
            </div>

            {/* Error Alert Banner */}
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50/90 p-3.5 text-xs text-red-800 animate-in fade-in duration-200"
              >
                <span className="material-symbols-outlined text-red-600 text-lg shrink-0 mt-0.5">
                  error
                </span>
                <div className="flex-1">
                  <p className="font-bold text-red-900">Authentication Failed</p>
                  <p className="mt-0.5 text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Worker ID / Code Field */}
              <div>
                <label
                  htmlFor="workerId"
                  className="block text-xs font-bold uppercase tracking-wider text-[#344342] mb-1.5"
                >
                  Worker ID / Registration Code
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <span className="material-symbols-outlined text-lg">badge</span>
                  </span>
                  <input
                    ref={workerIdInputRef}
                    id="workerId"
                    type="text"
                    autoComplete="username"
                    required
                    value={workerId}
                    onChange={(e) => {
                      setWorkerId(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={cfg.placeholderId}
                    className={`w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-[#111918] placeholder:text-slate-400 placeholder:font-normal transition focus:outline-none focus:ring-2 ${cfg.focusClass}`}
                  />
                </div>
              </div>

              {/* Security PIN Field */}
              <div>
                <label
                  htmlFor="pin"
                  className="block text-xs font-bold uppercase tracking-wider text-[#344342] mb-1.5"
                >
                  Security PIN
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <span className="material-symbols-outlined text-lg">lock</span>
                  </span>
                  <input
                    ref={pinInputRef}
                    id="pin"
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    autoComplete="current-password"
                    required
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Enter numeric PIN"
                    className={`w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm font-semibold tracking-wider text-[#111918] placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal transition focus:outline-none focus:ring-2 ${cfg.focusClass}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition"
                    aria-label={showPin ? "Hide PIN" : "Show PIN"}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPin ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition active:scale-[0.98] ${cfg.buttonClass}`}
              >
                <span>Login</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </form>

            {/* Demo Credentials Quick Fill Helper */}
            <div className="mt-6 pt-5 border-t border-slate-200/80 text-center">
              <p className="text-[11px] text-[#4c5655] mb-2 font-medium">Evaluation Demo Support</p>
              <button
                type="button"
                onClick={handleUseDemo}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/80 px-3.5 py-1.5 text-xs font-semibold text-[#111918] hover:bg-white hover:border-primary hover:text-primary transition shadow-2xs group"
              >
                <span className="material-symbols-outlined text-sm text-primary group-hover:rotate-12 transition-transform">
                  key
                </span>
                <span>Use demo credentials ({cfg.demoId})</span>
              </button>
              <p className="mt-1 text-[10px] text-slate-400">
                Fills {cfg.demoName} ({cfg.demoId} / PIN: {cfg.demoPin}) into form
              </p>
            </div>
          </div>

          {/* Security & Isolation Disclaimer */}
          <div className="mt-6 text-center">
            <p className="text-[11px] text-[#7a8786]">
              Medexa Role-Based Access Control • Strict Care Tier Isolation Active
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center border-t border-white/60 bg-white/40">
        <p className="text-xs text-[#7a8786]">
          Public Healthcare Continuity Platform • Village, Block & District Integration
        </p>
      </footer>
    </div>
  );
}
