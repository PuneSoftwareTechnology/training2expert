import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { ProtectedRoute } from '@/components/organisms/ProtectedRoute';
import { PageLoader } from '@/components/loaders/PageLoader';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const SignupPage = lazy(() => import('@/features/auth/pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/features/auth/pages/VerifyEmailPage'));

const StudentRoutes = lazy(() => import('@/features/student/StudentRoutes'));
const AdminRoutes = lazy(() => import('@/features/admin/AdminRoutes'));
const RecruiterRoutes = lazy(() => import('@/features/recruiter/RecruiterRoutes'));

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />

        {/* Student routes */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentRoutes />
            </ProtectedRoute>
          }
        />

        {/* Admin + Super Admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
              <AdminRoutes />
            </ProtectedRoute>
          }
        />

        {/* Recruiter routes */}
        <Route
          path="/recruiter/*"
          element={
            <ProtectedRoute allowedRoles={[ROLES.RECRUITER]}>
              <RecruiterRoutes />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </Suspense>
  );
}
