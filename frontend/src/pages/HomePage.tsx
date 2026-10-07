import { Link } from "react-router-dom";
import { HomeHeader } from "@/components/common/HomeHeader";
import { useLanguageStore } from "@/i18n/useLanguageStore";
import { useAuth } from "@/auth/auth";

export function HomePage() {
  const { t } = useLanguageStore();
  const { user, logout } = useAuth();

  const showAsha = !user || user.role === "ASHA";
  const showBlock = !user || user.role === "BLOCK";
  const showDistrict = !user || user.role === "DISTRICT";

  return (
    <div className="min-h-screen bg-[#f5f9f8] text-on-background flex flex-col overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      
      {/* HEADER WITH INTEGRATED DIRECT LANGUAGE SELECTOR & RESPONSIVE MOBILE DRAWER */}
      <HomeHeader />

      {/* MAIN HERO SECTION */}
      <main className="relative flex-1 overflow-hidden">
        
        {/* BACKGROUND IMAGE WITH DEFENSIVE RETENTION */}
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
          style={{
            backgroundImage: "url('/medical-bg.png')",
            opacity: 0.92,
          }}
          aria-hidden="true"
        />

        {/* LIGHT SOFT OVERLAY */}
        <div 
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent" 
          aria-hidden="true"
        />

        {/* BOTTOM FADE TRANSITION */}
        <div 
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 sm:h-36 bg-gradient-to-t from-[#f5f9f8] to-transparent" 
          aria-hidden="true"
        />

        {/* RESPONSIVE CONTAINER (Handles 320px, 375px, 414px, Tablet, Desktop) */}
        <div className="relative z-10 mx-auto max-w-7xl px-3.5 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 lg:py-20">
          
          {/* GRID: Stacks on mobile/tablet (grid-cols-1), two-column on desktop (lg:grid-cols-[1.05fr_0.95fr]) */}
          <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">

            {/* =========================================================
                LEFT COLUMN: HERO HEADLINE & ACTIONS
                ========================================================= */}
            <section className="max-w-3xl">

              {/* BADGE */}
              <div className="mb-4 sm:mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/80 bg-white/75 px-3.5 py-1.5 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-primary shadow-sm backdrop-blur-md">
                <span className="material-symbols-outlined text-[17px] sm:text-[20px] shrink-0">
                  health_and_safety
                </span>
                <span className="truncate">
                  {t("hero", "badge")}
                </span>
              </div>

              {/* MAIN DISPLAY HEADLINE */}
              <h1 className="text-3xl font-bold leading-[1.12] tracking-tight text-[#111918] xs:text-4xl sm:text-5xl md:text-6xl lg:text-[62px] break-words">
                {t("hero", "titleLine1")}
                <span className="block text-primary mt-1">
                  {t("hero", "titleLine2")}
                </span>
              </h1>

              {/* INTRODUCTORY DESCRIPTION */}
              <p className="mt-4 sm:mt-6 max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-[#344342]">
                {t("hero", "description")}
              </p>

              {/* CTA BUTTONS: Single Primary (Choose Your Portal) + Secondary (See How It Works) */}
              <div className="mt-6 sm:mt-9 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                {/* PRIMARY CTA */}
                <a
                  href="#portals"
                  className="inline-flex min-h-[50px] sm:min-h-14 w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-primary px-7 sm:px-9 py-3 text-sm sm:text-base font-bold text-on-primary shadow-lg transition hover:bg-primary-hover hover:shadow-xl active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    apps
                  </span>
                  <span>Choose Your Portal</span>
                </a>

                {/* SECONDARY CTA */}
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-[50px] sm:min-h-14 w-full sm:w-auto items-center justify-center gap-2.5 rounded-full border border-primary/40 bg-white/90 px-6 sm:px-8 py-3 text-sm sm:text-base font-bold text-primary shadow-xs backdrop-blur transition hover:bg-white hover:shadow-md active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    info
                  </span>
                  <span>See How It Works</span>
                </a>
              </div>
            </section>

            {/* =========================================================
                RIGHT COLUMN: FRONTLINE HEALTHCARE HERO PHOTO SHOWCASE
                ========================================================= */}
            <section className="relative w-full max-w-lg md:max-w-xl lg:max-w-none mx-auto flex items-center justify-center">
              {/* Soft ambient backlight matching Medexa primary teal palette */}
              <div className="absolute -inset-4 sm:-inset-6 rounded-[2.5rem] bg-primary/15 blur-2xl sm:blur-3xl pointer-events-none" />

              {/* Glassmorphic Container Card */}
              <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/80 bg-white/80 p-2.5 sm:p-3.5 shadow-xl sm:shadow-2xl backdrop-blur-md transition duration-300">
                
                {/* 16:9 Image Frame Container with reserved aspect ratio for 0 CLS */}
                <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl aspect-video bg-slate-100 shadow-inner">
                  <img
                    src="/hero-frontline-health.jpg"
                    alt="Frontline healthcare medical officer examining patient at Primary Health Centre in Purba Medinipur, West Bengal"
                    width={1024}
                    height={576}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="h-full w-full object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
                  />

                  {/* Subtle top gradient overlay to make live status badge pop */}
                  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

                  {/* Live Field Status Badge (Top-left on image) */}
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/60 px-3 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="tracking-wide">Primary Health Centre Ground Level</span>
                  </div>

                  {/* Verification pill (Top-right on image) */}
                  <div className="hidden xs:inline-flex absolute top-3 right-3 sm:top-4 sm:right-4 items-center gap-1.5 rounded-full border border-white/30 bg-emerald-950/70 px-2.5 py-1 text-[11px] font-medium text-emerald-200 shadow-md backdrop-blur-md">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    <span>Verified Unit</span>
                  </div>
                </div>

                {/* Bottom Context Info Bar */}
                <div className="mt-2.5 sm:mt-3 px-1 sm:px-2 pb-1 sm:pb-1.5 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#111918] truncate">
                        প্রাথমিক স্বাস্থ্য কেন্দ্র (PHC)
                      </p>
                      <p className="text-[11px] sm:text-xs text-[#52605e] truncate">
                        Purba Medinipur, West Bengal
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    <span className="material-symbols-outlined text-[14px] text-primary">hub</span>
                    <span>ASHA • PHC • CHC Tier Link</span>
                  </div>
                </div>

              </div>
            </section>
          </div>

          {/* =========================================================
              CHOOSE YOUR DEDICATED ROLE PORTAL (3-CARD SECTION)
              ========================================================= */}
          <section id="portals" className="mt-12 sm:mt-16 lg:mt-20 pt-8 border-t border-white/60 scroll-mt-24">
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary mb-3">
                <span className="material-symbols-outlined text-[16px]">shield_person</span>
                <span>Role-Scoped Access Control</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111918] tracking-tight">
                Select Your Care Tier Portal
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#4c5655]">
                {user
                  ? `Active session: ${user.name} (${user.role} Tier). Only your authorized portal is displayed.`
                  : "Isolated workspaces designed specifically for frontline ASHA workers, Block Health Officers, and District Hospital Specialists."}
              </p>
            </div>

            {/* Active Session Badge & Switch Role Trigger */}
            {user && (
              <div className="mb-8 mx-auto max-w-xl rounded-2xl border border-primary/25 bg-white/90 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-2xl">verified_user</span>
                  </div>
                  <div>
                    <p className="text-xs text-[#4c5655]">Authenticated Active Session</p>
                    <p className="text-sm font-bold text-[#111918]">
                      {user.name} <span className="font-semibold text-xs text-primary">({user.role} Tier)</span>
                    </p>
                    <p className="text-[11px] text-[#4c5655]">
                      {user.village || user.facility || user.district || user.id}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="inline-flex items-center gap-1 rounded-xl border border-outline-variant px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/10 transition shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  <span>Sign Out / Switch Role</span>
                </button>
              </div>
            )}

            <div className={`grid gap-5 sm:gap-6 lg:gap-8 ${user ? "grid-cols-1 max-w-lg mx-auto" : "grid-cols-1 md:grid-cols-3"}`}>
              
              {/* CARD 1: ASHA WORKER PORTAL */}
              {showAsha && (
                <div className="group relative flex flex-col rounded-3xl border border-white/70 bg-white/60 p-6 sm:p-7 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:bg-white/80">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-xs transition-transform group-hover:scale-110">
                      <span className="material-symbols-outlined text-3xl">volunteer_activism</span>
                    </div>
                    <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] font-bold text-primary">
                      Village / Ward
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#111918] group-hover:text-primary transition-colors">
                    ASHA Referral Portal
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#4c5655] leading-relaxed flex-1">
                    Frontline community health worker portal to register vulnerable patients, initiate referrals to Block PHC/CHC, and track patient situation updates.
                  </p>

                  <div className="my-5 space-y-2 border-y border-slate-200/60 py-3.5 text-xs text-[#344342]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                      <span>Village frontline ANC & pediatric cases</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                      <span>Database ID & PIN authentication</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                      <span>Patient journey & back-referral alerts</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {user?.role === "ASHA" ? (
                      <Link
                        to="/dashboard/referrals/asha"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-on-primary shadow-md transition hover:bg-primary-hover active:scale-[0.98]"
                      >
                        <span>Enter ASHA Portal</span>
                        <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
                      </Link>
                    ) : (
                      <Link
                        to="/login/asha"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-on-primary shadow-md transition hover:bg-primary-hover active:scale-[0.98]"
                      >
                        <span>Login as ASHA Worker</span>
                        <span className="material-symbols-outlined text-lg">login</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* CARD 2: BLOCK OFFICE PORTAL */}
              {showBlock && (
                <div className="group relative flex flex-col rounded-3xl border border-white/70 bg-white/60 p-6 sm:p-7 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:bg-white/80">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-700 shadow-xs transition-transform group-hover:scale-110">
                      <span className="material-symbols-outlined text-3xl">domain</span>
                    </div>
                    <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-[11px] font-bold text-indigo-700">
                      Block PHC / CHC
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#111918] group-hover:text-indigo-700 transition-colors">
                    Block Health Office
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#4c5655] leading-relaxed flex-1">
                    Block Medical Officer command center for clinical triage of village arrivals, inpatient PHC management, and 108 emergency escalation to District.
                  </p>

                  <div className="my-5 space-y-2 border-y border-slate-200/60 py-3.5 text-xs text-[#344342]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-600 text-base">check_circle</span>
                      <span>Triages village referrals from ASHA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-600 text-base">check_circle</span>
                      <span>108 ALS / BLS ambulance escalation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-600 text-base">check_circle</span>
                      <span>BMOH/MOIC registry credential gate</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {user?.role === "BLOCK" ? (
                      <Link
                        to="/dashboard/referrals/block-office"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-700 px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-800 active:scale-[0.98]"
                      >
                        <span>Enter Block Portal</span>
                        <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
                      </Link>
                    ) : (
                      <Link
                        to="/login/block"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-700 px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-800 active:scale-[0.98]"
                      >
                        <span>Login as Block Officer</span>
                        <span className="material-symbols-outlined text-lg">login</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* CARD 3: DISTRICT OFFICE PORTAL */}
              {showDistrict && (
                <div className="group relative flex flex-col rounded-3xl border border-white/70 bg-white/60 p-6 sm:p-7 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:bg-white/80">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600/15 text-teal-800 shadow-xs transition-transform group-hover:scale-110">
                      <span className="material-symbols-outlined text-3xl">local_hospital</span>
                    </div>
                    <span className="rounded-full bg-teal-600/10 border border-teal-600/20 px-3 py-1 text-[11px] font-bold text-teal-800">
                      District Hospital / CMO
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#111918] group-hover:text-teal-800 transition-colors">
                    District Office Portal
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#4c5655] leading-relaxed flex-1">
                    Tertiary care and district health administration hub for specialist consultations, ICU/surgical admissions, and back-referrals for village follow-up.
                  </p>

                  <div className="my-5 space-y-2 border-y border-slate-200/60 py-3.5 text-xs text-[#344342]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-teal-700 text-base">check_circle</span>
                      <span>Specialist ICU & surgical bed admissions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-teal-700 text-base">check_circle</span>
                      <span>Back-referrals to community ASHA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-teal-700 text-base">check_circle</span>
                      <span>Chief Medical Specialist verification</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {user?.role === "DISTRICT" ? (
                      <Link
                        to="/dashboard/referrals/district-office"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-800 px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-teal-900 active:scale-[0.98]"
                      >
                        <span>Enter District Portal</span>
                        <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
                      </Link>
                    ) : (
                      <Link
                        to="/login/district"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-800 px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-teal-900 active:scale-[0.98]"
                      >
                        <span>Login as District Officer</span>
                        <span className="material-symbols-outlined text-lg">login</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}

            </div>
          </section>


          {/* =========================================================
              HOW IT WORKS: 3-STEP VISUAL WORKFLOW (§5.1)
              ========================================================= */}
          <section id="how-it-works" className="mt-14 sm:mt-20 lg:mt-24 pt-12 border-t border-white/60 scroll-mt-24">
            
            {/* SOLID / HEAVILY-OPAQUE HIGH-CONTRAST HEADER PANEL */}
            <div className="mx-auto max-w-4xl rounded-3xl border border-white/90 bg-white/95 p-7 sm:p-10 md:p-12 text-center shadow-xl backdrop-blur-md mb-10 sm:mb-14">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs sm:text-sm font-bold text-primary mb-4 shadow-xs">
                <span className="material-symbols-outlined text-[18px]">timeline</span>
                <span>End-to-End Care Continuity</span>
              </div>
              
              <h2 className="text-3xl font-black leading-[1.12] tracking-tight text-[#111918] xs:text-4xl sm:text-5xl md:text-5xl lg:text-[54px] break-words">
                How Medexa Closes the Care Loop
              </h2>
              
              <p className="mt-4 text-base sm:text-lg md:text-xl font-normal leading-relaxed text-[#2c3837] max-w-3xl mx-auto">
                A seamless patient pathway connecting village doorsteps to district medical specialists with offline-first synchronization.
              </p>
            </div>

            {/* 3-STEP CARDS WITH HIGH CONTRAST & STEPPED-UP TYPOGRAPHY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
              {/* Step 1 */}
              <div className="relative flex flex-col rounded-3xl border border-slate-200/80 bg-white/95 p-7 sm:p-8 shadow-lg backdrop-blur-md transition-transform hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white font-black text-lg shadow-sm">
                    01
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                    Village Care
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#111918]">Frontline Identification & Triage</h3>
                <p className="mt-3 text-sm sm:text-base text-[#2c3837] leading-relaxed flex-1">
                  ASHA frontline workers record patient vitals and symptoms offline using our simplified digital triage tool. If high risk is detected, a care episode is logged and escalated to the nearest Block PHC.
                </p>
                <div className="mt-6 pt-5 border-t border-slate-200/80 text-xs sm:text-sm text-[#2c3837] space-y-2">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <span className="material-symbols-outlined text-base">wifi_off</span>
                    <span>100% Offline IndexedDB Storage</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <span className="material-symbols-outlined text-base">medical_services</span>
                    <span>Objective Color-Coded Risk Score</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex flex-col rounded-3xl border border-slate-200/80 bg-white/95 p-7 sm:p-8 shadow-lg backdrop-blur-md transition-transform hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-700 text-white font-black text-lg shadow-sm">
                    02
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                    Block PHC / CHC
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#111918]">Clinical Triage & Secondary Care</h3>
                <p className="mt-3 text-sm sm:text-base text-[#2c3837] leading-relaxed flex-1">
                  Block Medical Officers review incoming village referrals upon arrival. Patients are stabilized in PHC observation beds or escalated via 108 emergency ambulance to tertiary care.
                </p>
                <div className="mt-6 pt-5 border-t border-slate-200/80 text-xs sm:text-sm text-[#2c3837] space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                    <span className="material-symbols-outlined text-base">emergency</span>
                    <span>Direct 108 Ambulance Dispatch</span>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                    <span className="material-symbols-outlined text-base">bed</span>
                    <span>Observation Bed Allocation</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col rounded-3xl border border-slate-200/80 bg-white/95 p-7 sm:p-8 shadow-lg backdrop-blur-md transition-transform hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-800 text-white font-black text-lg shadow-sm">
                    03
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                    District Hospital
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#111918]">Tertiary Specialists & Back-Referral</h3>
                <p className="mt-3 text-sm sm:text-base text-[#2c3837] leading-relaxed flex-1">
                  District specialists admit patients to ICU or surgical wards. Upon discharge, treatment summaries flow back as plain-language action items for the village ASHA to ensure recovery follow-ups.
                </p>
                <div className="mt-6 pt-5 border-t border-slate-200/80 text-xs sm:text-sm text-[#2c3837] space-y-2">
                  <div className="flex items-center gap-2 text-teal-800 font-semibold">
                    <span className="material-symbols-outlined text-base">sync_saved_locally</span>
                    <span>Closed-Loop Village Return Alerts</span>
                  </div>
                  <div className="flex items-center gap-2 text-teal-800 font-semibold">
                    <span className="material-symbols-outlined text-base">lock</span>
                    <span>Strict Privacy & Role Masking</span>
                  </div>
                </div>
              </div>
            </div>

            {/* HORIZONTAL STRIP OF 4 OUTCOME STATS */}
            <div className="mt-8 sm:mt-10 rounded-3xl border border-primary/25 bg-white/95 p-5 sm:p-7 shadow-xl backdrop-blur-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Outcome 1 */}
                <div className="flex items-start gap-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 transition hover:bg-emerald-500/15">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                    <span className="material-symbols-outlined text-xl">schedule</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-[#111918] leading-snug">
                      Reduced Travel & Waiting Time
                    </h4>
                    <p className="mt-1 text-xs text-[#3d4b4a] leading-relaxed">
                      Village triage prevents unnecessary hospital journeys
                    </p>
                  </div>
                </div>

                {/* Outcome 2 */}
                <div className="flex items-start gap-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 transition hover:bg-blue-500/15">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                    <span className="material-symbols-outlined text-xl">vital_signs</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-[#111918] leading-snug">
                      Earlier Consultation
                    </h4>
                    <p className="mt-1 text-xs text-[#3d4b4a] leading-relaxed">
                      Color-coded risk flags prioritize urgent cases ahead of arrival
                    </p>
                  </div>
                </div>

                {/* Outcome 3 */}
                <div className="flex items-start gap-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 p-4 transition hover:bg-teal-500/15">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white shadow-xs">
                    <span className="material-symbols-outlined text-xl">task_alt</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-[#111918] leading-snug">
                      Improved Referral Completion
                    </h4>
                    <p className="mt-1 text-xs text-[#3d4b4a] leading-relaxed">
                      Closed-loop handoffs trace patients until confirmed care
                    </p>
                  </div>
                </div>

                {/* Outcome 4 */}
                <div className="flex items-start gap-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 p-4 transition hover:bg-purple-500/15">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-700 text-white shadow-xs">
                    <span className="material-symbols-outlined text-xl">family_restroom</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-[#111918] leading-snug">
                      Better Maternal, Child & Chronic Follow-up
                    </h4>
                    <p className="mt-1 text-xs text-[#3d4b4a] leading-relaxed">
                      Discharge alerts route plain-language tasks to village ASHA
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

      </main>

      {/* FOOTER */}
      {t("footer", "copyright") ? (
        <footer className="relative z-20 border-t border-outline-variant bg-white/85 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-3.5 sm:px-6 md:px-8 py-5 sm:py-6">
            <p className="text-xs sm:text-sm text-on-surface-variant text-center sm:text-left">
              {t("footer", "copyright")}
            </p>
          </div>
        </footer>
      ) : null}

    </div>
  );
}
