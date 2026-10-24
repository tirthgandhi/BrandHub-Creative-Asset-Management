import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { AppRole } from "../components/layout/AppShell";
import { PermissionDenied, Skeleton } from "../components/ui";

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: AppRole[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <main className="standalone-page"><div className="surface-card"><Skeleton label="Checking your session" /></div></main>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.mustChangePassword && location.pathname !== "/change-password") return <Navigate to="/change-password" replace />;
  if (roles && !roles.includes(user.role)) return <main className="standalone-page"><div className="surface-card"><PermissionDenied /></div></main>;
  return children;
}
