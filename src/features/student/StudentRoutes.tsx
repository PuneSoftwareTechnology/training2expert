import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { StudentLayout } from '@/layouts/StudentLayout';
import { PageLoader } from '@/components/loaders/PageLoader';

const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const TestsPage = lazy(() => import('./pages/TestsPage'));
const TestAttemptPage = lazy(() => import('./pages/TestAttemptPage'));

export default function StudentRoutes() {
  return (
    <StudentLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="payments" element={<Navigate to="/student/profile" replace />} />
          <Route path="evaluations" element={<Navigate to="/student/profile" replace />} />
          <Route path="cv" element={<Navigate to="/student/profile" replace />} />
          <Route path="tests" element={<TestsPage />} />
          <Route path="tests/:testId" element={<TestAttemptPage />} />
        </Routes>
      </Suspense>
    </StudentLayout>
  );
}
