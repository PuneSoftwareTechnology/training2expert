import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { QueryError } from "@/components/errors/QueryError";
import { PageTransition } from "@/components/animations/PageTransition";
import { FilterActions } from "@/components/ui/filter-actions";

import { trainerService } from "@/services/trainer.service";
import { buildTrainerLabels } from "@/utils/trainer";
import { formatCurrency } from "@/utils/format";
import { COMPLETION_STATUSES } from "@/constants/courses";
import { ROUTES } from "@/constants/routes";
import {
  FINANCIAL_MONTHS,
  PAYMENT_SEQUENCES,
  financialYearLabel,
  financialYearRange,
  financialYearStart,
} from "@/constants/trainer-payment-table";
import type {
  PaymentSequence,
  TrainerPaymentFigureRow,
} from "@/types/trainer.types";

const ALL = "ALL";

/** Compact money for the month grid — the full figure lives in the tooltip. */
function shortMoney(value: number): string {
  if (value >= 100000) return `${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

export default function TrainerPaymentFiguresPage() {
  const navigate = useNavigate();
  const currentFy = financialYearStart();

  const [financialYear, setFinancialYear] = useState(currentFy);
  const [batch, setBatch] = useState(ALL);
  const [course, setCourse] = useState(ALL);
  const [completionStatus, setCompletionStatus] = useState(ALL);
  const [paymentSeq, setPaymentSeq] = useState<PaymentSequence>("BOTH");

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [
      "admin",
      "reports",
      "trainer-payment-figures",
      financialYear,
      batch,
      course,
      completionStatus,
      paymentSeq,
    ],
    queryFn: () =>
      trainerService.getTrainerPaymentFigures({
        financialYear,
        batch: batch === ALL ? undefined : batch,
        course: course === ALL ? undefined : course,
        completionStatus:
          completionStatus === ALL ? undefined : completionStatus,
        paymentSeq,
      }),
  });

  const rows = data?.rows ?? [];
  const labels = useMemo(
    () =>
      buildTrainerLabels(
        rows.map((r) => ({
          id: r.trainerId,
          code: r.trainerCode,
          name: r.trainerName,
          courses: r.trainerCourses,
          note: r.trainerNote,
        })),
      ),
    [rows],
  );

  /**
   * Jumps to the tracker carrying the filters that produced the clicked figure.
   * A month cell passes paidFrom/paidTo — payment dates, not enrollment dates,
   * which is what these columns are counting.
   */
  const drillDown = useCallback(
    (trainerId: string | null, month?: number) => {
      const params = new URLSearchParams();
      if (trainerId) params.set("trainerId", trainerId);
      if (batch !== ALL) params.set("batch", batch);
      if (course !== ALL) params.set("course", course);
      if (completionStatus !== ALL)
        params.set("completionStatus", completionStatus);
      if (paymentSeq !== "BOTH") params.set("paymentSeq", paymentSeq);

      const { from, to } = financialYearRange(financialYear, month);
      params.set("paidFrom", from);
      params.set("paidTo", to);

      navigate(`${ROUTES.ADMIN_TRAINER_PAYMENTS}?${params.toString()}`);
    },
    [navigate, batch, course, completionStatus, paymentSeq, financialYear],
  );

  const totals = useMemo(() => {
    const monthly: Record<number, number> = {};
    let paid = 0;
    let tds = 0;
    let balance = 0;
    for (const row of rows) {
      for (const { month } of FINANCIAL_MONTHS) {
        monthly[month] = (monthly[month] ?? 0) + (row.monthly[month] ?? 0);
      }
      paid += row.totalPaid;
      tds += row.totalTds;
      balance += row.balanceToPay;
    }
    return { monthly, paid, tds, balance };
  }, [rows]);

  const years = Array.from({ length: 5 }, (_, i) => currentFy - i);

  const MoneyCell = ({
    value,
    onClick,
    bold,
  }: {
    value: number;
    onClick?: () => void;
    bold?: boolean;
  }) => {
    if (!value) {
      return (
        <span className="block text-right text-muted-foreground">
          {bold ? "0" : ""}
        </span>
      );
    }
    const text = shortMoney(value);
    return onClick ? (
      <button
        type="button"
        onClick={onClick}
        title={`${formatCurrency(value)} — open in the tracker`}
        className={`block w-full text-right text-violet-700 hover:underline ${
          bold ? "font-bold" : ""
        }`}
      >
        {text}
      </button>
    ) : (
      <span
        className={`block text-right ${bold ? "font-bold" : ""}`}
        title={formatCurrency(value)}
      >
        {text}
      </span>
    );
  };

  if (isError) return <QueryError error={error} onRetry={refetch} />;

  const filters = [
    {
      key: "year",
      label: "Payment Year",
      width: "w-28",
      value: String(financialYear),
      onChange: (v: string) => setFinancialYear(Number(v)),
      options: years.map((y) => ({
        value: String(y),
        label: financialYearLabel(y),
      })),
    },
    {
      key: "batch",
      label: "Batch",
      width: "w-36",
      value: batch,
      onChange: setBatch,
      allLabel: "All Batches",
      options: (data?.batches ?? []).map((b) => ({ value: b, label: b })),
    },
    {
      key: "course",
      label: "Course",
      width: "w-44",
      value: course,
      onChange: setCourse,
      allLabel: "All Courses",
      options: (data?.courses ?? []).map((c) => ({ value: c, label: c })),
    },
    {
      key: "completion",
      label: "Course Completion Status",
      width: "w-40",
      value: completionStatus,
      onChange: setCompletionStatus,
      allLabel: "All Statuses",
      options: COMPLETION_STATUSES.map((s) => ({
        value: s.value,
        label: s.label,
      })),
    },
    {
      key: "seq",
      label: "Payment Seq",
      width: "w-40",
      value: paymentSeq,
      onChange: (v: string) => setPaymentSeq(v as PaymentSequence),
      options: PAYMENT_SEQUENCES.map((p) => ({
        value: p.value,
        label: p.label,
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
              <h2 className="text-2xl font-bold">Trainer Payment Figures</h2>
              <p className="text-sm text-muted-foreground">
                Amount paid to each trainer by month, FY{" "}
                {financialYearLabel(financialYear)}. Click any figure to open it
                in the tracker.
              </p>
            </div>
          </div>
          <FilterActions
            onReset={() => {
              setFinancialYear(currentFy);
              setBatch(ALL);
              setCourse(ALL);
              setCompletionStatus(ALL);
              setPaymentSeq("BOTH");
            }}
            onRefresh={() => refetch()}
            isFetching={isFetching}
          />
        </div>

        <div className="flex flex-wrap items-end gap-4 rounded-md border border-violet-200/60 bg-gradient-to-r from-violet-100 to-indigo-100 p-4">
          {filters.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs">{f.label}</Label>
              <Select value={f.value} onValueChange={f.onChange}>
                <SelectTrigger className={`bg-white ${f.width}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {f.allLabel && (
                    <SelectItem value={ALL}>{f.allLabel}</SelectItem>
                  )}
                  {f.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} columns={16} />
        ) : (
          <Card className="overflow-hidden border-violet-200/60">
            <CardContent className="overflow-x-auto p-0">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow className="border-0 bg-gradient-to-r from-violet-500 to-indigo-600 hover:bg-transparent">
                    <TableHead className="sticky left-0 z-10 bg-violet-600 text-xs font-bold uppercase tracking-wider text-white">
                      Trainer
                    </TableHead>
                    {FINANCIAL_MONTHS.map(({ label }) => (
                      <TableHead
                        key={label}
                        className="text-right text-xs font-bold uppercase text-white"
                      >
                        {label}
                      </TableHead>
                    ))}
                    <TableHead className="border-l border-white/30 text-right text-xs font-bold uppercase text-white">
                      Total Paid
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase text-white">
                      Total TDS
                    </TableHead>
                    {/* Outstanding overall, so it ignores the year filter. */}
                    <TableHead
                      className="text-right text-xs font-bold uppercase text-white"
                      title="Outstanding across all time — not affected by the Payment Year filter"
                    >
                      Balance to Pay*
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={FINANCIAL_MONTHS.length + 4}
                        className="py-12 text-center text-muted-foreground"
                      >
                        No trainers match these filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row: TrainerPaymentFigureRow) => (
                      <TableRow key={row.trainerId} className="hover:bg-muted/40">
                        <TableCell className="sticky left-0 z-10 bg-background font-medium">
                          {labels.get(row.trainerId) ?? row.trainerName}
                        </TableCell>
                        {FINANCIAL_MONTHS.map(({ month, label }) => (
                          <TableCell key={label}>
                            <MoneyCell
                              value={row.monthly[month] ?? 0}
                              onClick={() => drillDown(row.trainerId, month)}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="border-l border-border">
                          <MoneyCell
                            value={row.totalPaid}
                            onClick={() => drillDown(row.trainerId)}
                            bold
                          />
                        </TableCell>
                        <TableCell>
                          <span
                            className="block text-right text-orange-600"
                            title={formatCurrency(row.totalTds)}
                          >
                            {row.totalTds ? shortMoney(row.totalTds) : "0"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`block text-right font-semibold ${
                              row.balanceToPay > 0
                                ? "text-destructive"
                                : row.balanceToPay < 0
                                  ? "text-orange-600"
                                  : "text-green-600"
                            }`}
                            title={formatCurrency(row.balanceToPay)}
                          >
                            {row.balanceToPay
                              ? shortMoney(row.balanceToPay)
                              : "0"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}

                  {rows.length > 0 && (
                    <TableRow className="border-t-2 bg-muted/60 font-bold hover:bg-muted/60">
                      <TableCell className="sticky left-0 z-10 bg-muted font-bold">
                        Total
                      </TableCell>
                      {FINANCIAL_MONTHS.map(({ month, label }) => (
                        <TableCell key={label}>
                          <MoneyCell
                            value={totals.monthly[month] ?? 0}
                            onClick={() => drillDown(null, month)}
                            bold
                          />
                        </TableCell>
                      ))}
                      <TableCell className="border-l border-border">
                        <MoneyCell
                          value={totals.paid}
                          onClick={() => drillDown(null)}
                          bold
                        />
                      </TableCell>
                      <TableCell>
                        <span
                          className="block text-right font-bold text-orange-600"
                          title={formatCurrency(totals.tds)}
                        >
                          {shortMoney(totals.tds)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="block text-right font-bold text-destructive"
                          title={formatCurrency(totals.balance)}
                        >
                          {shortMoney(totals.balance)}
                        </span>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground">
          Figures are shown short (12.5k = ₹12,500) — hover any figure for the
          exact amount. Month columns and Total Paid count what was actually paid
          in FY {financialYearLabel(financialYear)};{" "}
          <span className="font-medium">Balance to Pay*</span> is the outstanding
          amount across all time and does not change with the year filter.
        </p>
      </div>
    </PageTransition>
  );
}
