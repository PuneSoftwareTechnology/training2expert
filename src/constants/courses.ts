export const INSTITUTES = ["TECHVAA", "TCH"] as const;
export type InstituteName = (typeof INSTITUTES)[number];

export const EMPLOYMENT_STATUSES = [
  { value: "WORKING", label: "Working" },
  { value: "NON_WORKING", label: "Non-Working" },
  { value: "FRESHER", label: "Fresher" },
] as const;

export const COMPLETION_STATUSES = [
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "ACTIVE", label: "Active" },
  { value: "DROPOUT", label: "Dropout" },
  { value: "COMPLETED", label: "Completed" },
] as const;

export const LEAD_STATUSES = [
  // Every enquiry starts as New; staff move it on after speaking to the lead.
  { value: "NEW", label: "New" },
  { value: "PROSPECTIVE", label: "Prospective" },
  { value: "NON_PROSPECTIVE", label: "Non-Prospective" },
  { value: "ENROLLED", label: "Enrolled" },
] as const;

// Master course lists are kept separately per module — the enrollment list can
// use different course names from the enquiry list.
export const COURSE_TYPES = [
  { value: "ENQUIRY", label: "Enquiry" },
  { value: "ENROLLMENT", label: "Enrollment" },
] as const;

export const ENQUIRY_TYPES = [
  { value: "WALKIN", label: "Walk-in" },
  { value: "PHONE", label: "Phone" },
  { value: "WEBSITE", label: "Website" },
] as const;

// Website enquiries are created automatically by the public site, so only
// these are offered when an admin adds an enquiry by hand.
export const MANUAL_ENQUIRY_TYPES = ENQUIRY_TYPES.filter(
  (t) => t.value !== "WEBSITE",
);

export const DEMO_STATUSES = [
  { value: "DONE", label: "Done" },
  { value: "PENDING", label: "Not done" },
] as const;

export const PAYMENT_MODES = [
  { value: "CASH", label: "Cash" },
  { value: "HDFC", label: "HDFC" },
  { value: "ICICI", label: "ICICI" },
] as const;

export const ENROLLMENT_STATUSES = [
  { value: "NEW", label: "New" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
] as const;

export const PLACEMENT_STATUSES = [
  { value: "PLACED", label: "Placed" },
  { value: "NOT_PLACED", label: "Not Placed" },
] as const;

export const FEE_DUE_FILTERS = [
  { value: "lt30", label: "< 30 days", min: 0, max: 30 },
  { value: "30-60", label: "31-60 days", min: 31, max: 60 },
  { value: "60-90", label: "61-90 days", min: 61, max: 90 },
  { value: "gt90", label: "> 90 days", min: 91, max: Number.POSITIVE_INFINITY },
] as const;

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const LEAD_BADGE_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline"
> = {
  PROSPECTIVE: "default",
  ENROLLED: "outline",
};

export const RECRUITER_DOWNLOAD_LIMIT = 100;
