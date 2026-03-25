import { api, extractData } from "./api";
import type {
  Test,
  TestQuestion,
  Installment,
  Institute,
  LeadStatus,
  DemoStatus,
  EnrollmentStatus,
} from "@/types/common.types";
import type {
  Enquiry,
  Enrollment,
  CandidateReportRow,
  FeeDueRow,
  EnrollmentFigureRow,
  PlacementReportData,
  RecruiterShortlist,
  RecruiterAccount,
} from "@/types/admin.types";
import type { QrCode } from "@/types/super-admin.types";
import type { StudentProfile, Evaluation } from "@/types/student.types";

interface EnquiryFilters {
  fromDate?: string;
  toDate?: string;
  leadStatus?: LeadStatus;
  demoStatus?: DemoStatus;
  page?: number;
  limit?: number;
}

interface EnrollmentFilters {
  enrollment_status?: EnrollmentStatus;
  institute?: Institute;
  course?: string;
  page?: number;
  limit?: number;
}

interface CandidateFilters {
  course?: string;
  city?: string;
  minExperience?: number;
  maxExperience?: number;
  minTechnicalRating?: number;
  minCommunicationRating?: number;
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  totalEnrollments: number;
  totalEnquiries: number;
  totalFeeCollected: number;
  totalPendingDues: number;
  totalPlaced: number;
  totalNotPlaced: number;
  courseWiseEnrollments: { course: string; count: number }[];
  enrollmentStatusBreakdown: { status: string; count: number }[];
  recentEnrollments: Enrollment[];
}

export const adminService = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await api.get("/admin/dashboard/stats");
    return extractData<DashboardStats>(response);
  },

  // Enquiry
  getEnquiries: async (filters: EnquiryFilters = {}) => {
    const response = await api.get("/admin/enquiries", { params: filters });
    const result = extractData<
      | Enquiry[]
      | { items: Enquiry[]; total: number; page: number; totalPages: number }
    >(response);
    // Handle both response shapes: array directly or paginated object
    if (Array.isArray(result)) {
      return { items: result, total: result.length, page: 1, totalPages: 1 };
    }
    return result;
  },

  createEnquiry: async (data: Omit<Enquiry, "id">) => {
    const response = await api.post("/admin/enquiries", data);
    return extractData<Enquiry>(response);
  },

  updateEnquiry: async (id: string, data: Partial<Enquiry>) => {
    const response = await api.put(`/admin/enquiries/${id}`, data);
    return extractData<Enquiry>(response);
  },

  deleteEnquiry: async (id: string) => {
    const response = await api.delete(`/admin/enquiries/${id}`);
    return extractData<{ message: string }>(response);
  },

  // Enrollment
  getEnrollments: async (filters: EnrollmentFilters = {}) => {
    const response = await api.get("/admin/enrollments", { params: filters });
    const result = extractData<
      | Enrollment[]
      | { items: Enrollment[]; total: number; page: number; totalPages: number; courses?: string[] }
    >(response);
    if (Array.isArray(result)) {
      return { items: result, total: result.length, page: 1, totalPages: 1, courses: [] as string[] };
    }
    return result;
  },

  getCourses: async () => {
    const response = await api.get("/admin/enrollments", { params: { limit: 1 } });
    const result = extractData<{ courses?: string[] }>(response);
    return result.courses ?? [];
  },

  createEnrollment: async (data: Partial<Enrollment>) => {
    const response = await api.post("/admin/enrollments", data);
    return extractData<Enrollment>(response);
  },

  updateEnrollment: async (id: string, data: Partial<Enrollment>) => {
    const response = await api.put(`/admin/enrollments/${id}`, data);
    return extractData<Enrollment>(response);
  },

  deleteEnrollment: async (id: string) => {
    const response = await api.delete(`/admin/enrollments/${id}`);
    return extractData<{ message: string }>(response);
  },

  getStudentProfile: async (studentId: string) => {
    const response = await api.get(`/admin/students/${studentId}/profile`);
    return extractData<StudentProfile>(response);
  },

  getStudentEvaluation: async (studentId: string) => {
    const response = await api.get(`/admin/students/${studentId}/evaluations`);
    return extractData<Evaluation[]>(response);
  },

  updateEvaluation: async (evaluationId: string, data: Partial<Evaluation>) => {
    const response = await api.put(`/admin/evaluations/${evaluationId}`, data);
    return extractData<Evaluation>(response);
  },

  // Payments
  updateInstallment: async (
    enrollmentId: string,
    installment: Partial<Installment>,
  ) => {
    const response = await api.put(
      `/admin/enrollments/${enrollmentId}/installments`,
      installment,
    );
    return extractData<Installment>(response);
  },

  sendReceipt: async (enrollmentId: string, installmentId: string) => {
    const response = await api.post(
      `/admin/enrollments/${enrollmentId}/installments/${installmentId}/send-receipt`,
    );
    return extractData<{ message: string }>(response);
  },

  sendCertificate: async (enrollmentId: string) => {
    const response = await api.post(
      `/admin/enrollments/${enrollmentId}/send-certificate`,
    );
    return extractData<{ message: string }>(response);
  },

  // Approval
  approveStudent: async (enrollmentId: string) => {
    const response = await api.post(
      `/admin/enrollments/${enrollmentId}/approve`,
    );
    return extractData<{ message: string }>(response);
  },

  rejectStudent: async (enrollmentId: string) => {
    const response = await api.post(
      `/admin/enrollments/${enrollmentId}/reject`,
    );
    return extractData<{ message: string }>(response);
  },

  // Reports
  getCandidateReport: async (filters: CandidateFilters = {}) => {
    const response = await api.get("/admin/reports/candidates", {
      params: filters,
    });
    return extractData<{ items: CandidateReportRow[]; courses: string[] }>(
      response,
    );
  },

  downloadCv: async (studentId: string): Promise<Blob> => {
    const response = await api.get(`/admin/students/${studentId}/cv`, {
      responseType: "blob",
    });
    return response.data as Blob;
  },

  downloadBulkCvs: async (studentIds: string[]): Promise<Blob> => {
    const response = await api.post(
      "/admin/reports/candidates/download-cvs",
      { studentIds },
      { responseType: "blob" },
    );
    return response.data as Blob;
  },

  sendBulkEmail: async (
    studentIds: string[],
    subject: string,
    body: string,
  ) => {
    const response = await api.post("/admin/reports/candidates/send-email", {
      studentIds,
      subject,
      body,
    });
    return extractData<{ message: string }>(response);
  },

  addBulkComment: async (studentIds: string[], comment: string) => {
    const response = await api.post("/admin/reports/candidates/add-comment", {
      studentIds,
      comment,
    });
    return extractData<{ message: string }>(response);
  },

  getFeeDuesReport: async () => {
    const response = await api.get("/admin/reports/fee-dues");
    return extractData<FeeDueRow[]>(response);
  },

  getEnrollmentFigures: async (institute: string, year: number) => {
    const response = await api.get("/admin/reports/enrollment-figures", {
      params: { institute, year },
    });
    return extractData<EnrollmentFigureRow[]>(response);
  },

  getPlacementReport: async (
    filters: { fromDate?: string; toDate?: string; course?: string; status?: string } = {},
  ) => {
    const response = await api.get("/admin/reports/placement", {
      params: filters,
    });
    return extractData<PlacementReportData>(response);
  },

  updatePlacementContact: async (
    enrollmentId: string,
    data: { placementStatus: string; companyName?: string },
  ) => {
    const response = await api.put(`/admin/reports/placement/${enrollmentId}`, data);
    return extractData<{ placementStatus: string; companyName?: string; contactedDate: string }>(response);
  },

  // QR Code (Admin — read-only)
  getActiveQrCode: async () => {
    const response = await api.get("/admin/qr-code");
    return extractData<QrCode>(response);
  },

  // Recruiter Shortlist
  getRecruiterShortlist: async () => {
    const response = await api.get("/admin/recruiter-shortlist");
    return extractData<RecruiterShortlist[]>(response);
  },

  // Access Management
  getRecruiters: async () => {
    const response = await api.get("/admin/recruiters");
    return extractData<RecruiterAccount[]>(response);
  },

  createRecruiter: async (data: {
    name: string;
    email: string;
    phone: string;
    companyName: string;
    designation?: string;
    password: string;
  }) => {
    const response = await api.post("/admin/recruiters", data);
    return extractData<RecruiterAccount>(response);
  },

  deleteRecruiter: async (id: string) => {
    const response = await api.delete(`/admin/recruiters/${id}`);
    return extractData<{ message: string }>(response);
  },

  // Tests
  getTests: async () => {
    const response = await api.get("/admin/tests");
    return extractData<Test[]>(response);
  },

  createTest: async (data: {
    title: string;
    course: string;
    durationMinutes: number;
    questions: Omit<TestQuestion, "id">[];
  }) => {
    const response = await api.post("/admin/tests", data);
    return extractData<Test>(response);
  },

  updateTest: async (id: string, data: Partial<Test>) => {
    const response = await api.put(`/admin/tests/${id}`, data);
    return extractData<Test>(response);
  },

  toggleTestActive: async (id: string) => {
    const response = await api.post(`/admin/tests/${id}/toggle-active`);
    return extractData<Test>(response);
  },

  deleteTest: async (id: string) => {
    const response = await api.delete(`/admin/tests/${id}`);
    return extractData<{ message: string }>(response);
  },
};
