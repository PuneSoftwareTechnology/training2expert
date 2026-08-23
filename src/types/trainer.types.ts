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
  isActive: boolean;
  createdAt: string;
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
