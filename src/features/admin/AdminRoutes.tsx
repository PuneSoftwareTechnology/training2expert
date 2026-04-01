import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ProtectedRoute } from "@/components/organisms/ProtectedRoute";
import { PageLoader } from "@/components/loaders/PageLoader";
import { ROLES } from "@/constants/roles";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const EnquiryPage = lazy(() => import("./pages/EnquiryPage"));
const EnrollmentPage = lazy(() => import("./pages/EnrollmentPage"));
const CandidateFilterPage = lazy(() => import("./pages/CandidateFilterPage"));
const FeeDuesPage = lazy(() => import("./pages/FeeDuesPage"));
const EnrollmentFiguresPage = lazy(
  () => import("./pages/EnrollmentFiguresPage"),
);
const PlacementReportsPage = lazy(() => import("./pages/PlacementReportsPage"));
const QrCodePage = lazy(() => import("./pages/QrCodePage"));
const RecruiterShortlistPage = lazy(
  () => import("./pages/RecruiterShortlistPage"),
);
const AccessManagementPage = lazy(() => import("./pages/AccessManagementPage"));
const TestManagementPage = lazy(() => import("./pages/TestManagementPage"));
const ResumeTemplatesPage = lazy(() => import("./pages/ResumeTemplatesPage"));
const QrManagementPage = lazy(() => import("./pages/QrManagementPage"));

export default function AdminRoutes() {
  return (
    <AdminLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="enquiry" element={<EnquiryPage />} />
          <Route path="enrollment" element={<EnrollmentPage />} />
          <Route path="reports/candidates" element={<CandidateFilterPage />} />
          <Route path="reports/fee-dues" element={<FeeDuesPage />} />
          <Route
            path="reports/enrollment-figures"
            element={<EnrollmentFiguresPage />}
          />
          <Route path="reports/placement" element={<PlacementReportsPage />} />
          <Route path="qr-code" element={<QrCodePage />} />
          <Route
            path="recruiter-shortlist"
            element={<RecruiterShortlistPage />}
          />
          <Route path="access-management" element={<AccessManagementPage />} />
          <Route path="tests" element={<TestManagementPage />} />
          <Route path="resume-templates" element={<ResumeTemplatesPage />} />
          <Route
            path="qr-management"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <QrManagementPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </AdminLayout>
  );
}
