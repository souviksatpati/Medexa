import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import type { Role } from "./authTypes";

interface ProtectedRouteProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface">
        <div className="text-center p-8 max-w-sm rounded-3xl border border-outline-variant bg-surface shadow-lg">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
          <h3 className="text-lg font-bold text-on-surface">Checking access...</h3>
          <p className="text-xs text-on-surface-variant mt-1.5">
            Verifying cryptographic and role permissions
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated -> redirect to portal chooser / login
  if (!user) {
    return <Navigate to="/#portals" state={{ from: location.pathname }} replace />;
  }

  // Authenticated but role is not allowed -> immediate Access Denied!
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" state={{ attemptedPath: location.pathname, userRole: user.role }} replace />;
  }

  return <>{children}</>;
}
