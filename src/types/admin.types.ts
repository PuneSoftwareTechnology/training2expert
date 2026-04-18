import type {
  CompletionStatus,
  DemoStatus,
  EnrollmentStatus,
  Institute,
  LeadStatus,
  PaymentMode,
  PlacementStatus,
} from "./common.types";

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
  comment?: string;
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
  installment1_amount?: number;
  installment1_date?: string;
  installment1_mode?: PaymentMode;
  installment2_amount?: number;
  installment2_date?: string;
  installment2_mode?: PaymentMode;
  installment3_amount?: number;
  installment3_date?: string;
  installment3_mode?: PaymentMode;
  placement_status: PlacementStatus;
  company_name?: string;
  certificate_url?: string;
}

export interface RecruiterShortlist {
  id: string;
  recruiterId: string;
  recruiterName: string;
  companyName: string;
  course: string;
  studentName: string;
  studentId: string;
  dateOfShortlist: string;
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
  lastLogin: string | null;
}

export interface CandidateReportRow {
  id: string;
  name: string;
  phone?: string;
  course: string;
  enrollmentId: string;
  completionStatus?: string;
  city?: string;
  area?: string;
  itExperienceYears: number;
  technicalMarksScored: number;
  technicalTotalMarks: number;
  communicationScore: number;
  remarks?: string;
  cvUrl?: string;
}

export interface FeeDueRow {
  id: string;
  name: string;
  institute: string;
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
  phone?: string;
  course: string;
  courseEndDate?: string;
  placementStatus: PlacementStatus;
  companyName?: string;
  contactedDate?: string;
}

export interface PlacementReportData {
  notContacted: PlacementRow[];
  contacted: PlacementRow[];
  courses: string[];
}

export interface TestAttemptResult {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  score: number;
  totalMarks: number;
  status: "in_progress" | "submitted" | "expired";
  startTime: string;
  submittedAt: string | null;
}
