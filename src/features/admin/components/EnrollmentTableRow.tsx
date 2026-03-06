import { memo } from "react";
import {
  Eye,
  Send,
  FileText,
  Mail,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatCurrency, formatDate } from "@/utils/format";
import {
  ENROLLMENT_STATUSES,
  COMPLETION_STATUSES,
  PAYMENT_MODES,
} from "@/constants/courses";
import type {
  EnrollmentStatus,
  CompletionStatus,
  PlacementStatus,
  PaymentMode,
} from "@/types/common.types";
import type { Enrollment } from "@/types/admin.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function enrollmentStatusVariant(status: EnrollmentStatus) {
  switch (status) {
    case "NEW":
      return "secondary" as const;
    case "APPROVED":
      return "success" as const;
    case "REJECTED":
      return "destructive" as const;
  }
}

function completionStatusVariant(status: CompletionStatus) {
  switch (status) {
    case "ACTIVE":
      return "success" as const;
    case "COMPLETED":
      return "default" as const;
    case "DROPOUT":
      return "destructive" as const;
  }
}

function placementStatusVariant(status: PlacementStatus) {
  switch (status) {
    case "PLACED":
      return "success" as const;
    case "NOT_PLACED":
      return "secondary" as const;
  }
}

const INSTITUTE_BADGE: Record<string, "default" | "secondary" | "outline"> = {
  PST: "default",
  TCH: "secondary",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InstallmentCells({
  amount,
  date,
  mode,
  cellClassName,
  label,
  studentName,
  studentEmail,
}: {
  amount?: number;
  date?: string;
  mode?: PaymentMode;
  cellClassName?: string;
  label: string;
  studentName: string;
  studentEmail: string;
}) {
  if (!amount) {
    return (
      <>
        <TableCell className={cn("text-sm text-muted-foreground", cellClassName)}>-</TableCell>
        <TableCell className={cn("text-sm text-muted-foreground", cellClassName)}>-</TableCell>
        <TableCell className={cn("text-sm text-muted-foreground", cellClassName)}>-</TableCell>
        <TableCell className={cn("text-sm text-muted-foreground", cellClassName)}>-</TableCell>
        <TableCell className={cn("text-sm text-muted-foreground", cellClassName)}>-</TableCell>
      </>
    );
  }

  return (
    <>
      <TableCell className={cn("text-sm font-medium", cellClassName)}>
        {formatCurrency(amount)}
      </TableCell>
      <TableCell className={cn("text-sm", cellClassName)}>
        {date ? formatDate(date) : "-"}
      </TableCell>
      <TableCell className={cellClassName}>
        {mode ? (
          <Badge variant="outline" className="text-[10px]">
            {PAYMENT_MODES.find((m) => m.value === mode)?.label ?? mode}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className={cellClassName}>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-primary"
          title="View Receipt"
          onClick={(e) => {
            e.stopPropagation();
            toast.info("No receipt available");
          }}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
      <TableCell className={cellClassName}>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary"
              title="Send Receipt"
              onClick={(e) => e.stopPropagation()}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send {label} Installment Receipt</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to send the {label.toLowerCase()} installment receipt
                via email to{" "}
                <span className="font-semibold text-foreground">
                  {studentName}
                </span>{" "}
                at{" "}
                <span className="font-semibold text-foreground">
                  {studentEmail}
                </span>
                . Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => toast.info("Send receipt triggered")}
              >
                Yes, Send
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EnrollmentTableRowProps {
  enrollment: Enrollment;
  index: number;
  onEdit: (enrollment: Enrollment) => void;
  onDelete: (enrollmentId: string) => void;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const EnrollmentTableRow = memo(function EnrollmentTableRow({
  enrollment,
  index,
  onEdit,
  onDelete,
}: EnrollmentTableRowProps) {
  const isOdd = index % 2 === 1;

  const pendingAmount =
    Number(enrollment.total_fee || 0) -
    Number(enrollment.installment1_amount || 0) -
    Number(enrollment.installment2_amount || 0) -
    Number(enrollment.installment3_amount || 0);

  // Column-group backgrounds — alternating row shades (Finder-style)
  const bg = {
    sno: isOdd ? "bg-muted/40" : "",
    actions: isOdd ? "bg-gray-100/50" : "bg-gray-50/25",
    basic: isOdd ? "bg-blue-50/45" : "bg-blue-50/15",
    course: isOdd ? "bg-orange-50/45" : "bg-orange-50/15",
    payment: isOdd ? "bg-indigo-50/45" : "bg-indigo-50/15",
    cert: isOdd ? "bg-teal-50/45" : "bg-teal-50/15",
    placement: isOdd ? "bg-purple-50/45" : "bg-purple-50/15",
  };

  return (
    <TableRow className="transition-colors">
      {/* S.No */}
      <TableCell
        className={cn(
          "text-sm font-medium text-center border-r border-border",
          bg.sno,
        )}
      >
        {index + 1}
      </TableCell>

      {/* === ACTIONS === */}
      <TableCell className={cn("text-center border-l border-border", bg.actions)}>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-primary"
          title="Edit Enrollment"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(enrollment);
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
      <TableCell className={cn("text-center border-r border-border", bg.actions)}>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              title="Delete Enrollment"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Enrollment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the enrollment for{" "}
                <span className="font-semibold text-foreground">
                  {enrollment.name}
                </span>
                ? This action can be reversed by an administrator.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => onDelete(enrollment.id)}
              >
                Yes, Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>

      {/* === BASIC INFO === */}
      <TableCell className={cn("text-sm font-semibold border-l border-border", bg.basic)}>
        {enrollment.name}
      </TableCell>
      <TableCell className={cn("text-sm", bg.basic)}>
        {enrollment.email}
      </TableCell>
      <TableCell className={cn("text-sm", bg.basic)}>
        {enrollment.phone}
      </TableCell>
      <TableCell className={bg.basic}>
        <Badge variant={enrollmentStatusVariant(enrollment.enrollment_status)}>
          {ENROLLMENT_STATUSES.find(
            (s) => s.value === enrollment.enrollment_status,
          )?.label ?? enrollment.enrollment_status}
        </Badge>
      </TableCell>
      <TableCell className={cn("border-r border-border", bg.basic)}>
        <Badge variant={INSTITUTE_BADGE[enrollment.institute] ?? "outline"}>
          {enrollment.institute}
        </Badge>
      </TableCell>

      {/* === COURSE DETAILS === */}
      <TableCell className={cn("text-sm border-l border-border", bg.course)}>
        {enrollment.course}
      </TableCell>
      <TableCell className={cn("text-sm", bg.course)}>
        <Badge variant="outline" className="text-[10px]">
          {enrollment.batch || "-"}
        </Badge>
      </TableCell>
      <TableCell className={cn("text-sm", bg.course)}>
        {enrollment.trainer || "-"}
      </TableCell>
      <TableCell className={cn("text-sm", bg.course)}>
        {formatDate(enrollment.start_date)}
      </TableCell>
      <TableCell className={cn("text-sm", bg.course)}>
        {formatDate(enrollment.end_date)}
      </TableCell>
      <TableCell className={cn("border-r border-border", bg.course)}>
        <Badge variant={completionStatusVariant(enrollment.completion_status)}>
          {COMPLETION_STATUSES.find(
            (s) => s.value === enrollment.completion_status,
          )?.label ?? enrollment.completion_status}
        </Badge>
      </TableCell>

      {/* === PAYMENT TRACKING === */}
      <TableCell
        className={cn("text-sm font-semibold border-l border-border", bg.payment)}
      >
        {formatCurrency(Number(enrollment.total_fee))}
      </TableCell>

      {/* 1st Installment */}
      <InstallmentCells
        amount={enrollment.installment1_amount}
        date={enrollment.installment1_date}
        mode={enrollment.installment1_mode}
        cellClassName={bg.payment}
        label="1st"
        studentName={enrollment.name}
        studentEmail={enrollment.email}
      />

      {/* 2nd Installment */}
      <InstallmentCells
        amount={enrollment.installment2_amount}
        date={enrollment.installment2_date}
        mode={enrollment.installment2_mode}
        cellClassName={bg.payment}
        label="2nd"
        studentName={enrollment.name}
        studentEmail={enrollment.email}
      />

      {/* 3rd Installment */}
      <InstallmentCells
        amount={enrollment.installment3_amount}
        date={enrollment.installment3_date}
        mode={enrollment.installment3_mode}
        cellClassName={bg.payment}
        label="3rd"
        studentName={enrollment.name}
        studentEmail={enrollment.email}
      />

      {/* Pending Amount */}
      <TableCell
        className={cn(
          "text-sm font-semibold border-r border-border",
          bg.payment,
          pendingAmount > 0 ? "text-destructive" : "text-success",
        )}
      >
        {formatCurrency(pendingAmount)}
      </TableCell>

      {/* === CERTIFICATE === */}
      <TableCell className={cn("border-l border-border", bg.cert)}>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-primary"
          title="View Certificate"
          onClick={(e) => {
            e.stopPropagation();
            if (enrollment.certificate_url) {
              window.open(enrollment.certificate_url, "_blank");
            } else {
              toast.info("No certificate available");
            }
          }}
        >
          <FileText className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
      <TableCell className={cn("border-r border-border", bg.cert)}>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary"
              title="Send Certificate"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send Certificate</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to send the certificate via email to{" "}
                <span className="font-semibold text-foreground">
                  {enrollment.name}
                </span>{" "}
                at{" "}
                <span className="font-semibold text-foreground">
                  {enrollment.email}
                </span>
                . Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  toast.info("Send certificate triggered")
                }
              >
                Yes, Send
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>

      {/* === PLACEMENT === */}
      <TableCell className={cn("border-l border-border", bg.placement)}>
        <Badge variant={placementStatusVariant(enrollment.placement_status)}>
          {enrollment.placement_status === "PLACED" ? "Placed" : "Not Placed"}
        </Badge>
      </TableCell>
      <TableCell className={cn("text-sm border-r border-border", bg.placement)}>
        {enrollment.company_name || "-"}
      </TableCell>
    </TableRow>
  );
});
