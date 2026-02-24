export const COURSES = [
  'SAP FICO',
  'SAP PP',
  'SAP MM',
  'SAP SD',
  'DA',
  'Cyber Security',
] as const;

export type Course = (typeof COURSES)[number];

export const INSTITUTES = ['PST', 'TCH'] as const;
export type InstituteName = (typeof INSTITUTES)[number];

export const EMPLOYMENT_STATUSES = [
  { value: 'WORKING', label: 'Working' },
  { value: 'NON_WORKING', label: 'Non-Working' },
  { value: 'FRESHER', label: 'Fresher' },
] as const;

export const COMPLETION_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DROPOUT', label: 'Dropout' },
  { value: 'COMPLETED', label: 'Completed' },
] as const;

export const LEAD_STATUSES = [
  { value: 'PROSPECTIVE', label: 'Prospective' },
  { value: 'NON_PROSPECTIVE', label: 'Non-Prospective' },
  { value: 'ENROLLED', label: 'Enrolled' },
] as const;

export const DEMO_STATUSES = [
  { value: 'DONE', label: 'Done' },
  { value: 'PENDING', label: 'Pending' },
] as const;

export const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
] as const;

export const ENROLLMENT_STATUSES = [
  { value: 'NEW', label: 'New' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
] as const;

export const PLACEMENT_STATUSES = [
  { value: 'PLACED', label: 'Placed' },
  { value: 'NOT_PLACED', label: 'Not Placed' },
] as const;

export const FEE_DUE_FILTERS = [
  { value: 30, label: '> 30 days' },
  { value: 60, label: '> 60 days' },
  { value: 90, label: '> 90 days' },
] as const;

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export const LEAD_BADGE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  PROSPECTIVE: 'default',
  ENROLLED: 'outline',
};

export const RECRUITER_DOWNLOAD_LIMIT = 100;
