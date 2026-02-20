export const ROLES = {
  STUDENT: 'STUDENT',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  RECRUITER: 'RECRUITER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export function isValidRole(role: string): role is Role {
  return Object.values(ROLES).includes(role as Role);
}
