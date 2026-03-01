import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/roles";
import type { ReactNode } from "react";

interface GuestRouteProps {
  children: ReactNode;
}

function getDefaultRoute(role: string): string {
  switch (role) {
    case ROLES.STUDENT:
      return ROUTES.STUDENT_PROFILE;
    case ROLES.ADMIN:
    case ROLES.SUPER_ADMIN:
      return ROUTES.ADMIN_ENQUIRY;
    case ROLES.RECRUITER:
      return ROUTES.RECRUITER_CANDIDATES;
    default:
      return ROUTES.LOGIN;
  }
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    const redirectTo = getDefaultRoute(user.role);
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
