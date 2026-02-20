import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { RecruiterLayout } from '@/layouts/RecruiterLayout';
import { PageLoader } from '@/components/loaders/PageLoader';

const CandidateFilterPage = lazy(() => import('./pages/CandidateFilterPage'));
const ShortlistPage = lazy(() => import('./pages/ShortlistPage'));

export default function RecruiterRoutes() {
  return (
    <RecruiterLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<Navigate to="candidates" replace />} />
          <Route path="candidates" element={<CandidateFilterPage />} />
          <Route path="shortlist" element={<ShortlistPage />} />
        </Routes>
      </Suspense>
    </RecruiterLayout>
  );
}
