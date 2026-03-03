import type {
  CompletionStatus,
  DemoStatus,
  EnrollmentStatus,
  Installment,
  Institute,
  LeadStatus,
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

export interface RecruiterShortlist {
  id: string;
  recruiterId: string;
  recruiterName: string;
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
