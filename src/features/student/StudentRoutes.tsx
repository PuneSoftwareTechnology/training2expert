import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { StudentLayout } from '@/layouts/StudentLayout';
import { PageLoader } from '@/components/loaders/PageLoader';

const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const EvaluationsPage = lazy(() => import('./pages/EvaluationsPage'));
const CvPage = lazy(() => import('./pages/CvPage'));
const TestsPage = lazy(() => import('./pages/TestsPage'));
const TestAttemptPage = lazy(() => import('./pages/TestAttemptPage'));

export default function StudentRoutes() {
  return (
    <StudentLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="evaluations" element={<EvaluationsPage />} />
          <Route path="cv" element={<CvPage />} />
          <Route path="tests" element={<TestsPage />} />
          <Route path="tests/:testId" element={<TestAttemptPage />} />
        </Routes>
      </Suspense>
    </StudentLayout>
  );
}
