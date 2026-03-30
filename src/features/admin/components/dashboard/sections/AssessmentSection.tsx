import { BookOpen, MessageSquare, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HorizontalBarChart } from "../charts/HorizontalBarChart";
import { getChartColor } from "@/constants/chart-colors";
import type { DashboardData } from "@/types/dashboard.types";

interface AssessmentSectionProps {
  data: DashboardData["assessment"];
}

export function AssessmentSection({ data }: AssessmentSectionProps) {
  const techData = data.technicalScoreByCourse.map((c, i) => ({
    name: c.course,
    value: Number(c.avgTechnicalScore),
    color: getChartColor(c.course, i),
  }));

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 w-fit">
        <BookOpen className="h-4 w-4" />
        Assessments & Quality
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-start justify-between pt-3">
            <div className="space-y-1">
              <div className="rounded-lg p-1.5 bg-cyan-100 w-fit">
                <BookOpen className="h-4 w-4 text-cyan-600" />
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Avg Technical Score
              </p>
              <p className="text-xl font-bold">
                {techData.length > 0
                  ? (
                      techData.reduce((s, d) => s + d.value, 0) / techData.length
                    ).toFixed(1)
                  : "N/A"}
                <span className="text-xs font-normal text-muted-foreground">
                  %
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between pt-3">
            <div className="space-y-1">
              <div className="rounded-lg p-1.5 bg-purple-100 w-fit">
                <MessageSquare className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Avg Communication
              </p>
              <p className="text-xl font-bold">
                {data.avgCommunicationScore}
                <span className="text-xs font-normal text-muted-foreground">
                  {" "}
                  / 10
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between pt-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="rounded-lg p-1.5 bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <Badge
                  variant={
                    data.testCompletionRate >= 70
                      ? "success"
                      : data.testCompletionRate >= 40
                        ? "warning"
                        : "destructive"
                  }
                  className="text-[10px]"
                >
                  {data.testCompletionRate >= 70 ? "Good" : data.testCompletionRate >= 40 ? "Average" : "Low"}
                </Badge>
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Test Completion
              </p>
              <p className="text-xl font-bold">{data.testCompletionRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {techData.length > 0 && (
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">
              Technical Score by Course (avg %)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart
              data={techData}
              colors={techData.map((d) => d.color)}
              height={200}
            />
          </CardContent>
        </Card>
      )}
    </section>
  );
}
