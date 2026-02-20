export type EmploymentStatus = 'WORKING' | 'NON_WORKING' | 'FRESHER';
export type CompletionStatus = 'ACTIVE' | 'DROPOUT' | 'COMPLETED';
export type EnrollmentStatus = 'NEW' | 'APPROVED' | 'REJECTED';
export type LeadStatus = 'PROSPECTIVE' | 'NON_PROSPECTIVE' | 'ENROLLED';
export type DemoStatus = 'DONE' | 'PENDING';
export type PaymentMode = 'CASH' | 'UPI';
export type PlacementStatus = 'PLACED' | 'NOT_PLACED';
export type Institute = 'PST' | 'TCH';
export type ApprovalState = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

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
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  qrCodeUrl: string;
  qrBankName: string;
}

export interface Installment {
  id: string;
  installmentNumber: number;
  amount: number;
  paymentDate: string;
  mode: PaymentMode;
  receiptUrl?: string;
}

export interface Enquiry {
  id: string;
  enquiryDate: string;
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
  studentId: string;
  name: string;
  email: string;
  phone: string;
  enrollmentStatus: EnrollmentStatus;
  institute: Institute;
  course: string;
  batch: string;
  trainer: string;
  startDate: string;
  endDate: string;
  completionStatus: CompletionStatus;
  totalFees: number;
  installments: Installment[];
  pendingAmount: number;
  placementStatus: PlacementStatus;
  companyName?: string;
  certificateUrl?: string;
}

export interface CvTemplate {
  id: string;
  course: string;
  experienceLevel: 'FRESHER' | 'EXPERIENCED';
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
  username: string;
  email?: string;
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
