import { Briefcase, Download, Star, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HorizontalBarChart } from "../charts/HorizontalBarChart";
import { getChartColor } from "@/constants/chart-colors";
import type { DashboardData } from "@/types/dashboard.types";

interface RecruiterSectionProps {
  data: DashboardData["recruiter"];
}

export function RecruiterSection({ data }: RecruiterSectionProps) {
  const courseData = data.inDemandCourses.map((c, i) => ({
    name: c.course,
    value: c.count,
    color: getChartColor(c.course, i),
  }));

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 w-fit">
        <Briefcase className="h-4 w-4" />
        Recruiter Engagement
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-start justify-between pt-3">
            <div className="space-y-1">
              <div className="rounded-lg p-1.5 bg-violet-100 w-fit">
                <Briefcase className="h-4 w-4 text-violet-600" />
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Active Recruiters
              </p>
              <p className="text-xl font-bold">{data.activeRecruiters}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between pt-3">
            <div className="space-y-1">
              <div className="rounded-lg p-1.5 bg-blue-100 w-fit">
                <Download className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                CVs Downloaded
              </p>
              <p className="text-xl font-bold">{data.totalDownloads}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between pt-3">
            <div className="space-y-1">
              <div className="rounded-lg p-1.5 bg-amber-100 w-fit">
                <Star className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Shortlists
              </p>
              <p className="text-xl font-bold">{data.totalShortlists}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between pt-3">
            <div className="space-y-1">
              <div className="rounded-lg p-1.5 bg-emerald-100 w-fit">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Top Course
              </p>
              <p className="text-base font-bold">
                {courseData[0]?.name ?? "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {courseData.length > 0 && (
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">
              Most In-Demand Courses (by shortlists)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart
              data={courseData}
              colors={courseData.map((d) => d.color)}
              height={200}
            />
          </CardContent>
        </Card>
      )}
    </section>
  );
}
