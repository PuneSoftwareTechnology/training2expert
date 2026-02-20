import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { ROLES, type Role } from '@/constants/roles';
import { useCallback } from 'react';

export function useAuth() {
  const { user, token, isAuthenticated, login, logout: storeLogout, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const logout = useCallback(() => {
    storeLogout();
    navigate(ROUTES.LOGIN, { replace: true });
  }, [storeLogout, navigate]);

  const getDefaultRoute = useCallback((role: Role): string => {
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
  }, []);

  return {
    user,
    token,
    isAuthenticated,
    role: user?.role ?? null,
    isApproved: user?.isApproved ?? false,
    login,
    logout,
    updateUser,
    getDefaultRoute,
  };
}
