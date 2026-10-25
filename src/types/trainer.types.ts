import type { CompletionStatus, Institute } from "./common.types";

/**
 * A trainer is identified by `id`, never by `name` — two different people can
 * share a name, and that is exactly what the old free-text trainer column could
 * not express. `code` is the short human-facing handle ("pay TRN-011").
 */
export interface Trainer {
  id: string;
  code: string;
  name: string;
  /**
   * Courses the trainer is hired for. A hint that groups the enrollment
   * dropdown, never a restriction — a Java trainer can be assigned React.
   */
  courses: string[];
  /** Only worth filling in to tell two same-named trainers apart. */
  note: string | null;

  /**
   * Record-keeping only — PAN, bank details, standing fee and a free-text
   * comment. Nothing outside the Trainers page reads these. `fees` in
   * particular is NOT the payout figure: what we owe for a given student lives
   * on the payout row (`TrainerPayoutRow.trainingFee`) and is edited there.
   */
  panNumber: string | null;
  beneficiaryName: string | null;
  bankName: string | null;
  ifscCode: string | null;
  accountNumber: string | null;
  /** Free text, e.g. "40% of course fees". null means "not recorded". */
  fees: string | null;
  comment: string | null;

  isActive: boolean;
  createdAt: string;
}

/** The write payload for the record-keeping fields — same shape on create and edit. */
export interface TrainerDetailInput {
  panNumber?: string | null;
  beneficiaryName?: string | null;
  bankName?: string | null;
  ifscCode?: string | null;
  accountNumber?: string | null;
  fees?: string | null;
  comment?: string | null;
}

export interface TrainerWithStats extends Trainer {
  enrollmentCount: number;
  /** Derived from their enrollments — what they are actually teaching. */
  teachingCourses: string[];
}

export type TrainerPaymentStatus =
  | "UNPAID"
  | "PARTIAL"
  | "PAID"
  | "HOLD"
  | "NOT_SET";

/**
 * One row of the payout tracker: one student, the trainer who taught them, and
 * what we owe that trainer for it. Rows are driven by enrollments, so the
 * payout record may not exist yet (`payoutId` is null until first edit).
 */
export interface TrainerPayoutRow {
  /** The enrollment id — the tracker is keyed on enrollments, not payouts. */
  id: string;
  payoutId: string | null;

  // Enrollment side
  enrollmentDate: string | null;
  studentName: string;
  course: string;
  batch: string | null;
  institute: Institute;
  totalFee: number;
  pendingFee: number;
  completionStatus: CompletionStatus;

  // Trainer side
  trainerId: string;
  trainerCode: string;
  trainerName: string;
  trainerCourses: string[];
  trainerNote: string | null;

  // Payout side
  trainingFee: number;
  split1Percent: number;
  split1Fee: number;
  installment1Amount: number | null;
  installment1Date: string | null;
  installment1Tds: number | null;
  installment1Mode: string | null;
  split2Fee: number;
  installment2Amount: number | null;
  installment2Date: string | null;
  installment2Tds: number | null;
  installment2Mode: string | null;
  balanceToPay: number;
  comment: string | null;
  paymentStatus: TrainerPaymentStatus;
  /** True when payment status was set by hand rather than derived. */
  paymentStatusManual: boolean;
}

export interface TrainerPayoutSummary {
  studentCount: number;
  totalTrainingFee: number;
  totalPaid: number;
  totalTds: number;
  totalBalance: number;
}

export interface TrainerPayoutListResult {
  items: TrainerPayoutRow[];
  total: number;
  page: number;
  totalPages: number;
  courses: string[];
  batches: string[];
}

export interface TrainerDetailResult extends TrainerPayoutListResult {
  trainer: Trainer;
  summary: TrainerPayoutSummary;
  teachingCourses: string[];
}

/** Payload for the payout editor. Snake_case to match the enrollment endpoints. */
export interface TrainerPayoutUpdate {
  training_fee?: number;
  split1_percent?: number;
  installment1_amount?: number | null;
  installment1_date?: string | null;
  installment1_tds?: number | null;
  installment1_mode?: string | null;
  installment2_amount?: number | null;
  installment2_date?: string | null;
  installment2_tds?: number | null;
  installment2_mode?: string | null;
  comment?: string | null;
  payment_status?: Exclude<TrainerPaymentStatus, "NOT_SET"> | null;
}

export type PaymentSequence = "BOTH" | "FIRST" | "SECOND";

/**
 * One row of the Trainer Payment Figures report: amounts paid to a trainer,
 * bucketed by the calendar month of the payment.
 */
export interface TrainerPaymentFigureRow {
  trainerId: string;
  trainerCode: string;
  trainerName: string;
  trainerCourses: string[];
  trainerNote: string | null;
  /** Keyed by calendar month number (1-12). Missing months mean nothing paid. */
  monthly: Record<number, number>;
  /** Scoped to the selected financial year and payment sequence. */
  totalPaid: number;
  totalTds: number;
  /** Outstanding across all time — deliberately NOT year-scoped. */
  balanceToPay: number;
}

export interface TrainerPaymentFiguresResult {
  rows: TrainerPaymentFigureRow[];
  courses: string[];
  batches: string[];
}
