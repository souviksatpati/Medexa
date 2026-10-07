import type { Role } from "./authTypes";

export const ROLE_DASHBOARDS: Record<Role, string> = {
  ASHA: "/dashboard/referrals/asha",
  BLOCK: "/dashboard/referrals/block-office",
  DISTRICT: "/dashboard",
};

export const ROLE_PORTAL_LABELS: Record<Role, string> = {
  ASHA: "ASHA / Village Worker Portal",
  BLOCK: "Block Health Office Portal",
  DISTRICT: "District Office Portal",
};

/**
 * Checks if a user's role satisfies the required roles.
 */
export function isRoleAllowed(userRole: Role | undefined, allowedRoles: Role[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Returns the default dashboard URL for a given role.
 */
export function getDefaultDashboard(role: Role | undefined): string {
  if (!role) return "/#portals";
  return ROLE_DASHBOARDS[role] || "/#portals";
}
