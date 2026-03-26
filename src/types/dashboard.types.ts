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
}

export type DashboardPeriod = "month" | "quarter" | "year" | "all" | "custom";
