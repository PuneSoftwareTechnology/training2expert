import { useAuthStore } from '@/store/auth.store';
import { ROLES, type Role } from '@/constants/roles';

export function useRole() {
  const role = useAuthStore((s) => s.user?.role ?? null);

  return {
    role,
    isStudent: role === ROLES.STUDENT,
    isAdmin: role === ROLES.ADMIN,
    isSuperAdmin: role === ROLES.SUPER_ADMIN,
    isRecruiter: role === ROLES.RECRUITER,
    isAdminOrSuper: role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN,
    hasRole: (requiredRole: Role) => role === requiredRole,
    hasAnyRole: (roles: Role[]) => role !== null && roles.includes(role),
  };
}
