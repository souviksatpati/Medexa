import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

import { HomePage } from "@/pages/HomePage";
import { PatientEpisodePage } from "@/pages/PatientEpisodePage";
import { DistrictDashboardPage } from "@/pages/DistrictDashboardPage";
import { DigitalTriagePage } from "@/pages/DigitalTriagePage";
import { AshaReferralPage } from "@/pages/AshaReferralPage";
import { RuralOfficeDashboardPage } from "@/pages/RuralOfficeDashboardPage";
import { DistrictOfficePage } from "@/pages/DistrictOfficePage";
import { ReferralDetailsPage } from "@/pages/ReferralDetailsPage";
import { MedicineAvailabilityPage } from "@/pages/MedicineAvailabilityPage";
import { DiagnosticsPage } from "@/pages/DiagnosticsPage";
import { DoctorAvailabilityPage } from "@/pages/DoctorAvailabilityPage";
import { HighRiskFollowUpPage } from "@/pages/HighRiskFollowUpPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { AccessDeniedPage } from "@/pages/AccessDeniedPage";
import { LoginPage } from "@/pages/LoginPage";

import "@/styles/globals.css";

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />
        <Route path="/login/asha" element={<LoginPage role="ASHA" />} />
        <Route path="/login/block" element={<LoginPage role="BLOCK" />} />
        <Route path="/login/district" element={<LoginPage role="DISTRICT" />} />
        <Route path="/login/:portalRole" element={<LoginPage />} />
        <Route path="/login" element={<Navigate to="/#portals" replace />} />

        {/* ASHA / Village Worker Protected Routes */}
        <Route
          path="/dashboard/referrals/asha"
          element={
            <ProtectedRoute allowedRoles={["ASHA"]}>
              <AshaReferralPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/episode/:careEpisodeId"
          element={
            <ProtectedRoute allowedRoles={["ASHA"]}>
              <PatientEpisodePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/episode/:careEpisodeId/triage"
          element={
            <ProtectedRoute allowedRoles={["ASHA"]}>
              <DigitalTriagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/triage"
          element={
            <ProtectedRoute allowedRoles={["ASHA"]}>
              <DigitalTriagePage />
            </ProtectedRoute>
          }
        />

        {/* Block Health Office Protected Routes */}
        <Route
          path="/dashboard/referrals/block-office"
          element={
            <ProtectedRoute allowedRoles={["BLOCK"]}>
              <RuralOfficeDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/referrals/rural-office"
          element={<Navigate to="/dashboard/referrals/block-office" replace />}
        />

        {/* District Office Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["DISTRICT"]}>
              <DistrictDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/referrals/district-office"
          element={
            <ProtectedRoute allowedRoles={["DISTRICT"]}>
              <DistrictOfficePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/referrals/district"
          element={<Navigate to="/dashboard/referrals/district-office" replace />}
        />
        <Route
          path="/dashboard/medicines"
          element={
            <ProtectedRoute allowedRoles={["BLOCK", "DISTRICT"]}>
              <MedicineAvailabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/diagnostics"
          element={
            <ProtectedRoute allowedRoles={["BLOCK", "DISTRICT"]}>
              <DiagnosticsPage />
            </ProtectedRoute>
          }
        />
        {/* Doctor Availability: Replaces Appointments, scoped to facility (Block & District) */}
        <Route
          path="/dashboard/doctor-availability"
          element={
            <ProtectedRoute allowedRoles={["BLOCK", "DISTRICT"]}>
              <DoctorAvailabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/doctors"
          element={<Navigate to="/dashboard/doctor-availability" replace />}
        />
        <Route
          path="/dashboard/appointments"
          element={<Navigate to="/dashboard/doctor-availability" replace />}
        />
        <Route
          path="/dashboard/reports"
          element={
            <ProtectedRoute allowedRoles={["DISTRICT"]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Follow-up: Accessible to ASHA, Block, and District */}
        <Route
          path="/dashboard/follow-up"
          element={
            <ProtectedRoute allowedRoles={["ASHA", "BLOCK", "DISTRICT"]}>
              <HighRiskFollowUpPage />
            </ProtectedRoute>
          }
        />

        {/* Single Referral Details: Role-scoped access */}
        <Route
          path="/dashboard/referrals/:referralId"
          element={
            <ProtectedRoute allowedRoles={["ASHA", "BLOCK", "DISTRICT"]}>
              <ReferralDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Direct URL Shortcuts & Aliases */}
        <Route path="/asha" element={<Navigate to="/dashboard/referrals/asha" replace />} />
        <Route path="/block" element={<Navigate to="/dashboard/referrals/block-office" replace />} />
        <Route path="/district" element={<Navigate to="/dashboard/referrals/district-office" replace />} />
        <Route path="/referrals" element={<Navigate to="/#portals" replace />} />
        <Route path="/referral" element={<Navigate to="/#portals" replace />} />
        <Route path="/dashboard/referrals" element={<Navigate to="/#portals" replace />} />
        <Route path="/dashboard/referral" element={<Navigate to="/#portals" replace />} />
        <Route path="/referrals/asha" element={<Navigate to="/dashboard/referrals/asha" replace />} />
        <Route path="/referrals/block-office" element={<Navigate to="/dashboard/referrals/block-office" replace />} />
        <Route path="/referrals/rural-office" element={<Navigate to="/dashboard/referrals/block-office" replace />} />
        <Route path="/referrals/district-office" element={<Navigate to="/dashboard/referrals/district-office" replace />} />
        <Route path="/referrals/district" element={<Navigate to="/dashboard/referrals/district-office" replace />} />
        <Route path="/referrals/:referralId" element={<Navigate to="/dashboard/referrals" replace />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

/* =========================================================
   NOT FOUND PAGE
   ========================================================= */

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">

      <div className="text-center">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-on-primary">

          <span className="material-symbols-outlined text-[30px]">
            medical_services
          </span>

        </div>

        <h1 className="mt-6 text-4xl font-bold text-on-surface">
          Page not found
        </h1>

        <p className="mt-3 text-on-surface-variant">
          The page you are looking for does not exist.
        </p>

        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary"
        >
          <span className="material-symbols-outlined">
            home
          </span>

          Return to Main Page
        </Link>

      </div>

    </div>
  );
}