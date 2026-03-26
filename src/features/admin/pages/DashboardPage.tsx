import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { PageTransition } from "@/components/animations/PageTransition";
import { QueryError } from "@/components/errors/QueryError";
import { DashboardSkeleton } from "@/components/loaders/DashboardSkeleton";

import { adminService } from "@/services/admin.service";
import { useAuthStore } from "@/store/auth.store";

import { PeriodSelector } from "../components/dashboard/PeriodSelector";
import { RevenueSection } from "../components/dashboard/sections/RevenueSection";
import { EnrollmentSection } from "../components/dashboard/sections/EnrollmentSection";
import { EnquirySection } from "../components/dashboard/sections/EnquirySection";
import { PlacementSection } from "../components/dashboard/sections/PlacementSection";
import { RecruiterSection } from "../components/dashboard/sections/RecruiterSection";
import { AssessmentSection } from "../components/dashboard/sections/AssessmentSection";

import type { DashboardData, DashboardPeriod } from "@/types/dashboard.types";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const queryParams = useMemo(() => {
    if (period === "custom" && startDate && endDate) {
      return { period, startDate, endDate };
    }
    return { period };
  }, [period, startDate, endDate]);

  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DashboardData>({
    queryKey: ["admin", "dashboard", "stats", queryParams],
    queryFn: () => adminService.getDashboardStats(queryParams),
    staleTime: 30_000,
  });

  if (isError) {
    return <QueryError error={error} onRetry={() => refetch()} />;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {user?.name?.split(" ")[0] ?? "Admin"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Here's an overview of your institute's performance.
            </p>
          </div>
          <PeriodSelector
            period={period}
            onPeriodChange={setPeriod}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>

        {isLoading ? (
          <DashboardSkeleton />
        ) : stats ? (
          <>
            <RevenueSection data={stats.revenue} />
            <hr className="border-border" />
            <EnrollmentSection data={stats.enrollment} />
            <hr className="border-border" />
            <EnquirySection data={stats.enquiry} />
            <hr className="border-border" />
            <PlacementSection data={stats.placement} />
            <hr className="border-border" />
            <RecruiterSection data={stats.recruiter} />
            <hr className="border-border" />
            <AssessmentSection data={stats.assessment} />
          </>
        ) : null}
      </div>
    </PageTransition>
  );
}
