import { ClipboardList, ArrowRightLeft, PlayCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendLineChart } from "../charts/TrendLineChart";
import { DistributionPieChart } from "../charts/DistributionPieChart";
import { PALETTE } from "@/constants/chart-colors";
import type { DashboardData } from "@/types/dashboard.types";

interface EnquirySectionProps {
  data: DashboardData["enquiry"];
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "#3b82f6",
  CONTACTED: "#f97316",
  QUALIFIED: "#22c55e",
  CONVERTED: "#a855f7",
  LOST: "#ef4444",
  PROSPECTIVE: "#3b82f6",
  NON_PROSPECTIVE: "#ef4444",
  ENROLLED: "#22c55e",
};

const DEMO_COLORS: Record<string, string> = {
  PENDING: "#f97316",
  SCHEDULED: "#3b82f6",
  COMPLETED: "#22c55e",
  CANCELLED: "#ef4444",
  DONE: "#22c55e",
};

export function EnquirySection({ data }: EnquirySectionProps) {
  const statusData = data.byStatus.map((s, i) => ({
    name: s.status?.replace("_", " ") ?? "N/A",
    value: s.count,
    color: STATUS_COLORS[s.status] ?? PALETTE[i % PALETTE.length],
  }));

  const demoData = data.demoBreakdown.map((d, i) => ({
    name: d.status?.replace("_", " ") ?? "N/A",
    value: d.count,
    color: DEMO_COLORS[d.status] ?? PALETTE[i % PALETTE.length],
  }));

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-amber-600" />
        Lead / Enquiry Funnel
      </h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-start justify-between pt-5">
            <div className="space-y-1">
              <div className="rounded-lg p-2 bg-amber-100 w-fit">
                <ClipboardList className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Enquiries
              </p>
              <p className="text-2xl font-bold">{data.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between pt-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="rounded-lg p-2 bg-purple-100">
                  <ArrowRightLeft className="h-5 w-5 text-purple-600" />
                </div>
                <Badge
                  variant={data.conversionRate >= 20 ? "success" : data.conversionRate >= 10 ? "warning" : "destructive"}
                  className="text-[10px]"
                >
                  {data.conversionRate >= 20 ? "Good" : data.conversionRate >= 10 ? "Average" : "Low"}
                </Badge>
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Conversion Rate
              </p>
              <p className="text-2xl font-bold">{data.conversionRate}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between pt-5">
            <div className="space-y-1">
              <div className="rounded-lg p-2 bg-cyan-100 w-fit">
                <PlayCircle className="h-5 w-5 text-cyan-600" />
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Demos
              </p>
              <p className="text-sm font-semibold">
                {demoData.map((d) => `${d.name}: ${d.value}`).join(" | ") || "No data"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Enquiry Status</CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionPieChart
              data={statusData}
              colors={statusData.map((d) => d.color)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Demo Status</CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionPieChart
              data={demoData}
              colors={demoData.map((d) => d.color)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Enquiry Trend (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLineChart data={data.trend} color="#f59e0b" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
