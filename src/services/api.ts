import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiResponse, ApiError } from "@/types/api.types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { state?: { token?: string } };
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Invalid storage state
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? "";
      const isAuthRoute =
        url.includes("/login") ||
        url.includes("/signup") ||
        url.includes("/forgot-password") ||
        url.includes("/reset-password");

      console.warn(
        `[api] 🔒 401 Unauthorized → ${error.config?.method?.toUpperCase()} ${url}`,
      );

      if (!isAuthRoute) {
        try {
          const stored = localStorage.getItem("auth-storage");
          const token = stored
            ? (JSON.parse(stored) as { state?: { token?: string } })?.state
                ?.token
            : null;

          if (token) {
            console.warn(
              "[api] 🔴 401 with token present → session expired. Clearing storage & redirecting to /login",
            );
            localStorage.removeItem("auth-storage");
            window.location.href = "/login";
          } else {
            console.log(
              "[api] 🟡 401 but token already cleared → user logged out intentionally. Skipping redirect.",
            );
          }
        } catch {
          console.error(
            "[api] 💥 Error parsing auth-storage on 401, forcing redirect",
          );
          localStorage.removeItem("auth-storage");
          window.location.href = "/login";
        }
      } else {
        console.log(
          `[api] ℹ️  401 on auth route (${url}) — ignoring, component will handle it`,
        );
      }
    }
    return Promise.reject(error);
  },
);

export function extractData<T>(response: { data: ApiResponse<T> }): T {
  if (!response.data.success) {
    throw new Error(response.data.message || "Request failed");
  }
  return response.data.data;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    return (
      axiosError.response?.data?.message ||
      axiosError.message ||
      "An error occurred"
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}
