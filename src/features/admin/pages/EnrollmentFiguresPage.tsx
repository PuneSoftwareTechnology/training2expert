import { useCallback, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { BarChart3 } from "lucide-react";

import { ROUTES } from "@/constants/routes";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { QueryError } from "@/components/errors/QueryError";
import { PageTransition } from "@/components/animations/PageTransition";
import { FilterActions } from "@/components/ui/filter-actions";

import { adminService } from "@/services/admin.service";
import { COMPLETION_STATUSES, INSTITUTES, MONTHS } from "@/constants/courses";
import type { EnrollmentFigureRow } from "@/types/admin.types";

const INSTITUTE_OPTIONS = ["Combined", ...INSTITUTES] as const;
const COMPLETION_STATUS_OPTIONS = [
  { value: "All", label: "All" },
  ...COMPLETION_STATUSES.filter((s) => s.value !== "IN_PROGRESS"),
] as const;

export default function EnrollmentFiguresPage() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [institute, setInstitute] = useState<string>("Combined");
  const [year, setYear] = useState(currentYear);
  const [completionStatus, setCompletionStatus] = useState<string>("All");

  const drillDown = useCallback(
    (course: string | null, month: string | null) => {
      const params = new URLSearchParams();
      if (institute !== "Combined") params.set("institute", institute);
      if (course && course !== "Total") params.set("course", course);
      if (completionStatus !== "All")
        params.set("completionStatus", completionStatus);
      if (month) {
        const monthIdx = MONTHS.indexOf(month as (typeof MONTHS)[number]);
        const lastDay = new Date(year, monthIdx + 1, 0).getDate();
        const mm = String(monthIdx + 1).padStart(2, "0");
        params.set("fromDate", `${year}-${mm}-01`);
        params.set(
          "toDate",
          `${year}-${mm}-${String(lastDay).padStart(2, "0")}`,
        );
      } else {
        params.set("fromDate", `${year}-01-01`);
        params.set("toDate", `${year}-12-31`);
      }
      navigate(`${ROUTES.ADMIN_ENROLLMENT}?${params.toString()}`);
    },
    [navigate, institute, year, completionStatus],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "admin",
      "reports",
      "enrollment-figures",
      institute,
      year,
      completionStatus,
    ],
    queryFn: () =>
      adminService.getEnrollmentFigures(institute, year, completionStatus),
  });

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const tableData = useMemo(() => {
    if (!data?.length) return [];
    const totalRow: EnrollmentFigureRow = {
      course: "Total",
      monthlyData: {},
      total: 0,
    };
    for (const row of data) {
      totalRow.total += row.total ?? 0;
      for (const month of MONTHS) {
        totalRow.monthlyData[month] =
          (totalRow.monthlyData[month] ?? 0) + (row.monthlyData?.[month] ?? 0);
      }
    }
    return [...data, totalRow];
  }, [data]);

  const columns: ColumnDef<EnrollmentFigureRow>[] = useMemo(
    () => [
      {
        accessorKey: "course",
        header: "Course",
        cell: ({ row, getValue }) => {
          const isTotal = row.original.course === "Total";
          return (
            <span className={isTotal ? "font-bold" : "font-medium"}>
              {getValue<string>()}
            </span>
          );
        },
      },
      ...MONTHS.map(
        (month): ColumnDef<EnrollmentFigureRow> => ({
          id: month,
          header: () => <span className="block text-center">{month}</span>,
          accessorFn: (row) => row.monthlyData?.[month] ?? 0,
          cell: ({ row, getValue }) => {
            const isTotal = row.original.course === "Total";
            const val = getValue<number>();
            if (!val) {
              return <span className="block text-center" />;
            }
            return (
              <button
                type="button"
                onClick={() => drillDown(row.original.course, month)}
                className={`block w-full text-center text-violet-700 hover:underline ${
                  isTotal ? "font-bold" : ""
                }`}
              >
                {val}
              </button>
            );
          },
        }),
      ),
      {
        accessorKey: "total",
        header: () => (
          <span className="block text-center font-bold">Total (YTD)</span>
        ),
        cell: ({ row, getValue }) => {
          const val = getValue<number>();
          if (!val) {
            return <span className="block text-center font-bold">{val}</span>;
          }
          return (
            <button
              type="button"
              onClick={() => drillDown(row.original.course, null)}
              className="block w-full text-center font-bold text-violet-700 hover:underline"
            >
              {val}
            </button>
          );
        },
      },
    ],
    [drillDown],
  );

  if (isError) {
    return <QueryError error={error} onRetry={refetch} />;
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-2.5 shadow-md shadow-violet-200/50">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Enrollment Figures</h2>
              <p className="text-sm text-muted-foreground">
                Monthly enrollment breakdown by course
              </p>
            </div>
          </div>
          <FilterActions
            onReset={() => {
              setInstitute("Combined");
              setYear(currentYear);
              setCompletionStatus("All");
            }}
            onRefresh={() => refetch()}
            isFetching={isLoading}
          />
        </div>

        <div className="flex gap-4 rounded-md border border-violet-200/60 bg-gradient-to-r from-violet-100 to-purple-100 p-4">
          <div className="space-y-1">
            <Label className="text-xs">Institute</Label>
            <Select value={institute} onValueChange={setInstitute}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INSTITUTE_OPTIONS.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Year</Label>
            <Select
              value={String(year)}
              onValueChange={(v) => setYear(Number(v))}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Completion Status</Label>
            <Select
              value={completionStatus}
              onValueChange={setCompletionStatus}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPLETION_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} columns={14} />
        ) : (
          <Card className="border-violet-200/60 overflow-hidden">
            <CardContent className="overflow-x-auto p-0">
              <DataTable
                columns={columns}
                data={tableData}
                pageSize={50}
                emptyMessage="No data available"
                headerClassName="bg-gradient-to-r from-violet-500 to-purple-600"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
