import { memo } from "react";
import { Pencil, Eraser } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/utils/format";
import { TRAINER_PAYMENT_STATUS_LABELS } from "@/constants/trainer-payment-table";
import type {
  TrainerPaymentStatus,
  TrainerPayoutRow as Row,
} from "@/types/trainer.types";

function statusVariant(status: TrainerPaymentStatus) {
  switch (status) {
    case "PAID":
      return "success" as const;
    case "PARTIAL":
      return "warning" as const;
    case "HOLD":
      return "destructive" as const;
    case "UNPAID":
      return "secondary" as const;
    case "NOT_SET":
      return "outline" as const;
  }
}

function completionVariant(status: string) {
  switch (status) {
    case "ACTIVE":
      return "success" as const;
    case "COMPLETED":
      return "default" as const;
    case "DROPOUT":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

const Money = ({
  value,
  className,
}: {
  value: number | null | undefined;
  className?: string;
}) =>
  value === null || value === undefined ? (
    <span className="block text-right text-muted-foreground">—</span>
  ) : (
    <span className={cn("block text-right", className)}>
      {formatCurrency(Number(value))}
    </span>
  );

const DateCell = ({ value }: { value: string | null }) =>
  value ? (
    <span className="whitespace-nowrap">{formatDate(value)}</span>
  ) : (
    <span className="text-muted-foreground">—</span>
  );

interface TrainerPayoutRowProps {
  row: Row;
  index: number;
  /** Pre-computed label — decorated with the code only when the name repeats. */
  trainerLabel: string;
  onEdit: (row: Row) => void;
  onClear: (row: Row) => void;
}

function TrainerPayoutRowComponent({
  row,
  index,
  trainerLabel,
  onEdit,
  onClear,
}: TrainerPayoutRowProps) {
  const balance = Number(row.balanceToPay);

  return (
    <TableRow className="hover:bg-muted/40">
      {/* S.No (sticky) */}
      <TableCell className="sticky left-0 z-10 border-r border-border bg-background text-center text-muted-foreground">
        {index + 1}
      </TableCell>

      {/* Actions */}
      <TableCell className="border-l border-border text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
          onClick={() => onEdit(row)}
          title="Edit trainer payment"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </TableCell>
      <TableCell className="border-r border-border text-center">
        {/*
          Clears the recorded payment, not the enrollment — the row is driven by
          the enrollment and comes straight back empty. Disabled when there is
          nothing recorded yet, so it never looks like it would delete the row.
        */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
          onClick={() => onClear(row)}
          disabled={!row.payoutId}
          title={
            row.payoutId
              ? "Clear the recorded trainer payment"
              : "Nothing recorded to clear"
          }
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </TableCell>

      {/* Student Name (sticky) */}
      <TableCell className="sticky left-[60px] z-10 border-x border-border bg-background font-medium">
        {row.studentName}
      </TableCell>

      {/* Enrollment */}
      <TableCell className="border-l border-border">
        <DateCell value={row.enrollmentDate} />
      </TableCell>
      <TableCell>{row.course}</TableCell>
      <TableCell>
        {row.batch || <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-medium">
          {row.institute}
        </Badge>
      </TableCell>
      <TableCell className="border-r border-border">
        <Badge variant={completionVariant(row.completionStatus)}>
          {row.completionStatus}
        </Badge>
      </TableCell>

      {/* Student fees — context for whether we have been paid yet ourselves */}
      <TableCell className="border-l border-border">
        <Money value={row.totalFee} />
      </TableCell>
      <TableCell className="border-r border-border">
        <Money
          value={row.pendingFee}
          className={
            Number(row.pendingFee) > 0 ? "font-medium text-destructive" : ""
          }
        />
      </TableCell>

      {/* Trainer */}
      <TableCell className="border-l border-border">
        <span className="font-medium">{trainerLabel}</span>
      </TableCell>
      <TableCell className="border-r border-border">
        <Money value={row.trainingFee} className="font-medium" />
      </TableCell>

      {/* 1st payment */}
      <TableCell className="border-l border-border">
        <Money value={row.split1Fee} className="text-muted-foreground" />
      </TableCell>
      <TableCell>
        <Money
          value={row.installment1Amount}
          className="font-medium text-green-600"
        />
      </TableCell>
      <TableCell>
        <DateCell value={row.installment1Date} />
      </TableCell>
      <TableCell className="border-r border-border">
        <Money value={row.installment1Tds} className="text-orange-600" />
      </TableCell>

      {/* 2nd payment */}
      <TableCell className="border-l border-border">
        <Money value={row.split2Fee} className="text-muted-foreground" />
      </TableCell>
      <TableCell>
        <Money
          value={row.installment2Amount}
          className="font-medium text-green-600"
        />
      </TableCell>
      <TableCell>
        <DateCell value={row.installment2Date} />
      </TableCell>
      <TableCell className="border-r border-border">
        <Money value={row.installment2Tds} className="text-orange-600" />
      </TableCell>

      {/* Summary */}
      <TableCell className="border-l border-border">
        <Money
          value={balance}
          className={cn(
            "font-semibold",
            balance > 0
              ? "text-destructive"
              : balance < 0
                ? "text-orange-600"
                : "text-green-600",
          )}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Badge variant={statusVariant(row.paymentStatus)}>
            {TRAINER_PAYMENT_STATUS_LABELS[row.paymentStatus] ??
              row.paymentStatus}
          </Badge>
          {/* A manual status can disagree with the amounts, so it is marked. */}
          {row.paymentStatusManual && (
            <span
              className="text-[10px] text-muted-foreground"
              title="Set manually, not derived from the amounts"
            >
              (set)
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="border-r border-border">
        {row.comment ? (
          <span className="line-clamp-2 text-xs" title={row.comment}>
            {row.comment}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

export const TrainerPayoutRow = memo(TrainerPayoutRowComponent);
