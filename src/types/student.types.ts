import type { ApprovalState, EmploymentStatus, EnrollmentStatus } from "./common.types";

// Re-export all types for backward compatibility
export * from "./common.types";
export * from "./admin.types";
export * from "./super-admin.types";

// Student-specific types
export interface Certification {
  name: string;
  certificate?: string;
  /** Presigned display URL (not persisted — used for immediate viewing after upload) */
  certificateDisplayUrl?: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  area?: string;
  profilePhoto?: string;
  graduation?: string;
  graduationYear?: number;
  postGraduation?: string;
  pgYear?: number;
  certifications: Certification[];
  employmentStatus: EmploymentStatus;
  lastWorkedYear?: number;
  itExperienceYears: number;
  itExperienceMonths: number;
  nonItExperienceYears: number;
  nonItExperienceMonths: number;
  approvalState: ApprovalState;
  enrollmentStatus: EnrollmentStatus;
  course?: string;
  batch?: string;
}

export interface ModuleScore {
  moduleName: string;
  score: number;
}

export interface TestScore {
  testId: string;
  testName: string;
  score: number;
  totalMarks: number;
  submittedAt: string;
}

export interface Evaluation {
  id: string;
  studentId: string;
  courseId: string;
  courseName: string;
  technicalMarksScored: number;
  technicalTotalMarks: number;
  communicationScore: number;
  moduleScores?: ModuleScore[];
  testScores?: TestScore[];
  projectSubmission?: string;
  scopeForImprovement: string;
  trainerRemark: string;
}

export interface PaymentSummary {
  total_fee: number;
  paid_amount: number;
  pending_amount: number;
  qr_code_url: string;
  qr_bank_name: string;
  qr_upi_id?: string;
  qr_account_number?: string;
  qr_ifsc_code?: string;
  installment1_amount?: number;
  installment1_date?: string;
  installment1_mode?: string;
  installment2_amount?: number;
  installment2_date?: string;
  installment2_mode?: string;
  installment3_amount?: number;
  installment3_date?: string;
  installment3_mode?: string;
}

export interface CvTemplate {
  id: string;
  course: string;
  experienceLevel: "FRESHER" | "EXPERIENCED";
  downloadUrl: string;
}

export interface ProjectSubmission {
  id: string;
  url: string;
  createdAt: string;
}

export interface StudentProfileFull extends StudentProfile {
  payments: PaymentSummary | null;
  evaluations: Evaluation[];
  projectSubmissions: ProjectSubmission[];
  cvTemplates: CvTemplate[];
  cv: { url: string } | null;
}

export interface TestAttempt {
  testId: string;
  answers: Record<string, number>;
  score?: number;
  submittedAt?: string;
}

export interface AttemptSession {
  id: string;
  userId: string;
  testId: string;
  startTime: string;
  expiryTime: string;
  score: number;
  totalMarks: number;
  status: "in_progress" | "submitted" | "expired";
}

export interface StartTestResponse {
  attempt: AttemptSession;
  test: import("./common.types").Test;
}

export interface SubmitTestResponse {
  id: string;
  userId: string;
  testId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: "submitted";
  submittedAt: string;
}

export interface RecruiterCandidate {
  id: string;
  name: string;
  course: string;
  city?: string;
  itExperienceYears: number;
  itExperienceMonths: number;
  technicalScore: number;
  communicationScore: number;
  cvUrl?: string;
  isShortlisted: boolean;
}
