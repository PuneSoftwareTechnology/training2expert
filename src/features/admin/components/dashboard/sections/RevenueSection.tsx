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
    <section className="space-y-3">
      <h2 className="text-sm font-semibold flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 w-fit">
        <IndianRupee className="h-4 w-4" />
        Revenue & Financial Health
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data.totalCollected)}
          icon={<IndianRupee className="h-4 w-4 text-green-600" />}
          iconBg="bg-green-100"
        />
        <StatCard
          title="Pending Dues"
          value={formatCurrency(data.pendingDues)}
          icon={<AlertCircle className="h-4 w-4 text-red-600" />}
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
          icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Institutes"
          value={instituteData.map((d) => `${d.name}: ${formatCurrency(d.value)}`).join(" | ") || "N/A"}
          icon={<Building2 className="h-4 w-4 text-purple-600" />}
          iconBg="bg-purple-100"
          small
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Revenue Trend (12 months)</CardTitle>
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
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Revenue by Course</CardTitle>
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
      <CardContent className="flex items-start justify-between pt-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`rounded-lg p-1.5 ${iconBg}`}>{icon}</div>
            {badge && (
              <Badge variant={badge.variant} className="text-[10px]">
                {badge.label}
              </Badge>
            )}
          </div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className={small ? "text-sm font-semibold" : "text-xl font-bold"}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
