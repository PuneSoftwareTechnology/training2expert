import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Users, IndianRupee, Download, Search, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { QueryError } from "@/components/errors/QueryError";
import { PageTransition } from "@/components/animations/PageTransition";
import { FilterActions } from "@/components/ui/filter-actions";

import { adminService } from "@/services/admin.service";
import { formatCurrency } from "@/utils/format";
import { FEE_DUE_FILTERS } from "@/constants/courses";
import { cn } from "@/lib/utils";

import type { FeeDueRow } from "@/types/admin.types";

const columns: ColumnDef<FeeDueRow>[] = [
  {
    id: "sno",
    header: "S.No",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.index + 1}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "completionStatus",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue<string>();
      const variant =
        status === "COMPLETED"
          ? ("success" as const)
          : status === "ACTIVE"
            ? ("default" as const)
            : status === "DROPOUT"
              ? ("destructive" as const)
              : ("warning" as const);
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column} title="Candidate" />
    ),
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "institute",
    header: "Institute",
    cell: ({ getValue }) => (
      <Badge variant="outline" className="font-medium">
        {getValue<string>()}
      </Badge>
    ),
  },
  { accessorKey: "course", header: "Course" },
  { accessorKey: "phone", header: "Phone No" },
  {
    accessorKey: "totalFee",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader column={column} title="Total Fees" />
      </div>
    ),
    cell: ({ getValue }) => (
      <span className="block text-right">
        {formatCurrency(getValue<number>())}
      </span>
    ),
  },
  {
    accessorKey: "paidAmount",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader column={column} title="Paid Amt" />
      </div>
    ),
    cell: ({ getValue }) => (
      <span className="block text-right text-green-600 font-medium">
        {formatCurrency(Number(getValue<number>()))}
      </span>
    ),
  },
  {
    accessorKey: "pendingAmount",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader column={column} title="Pending Amt" />
      </div>
    ),
    cell: ({ getValue }) => (
      <span className="block text-right font-semibold text-destructive">
        {formatCurrency(Number(getValue<number>()))}
      </span>
    ),
  },
  {
    accessorKey: "daysSinceLastPayment",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader column={column} title="No of Days" />
      </div>
    ),
    cell: ({ getValue }) => {
      const days = getValue<number>();
      return (
        <span
          className={cn(
            "block text-right font-semibold",
            days > 90
              ? "text-destructive"
              : days > 60
                ? "text-orange-600"
                : days > 30
                  ? "text-yellow-600"
                  : "text-muted-foreground",
          )}
        >
          {days}
        </span>
      );
    },
  },
];

export default function FeeDuesPage() {
  const [daysFilter, setDaysFilter] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "reports", "fee-dues"],
    queryFn: () => adminService.getFeeDuesReport({ limit: 100 }),
  });

  const allRows = data?.items ?? [];

  const filteredData = useMemo(() => {
    if (!allRows.length) return [];
    let rows = allRows;
    if (daysFilter !== null) {
      rows = rows.filter((r) => r.daysSinceLastPayment >= daysFilter);
    }
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(term));
    }
    return rows;
  }, [allRows, daysFilter, search]);

  const summary = useMemo(() => {
    if (filteredData.length === 0) return { count: 0, totalPending: 0 };
    const totalPending = filteredData.reduce(
      (sum, r) => sum + Number(r.pendingAmount),
      0,
    );
    return { count: filteredData.length, totalPending };
  }, [filteredData]);

  const downloadCsv = () => {
    if (filteredData.length === 0) return;
    const headers = [
      "Status",
      "Candidate",
      "Institute",
      "Course",
      "Phone No",
      "Total Fees",
      "Paid Amt",
      "Pending Amt",
      "No of Days",
    ];
    const rows = filteredData.map((r) => [
      r.completionStatus,
      r.name,
      r.institute,
      r.course,
      r.phone,
      Number(r.totalFee),
      Number(r.paidAmount),
      Number(r.pendingAmount),
      r.daysSinceLastPayment,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fee-dues-report${daysFilter ? `-${daysFilter}days` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isError) {
    return <QueryError error={error} onRetry={refetch} />;
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-rose-500 to-red-600 p-2.5 shadow-md shadow-rose-200/50">
              <IndianRupee className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Fee Dues Report
              </h2>
              <p className="text-sm text-muted-foreground">
                Students with pending fee payments.
              </p>
            </div>
          </div>
          <FilterActions
            onReset={() => {
              setDaysFilter(null);
              setSearch("");
            }}
            onRefresh={() => refetch()}
            isFetching={isLoading}
          />
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-md border border-rose-200/60 bg-gradient-to-r from-rose-100 to-red-100 p-4">
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <Button
                variant={daysFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setDaysFilter(null)}
              >
                All
              </Button>
              {FEE_DUE_FILTERS.map((filter) => (
                <Button
                  key={filter.value}
                  variant={daysFilter === filter.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDaysFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
            <div className="relative ml-2">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search person column..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-56 pl-8 bg-white"
              />
            </div>
          </div>
          {!isLoading && data && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-md bg-blue-200 px-3 py-1.5">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Students:</span>
                <span className="text-sm font-semibold">{summary.count}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md bg-red-100 px-3 py-1.5">
                <IndianRupee className="h-4 w-4 text-red-600" />
                <span className="text-sm text-muted-foreground">Pending:</span>
                <span className="text-sm font-semibold text-destructive">
                  {formatCurrency(summary.totalPending)}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCsv}
                disabled={filteredData.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} columns={10} />
        ) : (
          <Card className="border-rose-200/60 overflow-hidden">
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={filteredData}
                pageSize={filteredData.length || 10}
                emptyMessage="No fee dues found."
                headerClassName="bg-gradient-to-r from-rose-500 to-red-600"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
