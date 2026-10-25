import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Wallet, X } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { QueryError } from "@/components/errors/QueryError";
import { PageTransition } from "@/components/animations/PageTransition";
import { FilterActions } from "@/components/ui/filter-actions";

import { trainerService } from "@/services/trainer.service";
import { getErrorMessage } from "@/services/api";
import { useTrainerOptions } from "@/hooks/useTrainerOptions";
import { buildTrainerLabels } from "@/utils/trainer";
import { formatDate } from "@/utils/format";
import { COMPLETION_STATUSES, INSTITUTES } from "@/constants/courses";
import {
  COLUMN_GROUPS,
  SUB_COLUMNS,
  TOTAL_COLUMNS,
  TRAINER_PAYMENT_STATUS_FILTERS,
  TRAINER_PAYMENT_STATUS_LABELS,
  TRAINER_PAYOUT_MODE_LABELS,
} from "@/constants/trainer-payment-table";
import type {
  TrainerPayoutRow as Row,
  TrainerPayoutUpdate,
} from "@/types/trainer.types";

import { TrainerPayoutRow } from "../components/TrainerPayoutRow";
import { EditTrainerPayoutDialog } from "../components/EditTrainerPayoutDialog";

const ALL = "ALL";

function exportPayoutsCsv(rows: Row[], labels: Map<string, string>) {
  // Column order matches the on-screen table so an exported sheet reads the same.
  const headers = [
    "S.No",
    "Date of Enrollment",
    "Student Name",
    "Course",
    "Batch Name",
    "Institute",
    "Total Fees",
    "Pending Fees",
    "Completion Status",
    "Trainer Name",
    "Trainer Code",
    "Training Fees",
    "1st Share",
    "1st Amount Paid",
    "1st Payment Date",
    "1st TDS Deducted",
    "1st Mode",
    "2nd Share",
    "2nd Amount Paid",
    "2nd Payment Date",
    "2nd TDS Deducted",
    "2nd Mode",
    "Balance to Pay",
    "Payment Status",
    "Comment",
  ];

  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const money = (v: number | null) => (v == null ? "" : Number(v));
  const date = (v: string | null) => (v ? formatDate(v) : "");

  const body = rows.map((r, i) =>
    [
      i + 1,
      date(r.enrollmentDate),
      r.studentName,
      r.course,
      r.batch ?? "",
      r.institute,
      money(r.totalFee),
      money(r.pendingFee),
      r.completionStatus,
      // The same label shown in the dropdown and the table, so a shared name
      // stays distinguishable in the exported sheet too.
      labels.get(r.trainerId) ?? r.trainerName,
      r.trainerCode,
      money(r.trainingFee),
      money(r.split1Fee),
      money(r.installment1Amount),
      date(r.installment1Date),
      money(r.installment1Tds),
      r.installment1Mode ?? "",
      money(r.split2Fee),
      money(r.installment2Amount),
      date(r.installment2Date),
      money(r.installment2Tds),
      r.installment2Mode ?? "",
      money(r.balanceToPay),
      TRAINER_PAYMENT_STATUS_LABELS[r.paymentStatus] ?? r.paymentStatus,
      r.comment ?? "",
    ]
      .map(escape)
      .join(","),
  );

  const csv = [headers.join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trainer-payments_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TrainerPaymentsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Drill-down params arrive from the Trainer Payment Figures report.
  const [filterTrainer, setFilterTrainer] = useState(
    () => searchParams.get("trainerId") ?? ALL,
  );
  const [filterInstitute, setFilterInstitute] = useState(ALL);
  const [filterCourse, setFilterCourse] = useState(
    () => searchParams.get("course") ?? ALL,
  );
  const [filterBatch, setFilterBatch] = useState(
    () => searchParams.get("batch") ?? ALL,
  );
  const [filterCompletion, setFilterCompletion] = useState(
    () => searchParams.get("completionStatus") ?? ALL,
  );
  const [filterStatus, setFilterStatus] = useState(ALL);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  // Payment dates, distinct from the enrollment-date range above. Held as
  // state rather than a visible control because only the report sets them, but
  // surfaced as a removable chip so a narrowed list is never unexplained.
  const [paidFrom, setPaidFrom] = useState(
    () => searchParams.get("paidFrom") ?? "",
  );
  const [paidTo, setPaidTo] = useState(() => searchParams.get("paidTo") ?? "");
  const [paymentSeq, setPaymentSeq] = useState(
    () => searchParams.get("paymentSeq") ?? "BOTH",
  );
  const [paymentMode, setPaymentMode] = useState(
    () => searchParams.get("paymentMode") ?? "",
  );
  // Set by the report's Balance to Pay drill-down: only rows that still carry a
  // non-zero balance. Not year-scoped, so it arrives without paidFrom/paidTo.
  const [hasBalance, setHasBalance] = useState(
    () => searchParams.get("hasBalance") === "true",
  );
  const [search, setSearch] = useState("");
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [clearRow, setClearRow] = useState<Row | null>(null);

  // Consume the ?trainerId drill-down from the Trainers page, then clean the URL.
  useEffect(() => {
    if (Array.from(searchParams.keys()).length > 0) {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { trainers } = useTrainerOptions();

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [
      "admin",
      "trainer-payouts",
      filterTrainer,
      filterInstitute,
      filterCourse,
      filterBatch,
      filterCompletion,
      filterStatus,
      fromDate,
      toDate,
      paidFrom,
      paidTo,
      paymentSeq,
      paymentMode,
      hasBalance,
      search,
    ],
    queryFn: () =>
      trainerService.getTrainerPayouts({
        trainerId: filterTrainer === ALL ? undefined : filterTrainer,
        institute: filterInstitute === ALL ? undefined : filterInstitute,
        course: filterCourse === ALL ? undefined : filterCourse,
        batch: filterBatch === ALL ? undefined : filterBatch,
        completionStatus:
          filterCompletion === ALL ? undefined : filterCompletion,
        paymentStatus: filterStatus === ALL ? undefined : filterStatus,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        paidFrom: paidFrom || undefined,
        paidTo: paidTo || undefined,
        paymentSeq: paymentSeq === "BOTH" ? undefined : paymentSeq,
        paymentMode: paymentMode || undefined,
        hasBalance: hasBalance || undefined,
        search: search.trim() || undefined,
        limit: 100,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      enrollmentId,
      payload,
    }: {
      enrollmentId: string;
      payload: TrainerPayoutUpdate;
    }) => trainerService.updateTrainerPayout(enrollmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "trainer-payouts"],
      });
      // The dashboard totals are computed from these rows.
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      setEditRow(null);
      toast.success("Trainer payment saved");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const clearMutation = useMutation({
    mutationFn: (enrollmentId: string) =>
      trainerService.clearTrainerPayout(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "trainer-payouts"],
      });
      // The dashboard totals are computed from these rows.
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      setClearRow(null);
      toast.success("Trainer payment cleared");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const rows = data?.items ?? [];

  // Labels come from the full trainer list, not just the rows on screen, so a
  // name shared with a trainer who happens to be filtered out is still marked.
  const labels = useMemo(() => buildTrainerLabels(trainers), [trainers]);


  // ── Drag-to-scroll, matching the enrollment table ────────────────────────
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragScrollLeft = useRef(0);
  const dragAxis = useRef<"none" | "horizontal">("none");

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest(
        "button, a, input, select, [role='menuitem']",
      )
    ) {
      return;
    }
    const el = tableScrollRef.current;
    if (!el) return;
    isDragging.current = true;
    dragAxis.current = "none";
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    dragScrollLeft.current = el.scrollLeft;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartX.current;
    const dy = e.clientY - dragStartY.current;

    if (dragAxis.current === "none" && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      dragAxis.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "none";
      if (dragAxis.current === "none") {
        isDragging.current = false;
        return;
      }
      const el = tableScrollRef.current!;
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
    }

    if (dragAxis.current !== "horizontal") return;
    e.preventDefault();
    const el = tableScrollRef.current!;
    el.scrollLeft = dragScrollLeft.current - dx;
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    dragAxis.current = "none";
    const el = tableScrollRef.current;
    if (el) {
      el.style.cursor = "grab";
      el.style.userSelect = "";
    }
  }, []);

  const resetFilters = () => {
    setFilterTrainer(ALL);
    setFilterInstitute(ALL);
    setFilterCourse(ALL);
    setFilterBatch(ALL);
    setFilterCompletion(ALL);
    setFilterStatus(ALL);
    setFromDate("");
    setToDate("");
    setPaidFrom("");
    setPaidTo("");
    setPaymentSeq("BOTH");
    setPaymentMode("");
    setHasBalance(false);
    setSearch("");
  };

  // Explains a list narrowed by the report's drill-down, and lets it be undone.
  // One chip per invisible filter that arrived — a paid-date window from a month
  // or Total Paid figure, an outstanding-only list from a Balance to Pay figure.
  const drillChips: { key: string; label: string; onClear: () => void }[] = [];

  if (paidFrom || paidTo) {
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });
    const window =
      paidFrom && paidTo && fmt(paidFrom) === fmt(paidTo)
        ? fmt(paidFrom)
        : [paidFrom && formatDate(paidFrom), paidTo && formatDate(paidTo)]
            .filter(Boolean)
            .join(" – ");
    const seqLabel =
      paymentSeq === "FIRST"
        ? ", 1st payment"
        : paymentSeq === "SECOND"
          ? ", 2nd payment"
          : "";
    const modeLabel = paymentMode
      ? `, via ${TRAINER_PAYOUT_MODE_LABELS[paymentMode] ?? paymentMode}`
      : "";
    drillChips.push({
      key: "paid",
      label: `Paid in ${window}${seqLabel}${modeLabel}`,
      onClear: () => {
        setPaidFrom("");
        setPaidTo("");
        setPaymentSeq("BOTH");
        setPaymentMode("");
      },
    });
  }

  if (hasBalance) {
    drillChips.push({
      key: "balance",
      label: "Balance still to pay",
      onClear: () => setHasBalance(false),
    });
  }

  if (isError) return <QueryError error={error} onRetry={refetch} />;

  const filters = [
    {
      key: "trainer",
      width: "w-[200px]",
      allLabel: "All Trainers",
      value: filterTrainer,
      onChange: setFilterTrainer,
      options: trainers.map((t) => ({
        value: t.id,
        label: labels.get(t.id) ?? t.name,
      })),
    },
    {
      key: "status",
      width: "w-[150px]",
      allLabel: "All Statuses",
      value: filterStatus,
      onChange: setFilterStatus,
      options: TRAINER_PAYMENT_STATUS_FILTERS.map((s) => ({
        value: s.value,
        label: s.label,
      })),
    },
    {
      key: "course",
      width: "w-[160px]",
      allLabel: "All Courses",
      value: filterCourse,
      onChange: setFilterCourse,
      options: (data?.courses ?? []).map((c) => ({ value: c, label: c })),
    },
    {
      key: "batch",
      width: "w-[140px]",
      allLabel: "All Batches",
      value: filterBatch,
      onChange: setFilterBatch,
      options: (data?.batches ?? []).map((b) => ({ value: b, label: b })),
    },
    {
      key: "institute",
      width: "w-[140px]",
      allLabel: "All Institutes",
      value: filterInstitute,
      onChange: setFilterInstitute,
      options: INSTITUTES.map((i) => ({ value: i, label: i })),
    },
    {
      key: "completion",
      width: "w-[150px]",
      allLabel: "All Completion",
      value: filterCompletion,
      onChange: setFilterCompletion,
      options: COMPLETION_STATUSES.map((s) => ({
        value: s.value,
        label: s.label,
      })),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 p-2.5 shadow-md shadow-violet-200/50">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Trainer Payments
              </h2>
              <p className="text-sm text-muted-foreground">
                What we owe each trainer, per student they taught.
              </p>
            </div>
          </div>
          <FilterActions
            onReset={resetFilters}
            onRefresh={() => refetch()}
            isFetching={isFetching}
            onExport={
              rows.length > 0 ? () => exportPayoutsCsv(rows, labels) : undefined
            }
          />
        </div>

        {drillChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Showing rows from the figures report:
            </span>
            {drillChips.map((chip) => (
              <Badge
                key={chip.key}
                variant="secondary"
                className="gap-1 border border-violet-300 bg-violet-100 text-violet-800"
              >
                {chip.label}
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mr-1 h-4 w-4 hover:bg-violet-200"
                  onClick={chip.onClear}
                  title="Remove this filter"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-violet-200/60 bg-gradient-to-r from-violet-100 to-indigo-100 p-3">
          <div className="space-y-1">
            <Label className="text-xs">From Date</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 w-40 bg-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To Date</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 w-40 bg-white"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or trainer..."
              className="h-9 w-60 bg-white pl-9"
            />
          </div>
          {filters.map((f) => (
            <Select key={f.key} value={f.value} onValueChange={f.onChange}>
              <SelectTrigger className={`h-9 bg-white ${f.width}`}>
                <SelectValue placeholder={f.allLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{f.allLabel}</SelectItem>
                {f.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>

        {/* Grouped column table */}
        {isLoading ? (
          <TableSkeleton rows={8} columns={12} />
        ) : (
          <Card className="overflow-hidden border-violet-200/60">
            <CardContent className="p-0">
              <div
                ref={tableScrollRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                className="cursor-grab overflow-x-auto [&_[data-slot=table-container]]:overflow-visible"
              >
                <Table className="min-w-[2400px]">
                  <TableHeader>
                    {/* Row 1: group headers */}
                    <TableRow className="border-b-0">
                      <TableHead
                        rowSpan={2}
                        className="sticky left-0 z-20 w-[60px] border-r border-border bg-muted align-bottom text-center text-xs font-bold uppercase tracking-wider"
                      >
                        S.No
                      </TableHead>
                      {(() => {
                        const actions = COLUMN_GROUPS[0];
                        return (
                          <TableHead
                            colSpan={actions.colSpan}
                            className={`border-x border-border text-center text-xs font-bold uppercase tracking-wider ${actions.color}`}
                          >
                            <div className="flex items-center justify-center gap-1.5 py-1">
                              <actions.icon className="h-3.5 w-3.5" />
                              {actions.label}
                            </div>
                          </TableHead>
                        );
                      })()}
                      <TableHead
                        rowSpan={2}
                        className="sticky left-[60px] z-20 w-[180px] border-x border-border bg-blue-50 align-bottom text-xs font-bold uppercase tracking-wider text-blue-600"
                      >
                        Student Name
                      </TableHead>
                      {COLUMN_GROUPS.slice(1).map((group) => (
                        <TableHead
                          key={group.label}
                          colSpan={group.colSpan}
                          className={`border-x border-border text-center text-xs font-bold uppercase tracking-wider ${group.color}`}
                        >
                          <div className="flex items-center justify-center gap-1.5 py-1">
                            <group.icon className="h-3.5 w-3.5" />
                            {group.label}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>

                    {/* Row 2: sub-column headers */}
                    <TableRow>
                      {SUB_COLUMNS.map((col, i) => (
                        <TableHead
                          key={i}
                          className={`text-xs ${col.bg} ${col.extra ?? ""}`}
                        >
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {rows.length > 0 ? (
                      rows.map((row, index) => (
                        <TrainerPayoutRow
                          key={row.id}
                          row={row}
                          index={index}
                          trainerLabel={
                            labels.get(row.trainerId) ?? row.trainerName
                          }
                          onEdit={setEditRow}
                          onClear={setClearRow}
                        />
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={TOTAL_COLUMNS}
                          className="py-12 text-center text-muted-foreground"
                        >
                          No trainer payments found. Rows appear here once an
                          enrollment has a trainer assigned.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <AlertDialog
          open={!!clearRow}
          onOpenChange={(open) => {
            if (!open) setClearRow(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear this trainer payment?</AlertDialogTitle>
              <AlertDialogDescription>
                This clears the trainer payment recorded for{" "}
                <span className="font-medium">{clearRow?.studentName}</span> —
                the training fee, both payments, the TDS and the comment.
                <br />
                <br />
                The enrollment and the student's own fees are not touched, and
                the row stays in this table with nothing recorded against it, so
                you can enter it again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => clearRow && clearMutation.mutate(clearRow.id)}
                disabled={clearMutation.isPending}
              >
                {clearMutation.isPending ? "Clearing..." : "Clear payment"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <EditTrainerPayoutDialog
          row={editRow}
          open={!!editRow}
          onOpenChange={(open) => {
            if (!open) setEditRow(null);
          }}
          isPending={updateMutation.isPending}
          onSubmit={(enrollmentId, payload) =>
            updateMutation.mutate({ enrollmentId, payload })
          }
        />
      </div>
    </PageTransition>
  );
}
