import {
  User,
  CreditCard,
  BarChart3,
  FileUp,
  GraduationCap,
  Wallet,
  Award,
  FolderUp,
} from "lucide-react";

export const ROLES = {
  STUDENT: "STUDENT",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  RECRUITER: "RECRUITER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export function isValidRole(role: string): role is Role {
  return Object.values(ROLES).includes(role as Role);
}
export const SIDEBAR_ITEMS = [
  {
    id: "profile",
    label: "Profile",
    icon: User,
    mobileIcon: GraduationCap,
    color: "from-blue-500 to-indigo-600",
    activeColor: "text-blue-600 dark:text-blue-400",
    activeBg: "bg-blue-500/10",
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
  },
  {
    id: "payment",
    label: "Payment",
    icon: CreditCard,
    mobileIcon: Wallet,
    color: "from-emerald-500 to-teal-600",
    activeColor: "text-emerald-600 dark:text-emerald-400",
    activeBg: "bg-emerald-500/10",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
  },
  {
    id: "evaluation",
    label: "Evaluation",
    icon: BarChart3,
    mobileIcon: Award,
    color: "from-violet-500 to-purple-600",
    activeColor: "text-violet-600 dark:text-violet-400",
    activeBg: "bg-violet-500/10",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
  },
  {
    id: "cv",
    label: "Upload CV",
    icon: FileUp,
    mobileIcon: FolderUp,
    color: "from-orange-500 to-rose-600",
    activeColor: "text-orange-600 dark:text-orange-400",
    activeBg: "bg-orange-500/10",
    iconBg: "bg-gradient-to-br from-orange-500 to-rose-600",
  },
];
