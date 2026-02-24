import { api, extractData } from "./api";
import type {
  Enquiry,
  Enrollment,
  Evaluation,
  StudentProfile,
  CandidateReportRow,
  FeeDueRow,
  EnrollmentFigureRow,
  PlacementRow,
  RecruiterShortlist,
  RecruiterAccount,
  AdminAccount,
  QrCode,
  Test,
  TestQuestion,
  Installment,
  Institute,
  LeadStatus,
  DemoStatus,
  EnrollmentStatus,
} from "@/types/student.types";

interface EnquiryFilters {
  fromDate?: string;
  toDate?: string;
  leadStatus?: LeadStatus;
  demoStatus?: DemoStatus;
  page?: number;
  limit?: number;
}

interface EnrollmentFilters {
  enrollmentStatus?: EnrollmentStatus;
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

  convertToEnrollment: async (enquiryId: string) => {
    const response = await api.post(`/admin/enquiries/${enquiryId}/convert`);
    return extractData<Enrollment>(response);
  },

  // Enrollment
  getEnrollments: async (filters: EnrollmentFilters = {}) => {
    const response = await api.get("/admin/enrollments", { params: filters });
    const result = extractData<
      | Enrollment[]
      | { items: Enrollment[]; total: number; page: number; totalPages: number }
    >(response);
    if (Array.isArray(result)) {
      return { items: result, total: result.length, page: 1, totalPages: 1 };
    }
    return result;
  },

  createEnrollment: async (data: Partial<Enrollment>) => {
    const response = await api.post("/admin/enrollments", data);
    return extractData<Enrollment>(response);
  },

  updateEnrollment: async (id: string, data: Partial<Enrollment>) => {
    const response = await api.put(`/admin/enrollments/${id}`, data);
    return extractData<Enrollment>(response);
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
    return extractData<{ items: CandidateReportRow[]; total: number }>(
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

  getFeeDuesReport: async (daysFilter: number) => {
    const response = await api.get("/admin/reports/fee-dues", {
      params: { days: daysFilter },
    });
    return extractData<FeeDueRow[]>(response);
  },

  getEnrollmentFigures: async (institute: string, year: number) => {
    const response = await api.get("/admin/reports/enrollment-figures", {
      params: { institute, year },
    });
    return extractData<EnrollmentFigureRow[]>(response);
  },

  getPlacementReport: async (
    filters: { course?: string; status?: string } = {},
  ) => {
    const response = await api.get("/admin/reports/placement", {
      params: filters,
    });
    return extractData<PlacementRow[]>(response);
  },

  // QR Code
  getActiveQrCode: async () => {
    const response = await api.get("/admin/qr-code");
    return extractData<QrCode>(response);
  },

  getAllQrCodes: async () => {
    const response = await api.get("/admin/qr-codes");
    return extractData<QrCode[]>(response);
  },

  uploadQrCode: async (file: File, bankName: string) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("bankName", bankName);
    const response = await api.post("/admin/qr-codes", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return extractData<QrCode>(response);
  },

  toggleQrCodeActive: async (qrId: string) => {
    const response = await api.post(`/admin/qr-codes/${qrId}/toggle-active`);
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
    username: string;
    email?: string;
    password: string;
  }) => {
    const response = await api.post("/admin/recruiters", data);
    return extractData<RecruiterAccount>(response);
  },

  deleteRecruiter: async (id: string) => {
    const response = await api.delete(`/admin/recruiters/${id}`);
    return extractData<{ message: string }>(response);
  },

  // Admin Management (Super Admin only)
  getAdmins: async () => {
    const response = await api.get("/super-admin/admins");
    return extractData<AdminAccount[]>(response);
  },

  createAdmin: async (data: {
    name: string;
    email: string;
    password: string;
  }) => {
    const response = await api.post("/admin/admins", data);
    return extractData<AdminAccount>(response);
  },

  deleteAdmin: async (id: string) => {
    const response = await api.delete(`/admin/admins/${id}`);
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
