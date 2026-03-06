import { useQuery } from "@tanstack/react-query";
import {
  Users,
  AlertCircle,
  TrendingUp,
  ClipboardList,
  GraduationCap,
  IndianRupee,
  UserCheck,
  UserX,
  BookOpen,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/animations/PageTransition";
import { QueryError } from "@/components/errors/QueryError";
import { DashboardSkeleton } from "@/components/loaders/DashboardSkeleton";

import { adminService } from "@/services/admin.service";
import type { DashboardStats } from "@/services/admin.service";
import { useAuthStore } from "@/store/auth.store";

// ---------------------------------------------------------------------------
// Helper: format currency
// ---------------------------------------------------------------------------
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Stat Card Sub-Component
// ---------------------------------------------------------------------------
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  badge?: { label: string; variant: "success" | "destructive" | "warning" };
}

function StatCard({ title, value, icon, iconBg, badge }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between pt-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`rounded-lg p-2 ${iconBg}`}>{icon}</div>
            {badge && (
              <Badge variant={badge.variant} className="text-[10px]">
                {badge.label}
              </Badge>
            )}
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Course color map
// ---------------------------------------------------------------------------
const COURSE_COLORS: Record<string, { bg: string; text: string; bar: string }> =
  {
    "SAP FICO": {
      bg: "bg-blue-100",
      text: "text-blue-700",
      bar: "bg-blue-500",
    },
    "SAP PP": {
      bg: "bg-orange-100",
      text: "text-orange-700",
      bar: "bg-orange-500",
    },
    "SAP MM": {
      bg: "bg-green-100",
      text: "text-green-700",
      bar: "bg-green-500",
    },
    "SAP SD": {
      bg: "bg-purple-100",
      text: "text-purple-700",
      bar: "bg-purple-500",
    },
    DA: {
      bg: "bg-cyan-100",
      text: "text-cyan-700",
      bar: "bg-cyan-500",
    },
    "Cyber Security": {
      bg: "bg-red-100",
      text: "text-red-700",
      bar: "bg-red-500",
    },
  };

function getCourseColor(course: string) {
  return (
    COURSE_COLORS[course] ?? {
      bg: "bg-gray-100",
      text: "text-gray-700",
      bar: "bg-gray-500",
    }
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Component
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DashboardStats>({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: () => adminService.getDashboardStats(),
  });

  if (isError) {
    return <QueryError error={error} onRetry={() => refetch()} />;
  }

  const placementRate =
    stats && stats.totalPlaced + stats.totalNotPlaced > 0
      ? Math.round(
          (stats.totalPlaced / (stats.totalPlaced + stats.totalNotPlaced)) *
            100,
        )
      : 0;

  const maxCourseCount = stats
    ? Math.max(...stats.courseWiseEnrollments.map((c) => c.count), 1)
    : 1;

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] ?? "Admin"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here's an overview of your institute's performance.
          </p>
        </div>

        {isLoading ? (
          <DashboardSkeleton />
        ) : stats ? (
          <>
            {/* ============================================================ */}
            {/* Primary Stat Cards */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Enrollments"
                value={stats.totalEnrollments.toLocaleString()}
                icon={<Users className="h-5 w-5 text-blue-600" />}
                iconBg="bg-blue-100"
              />
              <StatCard
                title="Fee Collected"
                value={formatCurrency(stats.totalFeeCollected)}
                icon={<IndianRupee className="h-5 w-5 text-green-600" />}
                iconBg="bg-green-100"
              />
              <StatCard
                title="Pending Dues"
                value={formatCurrency(stats.totalPendingDues)}
                icon={<AlertCircle className="h-5 w-5 text-red-600" />}
                iconBg="bg-red-100"
                badge={
                  stats.totalPendingDues > 0
                    ? { label: "Action needed", variant: "destructive" }
                    : undefined
                }
              />
              <StatCard
                title="Total Enquiries"
                value={stats.totalEnquiries.toLocaleString()}
                icon={<ClipboardList className="h-5 w-5 text-amber-600" />}
                iconBg="bg-amber-100"
              />
            </div>

            {/* ============================================================ */}
            {/* Secondary Stat Cards - Placement Focus */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Students Placed"
                value={stats.totalPlaced.toLocaleString()}
                icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
                iconBg="bg-emerald-100"
                badge={{ label: `${placementRate}%`, variant: "success" }}
              />
              <StatCard
                title="Awaiting Placement"
                value={stats.totalNotPlaced.toLocaleString()}
                icon={<UserX className="h-5 w-5 text-orange-600" />}
                iconBg="bg-orange-100"
              />
              <StatCard
                title="Placement Rate"
                value={`${placementRate}%`}
                icon={<TrendingUp className="h-5 w-5 text-indigo-600" />}
                iconBg="bg-indigo-100"
                badge={
                  placementRate >= 70
                    ? { label: "On track", variant: "success" }
                    : placementRate >= 40
                      ? { label: "Needs attention", variant: "warning" }
                      : { label: "Critical", variant: "destructive" }
                }
              />
            </div>

            {/* ============================================================ */}
            {/* Course-wise Enrollment & Enrollment Status Breakdown */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Course-wise Enrollment */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    Course-wise Enrollments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.courseWiseEnrollments.length > 0 ? (
                    stats.courseWiseEnrollments.map((item) => {
                      const color = getCourseColor(item.course);
                      const percentage = Math.round(
                        (item.count / maxCourseCount) * 100,
                      );
                      return (
                        <div key={item.course} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{item.course}</span>
                            <span className="text-muted-foreground">
                              {item.count}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className={`h-2 rounded-full transition-all ${color.bar}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No enrollment data available.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Enrollment Status Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    Enrollment Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.enrollmentStatusBreakdown.map((item) => {
                      const statusColors: Record<
                        string,
                        { bg: string; text: string }
                      > = {
                        NEW: { bg: "bg-blue-100", text: "text-blue-700" },
                        APPROVED: {
                          bg: "bg-green-100",
                          text: "text-green-700",
                        },
                        REJECTED: { bg: "bg-red-100", text: "text-red-700" },
                        ACTIVE: {
                          bg: "bg-emerald-100",
                          text: "text-emerald-700",
                        },
                        COMPLETED: {
                          bg: "bg-indigo-100",
                          text: "text-indigo-700",
                        },
                        DROPOUT: {
                          bg: "bg-orange-100",
                          text: "text-orange-700",
                        },
                      };
                      const color = statusColors[item.status] ?? {
                        bg: "bg-gray-100",
                        text: "text-gray-700",
                      };
                      return (
                        <div
                          key={item.status}
                          className="flex items-center justify-between rounded-lg border px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${color.bg} ${color.text}`}
                            >
                              {item.status.replace("_", " ")}
                            </div>
                          </div>
                          <span className="text-lg font-bold">
                            {item.count.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ============================================================ */}
            {/* Recent Enrollments */}
            {/* ============================================================ */}
            {stats.recentEnrollments.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Recent Enrollments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.recentEnrollments.map((enrollment) => {
                      const courseColor = getCourseColor(enrollment.course);
                      return (
                        <div
                          key={enrollment.id}
                          className="flex items-center justify-between rounded-lg border px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold uppercase">
                              {enrollment.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {enrollment.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {enrollment.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              className={`${courseColor.bg} ${courseColor.text} border-0`}
                            >
                              {enrollment.course}
                            </Badge>
                            <Badge
                              variant={
                                enrollment.enrollment_status === "APPROVED"
                                  ? "success"
                                  : enrollment.enrollment_status === "REJECTED"
                                    ? "destructive"
                                    : "default"
                              }
                            >
                              {enrollment.enrollment_status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </div>
    </PageTransition>
  );
}
