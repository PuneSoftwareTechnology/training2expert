import { ROLES, type Role } from "./roles";
import { ROUTES } from "./routes";

/** Roles that sign in to the /admin portal and get the AdminLayout shell. */
export const ADMIN_PORTAL_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.INTERN,
];

const ADMIN_AND_SUPER: Role[] = [ROLES.ADMIN, ROLES.SUPER_ADMIN];
const WITH_INTERN: Role[] = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.INTERN];

/**
 * Single source of truth for who may open each /admin screen. The sidebar and
 * the route guards both read this map, so a hidden menu item and a blocked URL
 * can never drift apart. Anything not listed falls back to admin + super admin.
 */
export const ADMIN_ROUTE_ROLES: Record<string, Role[]> = {
  [ROUTES.ADMIN_ENQUIRY]: WITH_INTERN,
  [ROUTES.ADMIN_ENROLLMENT]: ADMIN_AND_SUPER,
  // QR Code has always been hidden from super admins, who use QR Management.
  [ROUTES.ADMIN_QR_CODE]: [ROLES.ADMIN, ROLES.INTERN],
  [ROUTES.ADMIN_ACCESS_MANAGEMENT]: WITH_INTERN,
  [ROUTES.ADMIN_TESTS]: ADMIN_AND_SUPER,
  [ROUTES.ADMIN_RESUME_TEMPLATES]: ADMIN_AND_SUPER,
  [ROUTES.ADMIN_QR_MANAGEMENT]: [ROLES.SUPER_ADMIN],
  [ROUTES.ADMIN_COURSES]: [ROLES.SUPER_ADMIN],
  // Only super admins create trainers; admins select them from the dropdown on
  // the enrollment form, which needs no screen of its own.
  [ROUTES.ADMIN_TRAINERS]: [ROLES.SUPER_ADMIN],
  // Trainer payment figures are sensitive. Add ROLES.ADMIN here and to the
  // matching authorizeRoles calls in the backend's admin.routes.js to open it up.
  [ROUTES.ADMIN_TRAINER_PAYMENTS]: [ROLES.SUPER_ADMIN],

  // Reports
  [ROUTES.ADMIN_DASHBOARD]: ADMIN_AND_SUPER,
  [ROUTES.ADMIN_ENQUIRY_FIGURES]: WITH_INTERN,
  [ROUTES.ADMIN_ENROLLMENT_FIGURES]: ADMIN_AND_SUPER,
  [ROUTES.ADMIN_FEE_DUES]: ADMIN_AND_SUPER,
  [ROUTES.ADMIN_RECRUITER_SHORTLIST]: WITH_INTERN,
  [ROUTES.ADMIN_PLACEMENT_REPORTS]: WITH_INTERN,
  [ROUTES.ADMIN_CANDIDATE_FILTER]: WITH_INTERN,
};

export function rolesForAdminRoute(path: string): Role[] {
  return ADMIN_ROUTE_ROLES[path] ?? ADMIN_AND_SUPER;
}

export function canAccessAdminRoute(path: string, role: Role | null): boolean {
  return role !== null && rolesForAdminRoute(path).includes(role);
}

/** First admin screen a role is allowed to see — used for landing redirects. */
export function defaultAdminRoute(role: Role | null): string {
  return role === ROLES.INTERN ? ROUTES.ADMIN_ENQUIRY : ROUTES.ADMIN_DASHBOARD;
}
