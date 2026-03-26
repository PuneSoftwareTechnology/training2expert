import { UserCheck, UserX, TrendingUp, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComparisonBarChart } from "../charts/ComparisonBarChart";
import { HorizontalBarChart } from "../charts/HorizontalBarChart";
import { getChartColor } from "@/constants/chart-colors";
import type { DashboardData } from "@/types/dashboard.types";

interface PlacementSectionProps {
  data: DashboardData["placement"];
}

export function PlacementSection({ data }: PlacementSectionProps) {
  const courseData = data.byCourse.map((c, i) => ({
    name: c.course,
    value: c.rate,
    color: getChartColor(c.course, i),
  }));

  const companyData = data.topCompanies.map((c) => ({
    name: c.company,
    value: c.count,
  }));

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 w-fit">
        <UserCheck className="h-4 w-4" />
        Placement & Outcomes
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-start justify-between pt-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="rounded-lg p-1.5 bg-emerald-100">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <Badge variant="success" className="text-[10px]">
                  {data.rate}%
                </Badge>
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Students Placed
              </p>
              <p className="text-xl font-bold">{data.placed}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between pt-3">
            <div className="space-y-1">
              <div className="rounded-lg p-1.5 bg-orange-100 w-fit">
                <UserX className="h-4 w-4 text-orange-600" />
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Awaiting Placement
              </p>
              <p className="text-xl font-bold">{data.awaitingPlacement}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between pt-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="rounded-lg p-1.5 bg-indigo-100">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                </div>
                <Badge
                  variant={
                    data.rate >= 70
                      ? "success"
                      : data.rate >= 40
                        ? "warning"
                        : "destructive"
                  }
                  className="text-[10px]"
                >
                  {data.rate >= 70
                    ? "On track"
                    : data.rate >= 40
                      ? "Needs attention"
                      : "Critical"}
                </Badge>
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Placement Rate
              </p>
              <p className="text-xl font-bold">{data.rate}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between pt-3">
            <div className="space-y-1">
              <div className="rounded-lg p-1.5 bg-cyan-100 w-fit">
                <Building className="h-4 w-4 text-cyan-600" />
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Hiring Companies
              </p>
              <p className="text-xl font-bold">{data.topCompanies.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Placement Rate by Course (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonBarChart
              data={courseData}
              colors={courseData.map((d) => d.color)}
              formatValue={(v) => `${v}%`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Top Hiring Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={companyData} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
