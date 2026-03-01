export type EmploymentStatus = "WORKING" | "NON_WORKING" | "FRESHER";
export type CompletionStatus = "ACTIVE" | "DROPOUT" | "COMPLETED";
export type EnrollmentStatus = "NEW" | "APPROVED" | "REJECTED";
export type LeadStatus = "PROSPECTIVE" | "NON_PROSPECTIVE" | "ENROLLED";
export type DemoStatus = "DONE" | "PENDING";
export type PaymentMode = "CASH" | "UPI";
export type PlacementStatus = "PLACED" | "NOT_PLACED";
export type Institute = "PST" | "TCH";
export type ApprovalState = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

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
  certifications: string[];
  employmentStatus: EmploymentStatus;
  lastWorkedYear?: number;
  itExperienceYears: number;
  itExperienceMonths: number;
  nonItExperienceYears: number;
  nonItExperienceMonths: number;
  approvalState: ApprovalState;
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

export interface Installment {
  id: string;
  installment_number: number;
  amount: number;
  payment_date: string;
  mode: PaymentMode;
  receipt_url?: string;
}

export interface Enquiry {
  id: string;
  enquiry_date: string;
  name: string;
  phone: string;
  email?: string;
  course?: string;
  institute: Institute;
  leadStatus: LeadStatus;
  demoStatus: DemoStatus;
}

export interface Enrollment {
  id: string;
  student_id: string;
  name: string;
  email: string;
  phone: string;
  enrollment_status: EnrollmentStatus;
  institute: Institute;
  course: string;
  batch: string;
  trainer: string;
  start_date: string;
  end_date: string;
  completion_status: CompletionStatus;
  total_fee: number;
  installments: Installment[];
  pending_amount: number;
  placement_status: PlacementStatus;
  company_name?: string;
  certificate_url?: string;
}

export interface CvTemplate {
  id: string;
  course: string;
  experienceLevel: "FRESHER" | "EXPERIENCED";
  downloadUrl: string;
}

export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex?: number;
}

export interface Test {
  id: string;
  title: string;
  course: string;
  durationMinutes: number;
  isActive: boolean;
  questions: TestQuestion[];
  createdAt: string;
}

export interface TestAttempt {
  testId: string;
  answers: Record<string, number>;
  score?: number;
  submittedAt?: string;
}

export interface RecruiterShortlist {
  id: string;
  recruiterId: string;
  recruiterName: string;
  course: string;
  studentName: string;
  studentId: string;
  dateOfShortlist: string;
}

export interface QrCode {
  id: string;
  imageUrl: string;
  bankName: string;
  isActive: boolean;
  createdAt: string;
}

export interface RecruiterAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  designation: string;
  role: string;
  createdAt: string;
}

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface CandidateReportRow {
  id: string;
  name: string;
  course: string;
  city?: string;
  itExperienceYears: number;
  technicalScore: number;
  communicationScore: number;
  remarks?: string;
  cvUrl?: string;
}

export interface FeeDueRow {
  id: string;
  name: string;
  course: string;
  completionStatus: CompletionStatus;
  phone: string;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  daysSinceLastPayment: number;
}

export interface EnrollmentFigureRow {
  course: string;
  monthlyData: Record<string, number>;
  total: number;
}

export interface PlacementRow {
  id: string;
  name: string;
  course: string;
  placementStatus: PlacementStatus;
  companyName?: string;
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
