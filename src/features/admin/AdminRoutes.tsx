import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ProtectedRoute } from "@/components/organisms/ProtectedRoute";
import { PageLoader } from "@/components/loaders/PageLoader";
import { ROUTES } from "@/constants/routes";
import { rolesForAdminRoute, defaultAdminRoute } from "@/constants/access";
import { useRole } from "@/hooks/useRole";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const EnquiryPage = lazy(() => import("./pages/EnquiryPage"));
const EnrollmentPage = lazy(() => import("./pages/EnrollmentPage"));
const CandidateFilterPage = lazy(() => import("./pages/CandidateFilterPage"));
const FeeDuesPage = lazy(() => import("./pages/FeeDuesPage"));
const EnrollmentFiguresPage = lazy(
  () => import("./pages/EnrollmentFiguresPage"),
);
const EnquiryFiguresPage = lazy(
  () => import("./pages/EnquiryFiguresPage"),
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
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const TrainersPage = lazy(() => import("./pages/TrainersPage"));
const TrainerPaymentsPage = lazy(() => import("./pages/TrainerPaymentsPage"));

/**
 * Every admin screen is guarded by the same route/role map the sidebar filters
 * with, so hiding a menu item also blocks the URL from being typed in.
 */
function guard(path: string, element: ReactNode) {
  return (
    <ProtectedRoute allowedRoles={rolesForAdminRoute(path)}>
      {element}
    </ProtectedRoute>
  );
}

export default function AdminRoutes() {
  const { role } = useRole();

  return (
    <AdminLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            index
            element={<Navigate to={defaultAdminRoute(role)} replace />}
          />
          <Route
            path="dashboard"
            element={guard(ROUTES.ADMIN_DASHBOARD, <DashboardPage />)}
          />
          <Route
            path="enquiry"
            element={guard(ROUTES.ADMIN_ENQUIRY, <EnquiryPage />)}
          />
          <Route
            path="enrollment"
            element={guard(ROUTES.ADMIN_ENROLLMENT, <EnrollmentPage />)}
          />
          <Route
            path="reports/candidates"
            element={guard(
              ROUTES.ADMIN_CANDIDATE_FILTER,
              <CandidateFilterPage />,
            )}
          />
          <Route
            path="reports/fee-dues"
            element={guard(ROUTES.ADMIN_FEE_DUES, <FeeDuesPage />)}
          />
          <Route
            path="reports/enrollment-figures"
            element={guard(
              ROUTES.ADMIN_ENROLLMENT_FIGURES,
              <EnrollmentFiguresPage />,
            )}
          />
          <Route
            path="reports/enquiry-figures"
            element={guard(
              ROUTES.ADMIN_ENQUIRY_FIGURES,
              <EnquiryFiguresPage />,
            )}
          />
          <Route
            path="reports/placement"
            element={guard(
              ROUTES.ADMIN_PLACEMENT_REPORTS,
              <PlacementReportsPage />,
            )}
          />
          <Route
            path="qr-code"
            element={guard(ROUTES.ADMIN_QR_CODE, <QrCodePage />)}
          />
          <Route
            path="recruiter-shortlist"
            element={guard(
              ROUTES.ADMIN_RECRUITER_SHORTLIST,
              <RecruiterShortlistPage />,
            )}
          />
          <Route
            path="access-management"
            element={guard(
              ROUTES.ADMIN_ACCESS_MANAGEMENT,
              <AccessManagementPage />,
            )}
          />
          <Route
            path="tests"
            element={guard(ROUTES.ADMIN_TESTS, <TestManagementPage />)}
          />
          <Route
            path="resume-templates"
            element={guard(
              ROUTES.ADMIN_RESUME_TEMPLATES,
              <ResumeTemplatesPage />,
            )}
          />
          <Route
            path="qr-management"
            element={guard(ROUTES.ADMIN_QR_MANAGEMENT, <QrManagementPage />)}
          />
          <Route
            path="courses"
            element={guard(ROUTES.ADMIN_COURSES, <CoursesPage />)}
          />
          <Route
            path="trainers"
            element={guard(ROUTES.ADMIN_TRAINERS, <TrainersPage />)}
          />
          <Route
            path="trainer-payments"
            element={guard(
              ROUTES.ADMIN_TRAINER_PAYMENTS,
              <TrainerPaymentsPage />,
            )}
          />
        </Routes>
      </Suspense>
    </AdminLayout>
  );
}
