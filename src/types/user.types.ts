import type { Role } from '@/constants/roles';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isApproved: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}
