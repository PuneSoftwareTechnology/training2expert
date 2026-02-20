import { api, extractData } from "./api";
import type {
  User,
  LoginCredentials,
  SignupPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "@/types/user.types";

interface LoginResponse {
  user: User;
  token: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post("/public/login", credentials);
    return extractData<LoginResponse>(response);
  },

  signup: async (payload: SignupPayload): Promise<{ message: string }> => {
    const response = await api.post("/auth/signup", payload);
    return extractData<{ message: string }>(response);
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await api.post("/auth/verify-email", { token });
    return extractData<{ message: string }>(response);
  },

  forgotPassword: async (
    payload: ForgotPasswordPayload,
  ): Promise<{ message: string }> => {
    const response = await api.post("/auth/forgot-password", payload);
    return extractData<{ message: string }>(response);
  },

  resetPassword: async (
    payload: ResetPasswordPayload,
  ): Promise<{ message: string }> => {
    const response = await api.post("/auth/reset-password", payload);
    return extractData<{ message: string }>(response);
  },

  getMe: async (): Promise<User> => {
    const response = await api.get("/auth/me");
    return extractData<User>(response);
  },
};
