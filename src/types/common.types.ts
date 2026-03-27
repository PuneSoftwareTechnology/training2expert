export type EmploymentStatus = "WORKING" | "NON_WORKING" | "FRESHER";
export type CompletionStatus = "ACTIVE" | "DROPOUT" | "COMPLETED";
export type EnrollmentStatus = "NEW" | "APPROVED" | "REJECTED";
export type LeadStatus = "PROSPECTIVE" | "NON_PROSPECTIVE" | "ENROLLED";
export type DemoStatus = "DONE" | "PENDING";
export type PaymentMode = "CASH" | "UPI";
export type PlacementStatus = "PLACED" | "NOT_PLACED";
export type Institute = "PST" | "TCH";
export type ApprovalState = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface Installment {
  id: string;
  installment_number: number;
  amount: number;
  payment_date: string;
  mode: PaymentMode;
  receipt_url?: string;
}

export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex?: number;
  correctAnswer?: string;
  marks: number;
}

export interface Test {
  id: string;
  title: string;
  description?: string;
  course: string;
  durationMinutes: number;
  endTime?: string;
  totalMarks: number;
  isActive: boolean;
  isPublished: boolean;
  questionCount?: number;
  questions: TestQuestion[];
  createdAt: string;
}
