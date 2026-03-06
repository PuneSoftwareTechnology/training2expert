import type { ApprovalState, EmploymentStatus, EnrollmentStatus } from "./common.types";

// Re-export all types for backward compatibility
export * from "./common.types";
export * from "./admin.types";
export * from "./super-admin.types";

// Student-specific types
export interface Certification {
  name: string;
  certificate?: string;
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

export interface Evaluation {
  id: string;
  studentId: string;
  courseId: string;
  courseName: string;
  technicalScore: number;
  communicationScore: number;
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
}

export interface CvTemplate {
  id: string;
  course: string;
  experienceLevel: "FRESHER" | "EXPERIENCED";
  downloadUrl: string;
}

export interface TestAttempt {
  testId: string;
  answers: Record<string, number>;
  score?: number;
  submittedAt?: string;
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
