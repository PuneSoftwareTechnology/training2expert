export interface TrendPoint {
  label: string;
  value: number;
}

export interface CourseMetric {
  course: string;
  count: number;
}

export interface RevenueByGroup {
  course?: string;
  institute?: string;
  revenue: number;
}

export interface PlacementByCourse {
  course: string;
  rate: number;
  placed: number;
  total: number;
}

export interface TopCompany {
  company: string;
  count: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface TechScoreByCourse {
  course: string;
  avgTechnicalScore: number;
}

export interface TrainerPayoutByTrainer {
  trainer: string;
  payable: number;
  settled: number;
  balance: number;
}

export interface DashboardData {
  revenue: {
    totalCollected: number;
    pendingDues: number;
    byCourse: RevenueByGroup[];
    byInstitute: RevenueByGroup[];
    trend: TrendPoint[];
    averageFeePerStudent: number;
  };
  enrollment: {
    totalActive: number;
    newThisMonth: number;
    newLastMonth: number;
    trend: TrendPoint[];
    byCourse: CourseMetric[];
    byInstitute: { institute: string; count: number }[];
    dropoutRate: number;
    completionRate: number;
    statusBreakdown: StatusBreakdown[];
  };
  enquiry: {
    total: number;
    conversionRate: number;
    byStatus: StatusBreakdown[];
    demoBreakdown: StatusBreakdown[];
    trend: TrendPoint[];
  };
  placement: {
    placed: number;
    notPlaced: number;
    rate: number;
    byCourse: PlacementByCourse[];
    awaitingPlacement: number;
    topCompanies: TopCompany[];
  };
  recruiter: {
    activeRecruiters: number;
    totalDownloads: number;
    totalShortlists: number;
    inDemandCourses: CourseMetric[];
  };
  assessment: {
    technicalScoreByCourse: TechScoreByCourse[];
    avgCommunicationScore: number;
    testCompletionRate: number;
  };
  /**
   * What we owe trainers. Present only for super admins — the backend omits the
   * key entirely for other roles, so the section is absent rather than zeroed.
   */
  trainerPayout?: {
    trackedStudents: number;
    trainerCount: number;
    totalPayable: number;
    /** Paid within the selected period, like revenue collected. */
    totalPaid: number;
    totalTds: number;
    /** Outstanding overall, like pending dues — not period-scoped. */
    totalBalance: number;
    /** Rows with no training fee entered yet. */
    feeNotSet: number;
    byTrainer: TrainerPayoutByTrainer[];
  };
}

export type DashboardPeriod = "month" | "quarter" | "year" | "all" | "custom";
