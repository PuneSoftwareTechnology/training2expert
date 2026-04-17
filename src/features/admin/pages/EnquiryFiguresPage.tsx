import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { BarChart3 } from "lucide-react";

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
import { INSTITUTES, MONTHS } from "@/constants/courses";
import type { EnrollmentFigureRow } from "@/types/admin.types";

const INSTITUTE_OPTIONS = ["Combined", ...INSTITUTES] as const;

export default function EnquiryFiguresPage() {
  const currentYear = new Date().getFullYear();
  const [institute, setInstitute] = useState<string>("Combined");
  const [year, setYear] = useState(currentYear);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "reports", "enquiry-figures", institute, year],
    queryFn: () => adminService.getEnquiryFigures(institute, year),
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
            return (
              <span
                className={`block text-center ${isTotal ? "font-bold" : ""}`}
              >
                {val || ""}
              </span>
            );
          },
        }),
      ),
      {
        accessorKey: "total",
        header: () => (
          <span className="block text-center font-bold">Total (YTD)</span>
        ),
        cell: ({ getValue }) => (
          <span className="block text-center font-bold">
            {getValue<number>()}
          </span>
        ),
      },
    ],
    [],
  );

  if (isError) {
    return <QueryError error={error} onRetry={refetch} />;
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 shadow-md shadow-amber-200/50">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Enquiry Figures</h2>
              <p className="text-sm text-muted-foreground">
                Monthly enquiry breakdown by course
              </p>
            </div>
          </div>
          <FilterActions
            onReset={() => {
              setInstitute("Combined");
              setYear(currentYear);
            }}
            onRefresh={() => refetch()}
            isFetching={isLoading}
          />
        </div>

        <div className="flex gap-4 rounded-md border border-amber-200/60 bg-gradient-to-r from-amber-100 to-orange-100 p-4">
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
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} columns={14} />
        ) : (
          <Card className="border-amber-200/60 overflow-hidden">
            <CardContent className="overflow-x-auto p-0">
              <DataTable
                columns={columns}
                data={tableData}
                pageSize={50}
                emptyMessage="No data available"
                headerClassName="bg-gradient-to-r from-amber-500 to-orange-600"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
