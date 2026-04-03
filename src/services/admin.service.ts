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
  TestAttemptResult,
} from "@/types/admin.types";
import type { QrCode } from "@/types/super-admin.types";
import type { StudentProfileFull, Evaluation, CvTemplate } from "@/types/student.types";
import type { DashboardData, DashboardPeriod } from "@/types/dashboard.types";

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

export const adminService = {
  // Dashboard
  getDashboardStats: async (params?: {
    period?: DashboardPeriod;
    startDate?: string;
    endDate?: string;
    institute?: Institute;
  }) => {
    const response = await api.get("/admin/dashboard/stats", { params });
    return extractData<DashboardData>(response);
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
    return extractData<StudentProfileFull>(response);
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

  // Approval — flips is_approved on the users table
  approveStudent: async (studentId: string) => {
    const response = await api.patch(
      `/admin/students/${studentId}/approve`,
    );
    return extractData<{ message: string }>(response);
  },

  unapproveStudent: async (studentId: string) => {
    const response = await api.patch(
      `/admin/students/${studentId}/unapprove`,
    );
    return extractData<{ message: string }>(response);
  },

  // Reports
  getCandidateReport: async (filters: CandidateFilters = {}) => {
    const response = await api.get("/admin/reports/candidates", {
      params: filters,
    });
    return extractData<{ items: CandidateReportRow[]; total: number; page: number; totalPages: number; courses: string[]; cities: string[] }>(
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
    const response = await api.post("/admin/reports/candidates/download-cvs", {
      studentIds,
    }, { responseType: "blob" });
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

  updateCandidateRemark: async (enrollmentId: string, studentId: string, remark: string) => {
    const response = await api.put(`/admin/reports/candidates/${enrollmentId}/remark`, {
      studentId,
      remark,
    });
    return extractData<{ remarks: string }>(response);
  },

  getFeeDuesReport: async (filters: { page?: number; limit?: number } = {}) => {
    const response = await api.get("/admin/reports/fee-dues", { params: filters });
    const result = extractData<
      | FeeDueRow[]
      | { items: FeeDueRow[]; total: number; page: number; totalPages: number }
    >(response);
    if (Array.isArray(result)) {
      return { items: result, total: result.length, page: 1, totalPages: 1 };
    }
    return result;
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
    const response = await api.get("/admin/qr-codes");
    const qrCodes = extractData<QrCode[]>(response);
    return qrCodes.find((qr) => qr.is_active) ?? null;
  },

  // Recruiter Shortlist
  getRecruiterShortlist: async (filters: { page?: number; limit?: number } = {}) => {
    const response = await api.get("/admin/recruiter-shortlist", { params: filters });
    const result = extractData<
      | RecruiterShortlist[]
      | { items: RecruiterShortlist[]; total: number; page: number; totalPages: number }
    >(response);
    if (Array.isArray(result)) {
      return { items: result, total: result.length, page: 1, totalPages: 1 };
    }
    return result;
  },

  // Access Management
  getRecruiters: async (filters: { page?: number; limit?: number } = {}) => {
    const response = await api.get("/admin/recruiters", { params: filters });
    const result = extractData<
      | RecruiterAccount[]
      | { items: RecruiterAccount[]; total: number; page: number; totalPages: number }
    >(response);
    if (Array.isArray(result)) {
      return { items: result, total: result.length, page: 1, totalPages: 1 };
    }
    return result;
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

  updateRecruiter: async (
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      companyName?: string;
      designation?: string;
    },
  ) => {
    const response = await api.put(`/admin/recruiters/${id}`, data);
    return extractData<RecruiterAccount>(response);
  },

  deleteRecruiter: async (id: string) => {
    const response = await api.delete(`/admin/recruiters/${id}`);
    return extractData<{ message: string }>(response);
  },

  // Tests
  getTests: async (filters: { page?: number; limit?: number } = {}) => {
    const response = await api.get("/admin/tests", { params: filters });
    const result = extractData<
      | Test[]
      | { items: Test[]; total: number; page: number; totalPages: number }
    >(response);
    if (Array.isArray(result)) {
      return { items: result, total: result.length, page: 1, totalPages: 1 };
    }
    return result;
  },

  getTestById: async (id: string) => {
    const response = await api.get(`/admin/tests/${id}`);
    return extractData<Test>(response);
  },

  createTest: async (data: {
    title: string;
    description?: string;
    course: string;
    durationMinutes: number;
    endTime?: string;
    isPublished?: boolean;
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

  getTestAttempts: async (testId: string, filters: { page?: number; limit?: number } = {}) => {
    const response = await api.get(`/admin/tests/${testId}/attempts`, { params: filters });
    const result = extractData<
      | TestAttemptResult[]
      | { items: TestAttemptResult[]; total: number; page: number; totalPages: number }
    >(response);
    if (Array.isArray(result)) {
      return { items: result, total: result.length, page: 1, totalPages: 1 };
    }
    return result;
  },

  // ─── CV / Resume Templates ─────────────────────────────────────
  getResumeTemplates: async () => {
    const response = await api.get("/admin/cv-templates");
    return extractData<CvTemplate[]>(response);
  },

  uploadResumeTemplate: async (data: FormData) => {
    const response = await api.post("/admin/cv-templates", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return extractData<CvTemplate>(response);
  },

  deleteResumeTemplate: async (id: string) => {
    const response = await api.delete(`/admin/cv-templates/${id}`);
    return extractData<null>(response);
  },
};
