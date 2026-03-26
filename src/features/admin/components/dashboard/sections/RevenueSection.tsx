import { IndianRupee, AlertCircle, TrendingUp, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendLineChart } from "../charts/TrendLineChart";
import { ComparisonBarChart } from "../charts/ComparisonBarChart";
import { getChartColor } from "@/constants/chart-colors";
import { formatCurrency } from "@/utils/format";
import type { DashboardData } from "@/types/dashboard.types";

interface RevenueSectionProps {
  data: DashboardData["revenue"];
}

export function RevenueSection({ data }: RevenueSectionProps) {
  const instituteData = data.byInstitute.map((r) => ({
    name: r.institute ?? "N/A",
    value: r.revenue,
  }));

  const courseData = data.byCourse.map((r, i) => ({
    name: r.course ?? "N/A",
    value: r.revenue,
    color: getChartColor(r.course ?? "", i),
  }));

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <IndianRupee className="h-5 w-5 text-green-600" />
        Revenue & Financial Health
      </h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data.totalCollected)}
          icon={<IndianRupee className="h-5 w-5 text-green-600" />}
          iconBg="bg-green-100"
        />
        <StatCard
          title="Pending Dues"
          value={formatCurrency(data.pendingDues)}
          icon={<AlertCircle className="h-5 w-5 text-red-600" />}
          iconBg="bg-red-100"
          badge={
            data.pendingDues > 0
              ? { label: "Action needed", variant: "destructive" as const }
              : undefined
          }
        />
        <StatCard
          title="Avg Fee / Student"
          value={formatCurrency(data.averageFeePerStudent)}
          icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Institutes"
          value={instituteData.map((d) => `${d.name}: ${formatCurrency(d.value)}`).join(" | ") || "N/A"}
          icon={<Building2 className="h-5 w-5 text-purple-600" />}
          iconBg="bg-purple-100"
          small
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue Trend (12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLineChart
              data={data.trend}
              color="#22c55e"
              formatValue={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue by Course</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonBarChart
              data={courseData}
              colors={courseData.map((d) => d.color)}
              formatValue={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// ── Shared StatCard ──────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  badge?: { label: string; variant: "success" | "destructive" | "warning" };
  small?: boolean;
}

function StatCard({ title, value, icon, iconBg, badge, small }: StatCardProps) {
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
          <p className={small ? "text-sm font-semibold" : "text-2xl font-bold"}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
