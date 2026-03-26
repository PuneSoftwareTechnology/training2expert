import { Users, TrendingUp, TrendingDown, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendLineChart } from "../charts/TrendLineChart";
import { DistributionPieChart } from "../charts/DistributionPieChart";
import { getChartColor } from "@/constants/chart-colors";
import type { DashboardData } from "@/types/dashboard.types";

interface EnrollmentSectionProps {
  data: DashboardData["enrollment"];
}

export function EnrollmentSection({ data }: EnrollmentSectionProps) {
  const growthPercent =
    data.newLastMonth > 0
      ? Math.round(
          ((data.newThisMonth - data.newLastMonth) / data.newLastMonth) * 100,
        )
      : data.newThisMonth > 0
        ? 100
        : 0;

  const courseChartData = data.byCourse.map((c, i) => ({
    name: c.course,
    value: c.count,
    color: getChartColor(c.course, i),
  }));

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 w-fit">
        <GraduationCap className="h-4 w-4" />
        Enrollment & Growth
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-start justify-between pt-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="rounded-lg p-1.5 bg-blue-100">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Active Enrollments
              </p>
              <p className="text-xl font-bold">{data.totalActive}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between pt-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="rounded-lg p-1.5 bg-emerald-100">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <Badge
                  variant={growthPercent >= 0 ? "success" : "destructive"}
                  className="text-[10px]"
                >
                  {growthPercent >= 0 ? "+" : ""}
                  {growthPercent}%
                </Badge>
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                New This Month
              </p>
              <p className="text-xl font-bold">
                {data.newThisMonth}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  vs {data.newLastMonth} last month
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between pt-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="rounded-lg p-1.5 bg-indigo-100">
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                </div>
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Completion Rate
              </p>
              <p className="text-xl font-bold">{data.completionRate}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between pt-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="rounded-lg p-1.5 bg-orange-100">
                  <TrendingDown className="h-4 w-4 text-orange-600" />
                </div>
                {data.dropoutRate > 10 && (
                  <Badge variant="destructive" className="text-[10px]">
                    High
                  </Badge>
                )}
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Dropout Rate
              </p>
              <p className="text-xl font-bold">{data.dropoutRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Enrollment Trend (12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLineChart data={data.trend} color="#3b82f6" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Course Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionPieChart
              data={courseChartData}
              colors={courseChartData.map((d) => d.color)}
            />
          </CardContent>
        </Card>
      </div>

      {data.statusBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Enrollment Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {data.statusBreakdown.map((item) => {
                const statusColors: Record<string, string> = {
                  NEW: "bg-blue-100 text-blue-700",
                  APPROVED: "bg-green-100 text-green-700",
                  REJECTED: "bg-red-100 text-red-700",
                  ACTIVE: "bg-emerald-100 text-emerald-700",
                  COMPLETED: "bg-indigo-100 text-indigo-700",
                  DROPOUT: "bg-orange-100 text-orange-700",
                  IN_PROGRESS: "bg-cyan-100 text-cyan-700",
                };
                const colorClass = statusColors[item.status] ?? "bg-gray-100 text-gray-700";
                return (
                  <div
                    key={item.status}
                    className="flex flex-col items-center rounded-lg border p-2 text-center"
                  >
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${colorClass}`}>
                      {item.status.replace("_", " ")}
                    </span>
                    <span className="mt-1 text-lg font-bold">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
