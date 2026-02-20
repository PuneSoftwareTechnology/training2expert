import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants/routes';
import type { Role } from '@/constants/roles';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
}
