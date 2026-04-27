import {
  Settings,
  Info,
  BookOpen,
  CreditCard,
  GraduationCap,
  Briefcase,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Column group definitions (Row 1 headers)
// ---------------------------------------------------------------------------

export const COLUMN_GROUPS = [
  {
    label: "Actions",
    icon: Settings,
    colSpan: 2,
    color: "text-gray-600 bg-gray-50 border-gray-200",
  },
  {
    label: "Basic Info",
    icon: Info,
    colSpan: 6,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    label: "Course Details",
    icon: BookOpen,
    colSpan: 6,
    color: "text-orange-600 bg-orange-50 border-orange-200",
  },
  {
    label: "Payment Tracking",
    icon: CreditCard,
    colSpan: 17,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
  },
  {
    label: "Certificate",
    icon: GraduationCap,
    colSpan: 1,
    color: "text-teal-600 bg-teal-50 border-teal-200",
  },
  {
    label: "Placement",
    icon: Briefcase,
    colSpan: 2,
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
] as const;

// Total columns: 1 (S.No) + 2 + 1 (Full Name, standalone) + 6 + 6 + 17 + 1 + 2 = 36

// ---------------------------------------------------------------------------
// Sub-column definitions (Row 2 headers)
// ---------------------------------------------------------------------------

export const SUB_COLUMNS: { label: string; bg: string; extra?: string }[] = [
  // Actions (2)
  { label: "Edit", bg: "bg-gray-50/50", extra: "border-l border-border text-center" },
  { label: "Delete", bg: "bg-gray-50/50", extra: "border-r border-border text-center" },
  // Basic Info (6) — Full Name is rendered as a standalone sticky column
  { label: "Email", bg: "bg-blue-50/50", extra: "border-l border-border" },
  { label: "Phone", bg: "bg-blue-50/50" },
  { label: "Status", bg: "bg-blue-50/50" },
  { label: "Institute", bg: "bg-blue-50/50" },
  { label: "Profile", bg: "bg-blue-50/50", extra: "text-center" },
  { label: "Evaluation", bg: "bg-blue-50/50", extra: "border-r border-border text-center" },
  // Course Details (6)
  { label: "Course Name", bg: "bg-orange-50/50", extra: "border-l border-border" },
  { label: "Batch Name", bg: "bg-orange-50/50" },
  { label: "Trainer", bg: "bg-orange-50/50" },
  { label: "Start Date", bg: "bg-orange-50/50" },
  { label: "End Date", bg: "bg-orange-50/50" },
  { label: "Completion", bg: "bg-orange-50/50", extra: "border-r border-border" },
  // Payment Tracking (17)
  { label: "Total Fee", bg: "bg-indigo-50/50", extra: "border-l border-border" },
  { label: "1st Amt", bg: "bg-indigo-50/30" },
  { label: "1st Date", bg: "bg-indigo-50/30" },
  { label: "1st Mode", bg: "bg-indigo-50/30" },
  { label: "View", bg: "bg-indigo-50/30" },
  { label: "Send", bg: "bg-indigo-50/30" },
  { label: "2nd Amt", bg: "bg-indigo-50/50" },
  { label: "2nd Date", bg: "bg-indigo-50/50" },
  { label: "2nd Mode", bg: "bg-indigo-50/50" },
  { label: "View", bg: "bg-indigo-50/50" },
  { label: "Send", bg: "bg-indigo-50/50" },
  { label: "3rd Amt", bg: "bg-indigo-50/30" },
  { label: "3rd Date", bg: "bg-indigo-50/30" },
  { label: "3rd Mode", bg: "bg-indigo-50/30" },
  { label: "View", bg: "bg-indigo-50/30" },
  { label: "Send", bg: "bg-indigo-50/30" },
  { label: "Pending", bg: "bg-indigo-50/50", extra: "border-r border-border text-destructive font-semibold" },
  // Certificate (1) — single cell opens a dialog with View / Download / Send
  { label: "Actions", bg: "bg-teal-50/50", extra: "border-x border-border text-center" },
  // Placement (2)
  { label: "Status", bg: "bg-purple-50/50", extra: "border-l border-border" },
  { label: "Company", bg: "bg-purple-50/50", extra: "border-r border-border" },
];
