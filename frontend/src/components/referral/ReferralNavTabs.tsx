import { NavLink, useLocation } from "react-router-dom";
import { useReferralStore } from "@/sync/referralStore";

interface ReferralNavTabsProps {
  activeTab?: "all" | "asha" | "block" | "district";
}

export function ReferralNavTabs({ activeTab }: ReferralNavTabsProps) {
  const location = useLocation();
  const { referrals } = useReferralStore();

  const list = Array.isArray(referrals) ? referrals : [];
  const totalCount = list.length;
  const ashaCount = list.filter((r) => r && r.sourceLevel === "ASHA").length;
  const blockCount = list.filter((r) => r && (r.sourceLevel === "BLOCK" || r.targetLevel === "BLOCK_OFFICE")).length;
  const districtCount = list.filter((r) => r && (r.targetLevel === "DISTRICT_OFFICE" || r.status === "Escalated to District")).length;

  const isAllActive =
    activeTab === "all" ||
    (location.pathname === "/dashboard/referrals" && !activeTab);

  const isAshaActive =
    activeTab === "asha" ||
    location.pathname.startsWith("/dashboard/referrals/asha");

  const isBlockActive =
    activeTab === "block" ||
    location.pathname.startsWith("/dashboard/referrals/block-office") ||
    location.pathname.startsWith("/dashboard/referrals/rural-office");

  const isDistrictActive =
    activeTab === "district" ||
    location.pathname.startsWith("/dashboard/referrals/district-office") ||
    location.pathname.startsWith("/dashboard/referrals/district");

  return (
    <div className="border-b border-outline-variant pb-4">
      {/* 4 Tabs side-by-side: All Referrals -> ASHA Referral -> Block Office Referral -> District Office Portal */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* 1. All Referrals (First) */}
        <NavLink
          to="/dashboard/referrals"
          end
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            isAllActive && !isAshaActive && !isBlockActive && !isDistrictActive
              ? "bg-primary text-on-primary shadow-sm ring-2 ring-primary/20"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            table_rows
          </span>
          <span>All Referrals</span>
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
              isAllActive && !isAshaActive && !isBlockActive && !isDistrictActive
                ? "bg-white/20 text-white"
                : "bg-primary/10 text-primary"
            }`}
          >
            {totalCount}
          </span>
        </NavLink>

        {/* 2. ASHA Referral */}
        <NavLink
          to="/dashboard/referrals/asha"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            isAshaActive
              ? "bg-primary text-on-primary shadow-sm ring-2 ring-primary/20"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            volunteer_activism
          </span>
          <span>ASHA Referral</span>
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
              isAshaActive
                ? "bg-white/20 text-white"
                : "bg-primary/10 text-primary"
            }`}
          >
            {ashaCount}
          </span>
        </NavLink>

        {/* 3. Block Office Referral */}
        <NavLink
          to="/dashboard/referrals/block-office"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            isBlockActive
              ? "bg-indigo-700 text-white shadow-sm ring-2 ring-indigo-500/20"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            domain
          </span>
          <span>Block Office Referral</span>
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
              isBlockActive
                ? "bg-white/20 text-white"
                : "bg-indigo-100 text-indigo-800"
            }`}
          >
            {blockCount}
          </span>
        </NavLink>

        {/* 4. District Office Portal */}
        <NavLink
          to="/dashboard/referrals/district-office"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            isDistrictActive
              ? "bg-purple-700 text-white shadow-sm ring-2 ring-purple-500/20"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            local_hospital
          </span>
          <span>District Office Portal</span>
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
              isDistrictActive
                ? "bg-white/20 text-white"
                : "bg-purple-100 text-purple-800"
            }`}
          >
            {districtCount}
          </span>
        </NavLink>
      </div>
    </div>
  );
}
