import { Navigate } from "react-router-dom";

/**
 * Decommissioned: Cross-tier "All Referrals" master view has been removed.
 * All referral data access requires authenticating into a dedicated role-scoped portal.
 */
export function ReferralsPage() {
  return <Navigate to="/#portals" replace />;
}