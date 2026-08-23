import {
  Settings,
  Info,
  IndianRupee,
  UserCog,
  Wallet,
  Calculator,
} from "lucide-react";

/**
 * Column layout for the trainer payout tracker, mirroring the grouped two-row
 * header used by the enrollment table (see constants/enrollment-table.ts).
 *
 * Reading left to right: who the student is, what they owe us, who taught them,
 * then the two trainer payments and what is left to pay.
 */

export const COLUMN_GROUPS = [
  {
    label: "Actions",
    icon: Settings,
    colSpan: 2,
    color: "text-gray-600 bg-gray-50 border-gray-200",
  },
  {
    label: "Enrollment",
    icon: Info,
    colSpan: 5,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    label: "Student Fees",
    icon: IndianRupee,
    colSpan: 2,
    color: "text-rose-600 bg-rose-50 border-rose-200",
  },
  {
    label: "Trainer",
    icon: UserCog,
    colSpan: 2,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    label: "1st Payment",
    icon: Wallet,
    colSpan: 4,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
  },
  {
    label: "2nd Payment",
    icon: Wallet,
    colSpan: 4,
    color: "text-violet-600 bg-violet-50 border-violet-200",
  },
  {
    label: "Summary",
    icon: Calculator,
    colSpan: 3,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
] as const;

// S.No and Student Name are standalone sticky columns rendered outside the
// groups, so SUB_COLUMNS holds 21 entries and the table is 23 columns wide.
// 1 (S.No) + 1 (Student Name) + 2 + 5 + 2 + 2 + 4 + 4 + 3 = 24
export const TOTAL_COLUMNS = 24;

export const SUB_COLUMNS: { label: string; bg: string; extra?: string }[] = [
  // Actions (2)
  { label: "Edit", bg: "bg-gray-50/50", extra: "border-l border-border text-center" },
  { label: "Clear", bg: "bg-gray-50/50", extra: "border-r border-border text-center" },
  // Enrollment (5) — Student Name is a standalone sticky column
  { label: "Enrolled On", bg: "bg-blue-50/50", extra: "border-l border-border" },
  { label: "Course", bg: "bg-blue-50/50" },
  { label: "Batch", bg: "bg-blue-50/50" },
  { label: "Institute", bg: "bg-blue-50/50" },
  { label: "Completion", bg: "bg-blue-50/50", extra: "border-r border-border" },
  // Student Fees (2)
  { label: "Total Fees", bg: "bg-rose-50/50", extra: "border-l border-border text-right" },
  { label: "Pending Fees", bg: "bg-rose-50/50", extra: "border-r border-border text-right" },
  // Trainer (2)
  { label: "Trainer Name", bg: "bg-amber-50/50", extra: "border-l border-border" },
  { label: "Training Fees", bg: "bg-amber-50/50", extra: "border-r border-border text-right" },
  // 1st Payment (4)
  { label: "1st Share", bg: "bg-indigo-50/30", extra: "border-l border-border text-right" },
  { label: "Amount Paid", bg: "bg-indigo-50/30", extra: "text-right" },
  { label: "Payment Date", bg: "bg-indigo-50/30" },
  { label: "TDS Deducted", bg: "bg-indigo-50/30", extra: "border-r border-border text-right" },
  // 2nd Payment (4)
  { label: "2nd Share", bg: "bg-violet-50/30", extra: "border-l border-border text-right" },
  { label: "Amount Paid", bg: "bg-violet-50/30", extra: "text-right" },
  { label: "Payment Date", bg: "bg-violet-50/30" },
  { label: "TDS Deducted", bg: "bg-violet-50/30", extra: "border-r border-border text-right" },
  // Summary (3)
  {
    label: "Balance to Pay",
    bg: "bg-emerald-50/50",
    extra: "border-l border-border text-right font-semibold",
  },
  { label: "Payment Status", bg: "bg-emerald-50/50" },
  { label: "Comment", bg: "bg-emerald-50/50", extra: "border-r border-border" },
];

/**
 * TDS on professional fees (s.194J) — used only to pre-fill the TDS input when
 * an amount is entered. What gets stored is always the explicit rupee figure the
 * user leaves in the box, never a rate, so an override survives.
 */
export const DEFAULT_TDS_PERCENT = 10;

/** Default share of the training fee paid in the first instalment. */
export const DEFAULT_SPLIT1_PERCENT = 50;

export const TRAINER_PAYMENT_STATUSES = [
  { value: "UNPAID", label: "Unpaid" },
  { value: "PARTIAL", label: "Partially Paid" },
  { value: "PAID", label: "Fully Paid" },
  { value: "HOLD", label: "On Hold" },
] as const;

/** NOT_SET is derived only — it means no training fee has been entered yet. */
export const TRAINER_PAYMENT_STATUS_FILTERS = [
  ...TRAINER_PAYMENT_STATUSES,
  { value: "NOT_SET", label: "Fee Not Set" },
] as const;

export const TRAINER_PAYMENT_STATUS_LABELS: Record<string, string> =
  Object.fromEntries(
    TRAINER_PAYMENT_STATUS_FILTERS.map((s) => [s.value, s.label]),
  );

export const TRAINER_PAYOUT_MODES = [
  { value: "BANK", label: "Bank Transfer" },
  { value: "UPI", label: "UPI" },
  { value: "CASH", label: "Cash" },
] as const;
