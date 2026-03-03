import { memo } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Pencil,
  ChevronDown,
  ChevronUp,
  User,
  Check,
  X,
  Send,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { adminService } from "@/services/admin.service";
import { getErrorMessage } from "@/services/api";
import { formatCurrency, formatDate } from "@/utils/format";
import {
  INSTITUTES,
  ENROLLMENT_STATUSES,
  COMPLETION_STATUSES,
} from "@/constants/courses";
import type {
  EnrollmentStatus,
  CompletionStatus,
  PlacementStatus,
  Institute,
  Installment,
} from "@/types/common.types";
import type { Enrollment } from "@/types/admin.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function leadStatusVariant(status: EnrollmentStatus) {
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
      return "default" as const;
    case "COMPLETED":
      return "outline" as const;
    case "DROPOUT":
      return "destructive" as const;
  }
}

const INSTITUTE_BADGE: Record<string, "default" | "secondary" | "outline"> = {
  PST: "default",
  TCH: "secondary",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium">{value || "-"}</span>
    </div>
  );
}

function InstallmentRow({
  installment,
  enrollmentId,
}: {
  installment: Installment;
  enrollmentId: string;
}) {
  const sendReceiptMutation = useMutation({
    mutationFn: () => adminService.sendReceipt(enrollmentId, installment.id),
    onSuccess: () =>
      toast.success(
        `Receipt sent for installment #${installment.installment_number}`,
      ),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <TableRow>
      <TableCell className="text-sm">
        #{installment.installment_number}
      </TableCell>
      <TableCell className="text-sm">
        {formatCurrency(installment.amount)}
      </TableCell>
      <TableCell className="text-sm">
        {formatDate(installment.payment_date)}
      </TableCell>
      <TableCell>
        <Badge variant="outline">{installment.mode}</Badge>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => sendReceiptMutation.mutate()}
          loading={sendReceiptMutation.isPending}
        >
          {!sendReceiptMutation.isPending && <Send className="h-3 w-3" />}
          {sendReceiptMutation.isPending ? "Sending..." : "Send Receipt"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EditableFields {
  name: string;
  email: string;
  phone: string;
  enrollment_status: EnrollmentStatus;
  institute: Institute;
  course: string;
  batch: string | undefined;
  trainer: string | undefined;
  start_date: string;
  end_date: string;
  completion_status: CompletionStatus;
  total_fee: number;
  placement_status: PlacementStatus;
  company_name: string | undefined;
}

interface EnrollmentTableRowProps {
  enrollment: Enrollment;
  isEditing: boolean;
  isExpanded: boolean;
  editFields: EditableFields | null;
  onToggleExpand: () => void;
  onStartEdit: (enrollment: Enrollment) => void;
  onCancelEdit: () => void;
  onSaveEdit: (enrollment: Enrollment) => void;
  onViewProfile: (studentId: string) => void;
  onApprove: (enrollment: Enrollment) => void;
  onReject: (enrollment: Enrollment) => void;
  onUpdateField: <K extends keyof EditableFields>(
    key: K,
    value: EditableFields[K],
  ) => void;
  isSaving: boolean;
  isApproving: boolean;
  isRejecting: boolean;
}

export const EnrollmentTableRow = memo(function EnrollmentTableRow({
  enrollment,
  isEditing,
  isExpanded,
  editFields,
  onToggleExpand,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onViewProfile,
  onApprove,
  onReject,
  onUpdateField,
  isSaving,
  isApproving,
  isRejecting,
}: EnrollmentTableRowProps) {
  return (
    <>
      <TableRow
        className={cn(
          "cursor-pointer transition-colors hover:bg-muted/50",
          isExpanded && "bg-muted/30",
        )}
        onClick={onToggleExpand}
      >
        <TableCell>
          <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell>
          {isEditing && editFields ? (
            <Input
              value={editFields.name}
              onChange={(e) => onUpdateField("name", e.target.value)}
              className="h-8 w-32"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="font-semibold">{enrollment.name}</span>
          )}
        </TableCell>

        {/* Email */}
        <TableCell>
          {isEditing && editFields ? (
            <Input
              type="email"
              value={editFields.email}
              onChange={(e) => onUpdateField("email", e.target.value)}
              className="h-8 w-44"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm">{enrollment.email}</span>
          )}
        </TableCell>

        {/* Phone */}
        <TableCell>
          {isEditing && editFields ? (
            <Input
              value={editFields.phone}
              maxLength={10}
              onChange={(e) =>
                onUpdateField("phone", e.target.value.replace(/\D/g, ""))
              }
              className="h-8 w-28"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm">{enrollment.phone}</span>
          )}
        </TableCell>

        {/* Status */}
        <TableCell>
          {isEditing && editFields ? (
            <Select
              value={editFields.enrollment_status}
              onValueChange={(v) =>
                onUpdateField("enrollment_status", v as EnrollmentStatus)
              }
            >
              <SelectTrigger
                className="h-8 w-28"
                onClick={(e) => e.stopPropagation()}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENROLLMENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={leadStatusVariant(enrollment.enrollment_status)}>
              {ENROLLMENT_STATUSES.find(
                (s) => s.value === enrollment.enrollment_status,
              )?.label ?? enrollment.enrollment_status}
            </Badge>
          )}
        </TableCell>

        {/* Institute */}
        <TableCell>
          {isEditing && editFields ? (
            <Select
              value={editFields.institute}
              onValueChange={(v) => onUpdateField("institute", v as Institute)}
            >
              <SelectTrigger
                className="h-8 w-20"
                onClick={(e) => e.stopPropagation()}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INSTITUTES.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={INSTITUTE_BADGE[enrollment.institute] ?? "outline"}>
              {enrollment.institute}
            </Badge>
          )}
        </TableCell>

        {/* Course */}
        <TableCell>
          {isEditing && editFields ? (
            <Input
              value={editFields.course}
              onChange={(e) => onUpdateField("course", e.target.value)}
              className="h-8 w-32"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm">{enrollment.course}</span>
          )}
        </TableCell>

        {/* Batch */}
        <TableCell>
          {isEditing && editFields ? (
            <Input
              value={editFields.batch}
              onChange={(e) => onUpdateField("batch", e.target.value)}
              className="h-8 w-24"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm">{enrollment.batch || "-"}</span>
          )}
        </TableCell>

        {/* Start Date */}
        <TableCell>
          {isEditing && editFields ? (
            <Input
              type="date"
              value={editFields.start_date}
              onChange={(e) => onUpdateField("start_date", e.target.value)}
              className="h-8 w-28"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm">{formatDate(enrollment.start_date)}</span>
          )}
        </TableCell>

        {/* End Date */}
        <TableCell>
          {isEditing && editFields ? (
            <Input
              type="date"
              value={editFields.end_date}
              onChange={(e) => onUpdateField("end_date", e.target.value)}
              className="h-8 w-28"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm">{formatDate(enrollment.end_date)}</span>
          )}
        </TableCell>

        {/* Completion */}
        <TableCell>
          {isEditing && editFields ? (
            <Select
              value={editFields.completion_status}
              onValueChange={(v) =>
                onUpdateField("completion_status", v as CompletionStatus)
              }
            >
              <SelectTrigger
                className="h-8 w-28"
                onClick={(e) => e.stopPropagation()}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPLETION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge
              variant={completionStatusVariant(enrollment.completion_status)}
            >
              {COMPLETION_STATUSES.find(
                (s) => s.value === enrollment.completion_status,
              )?.label ?? enrollment.completion_status}
            </Badge>
          )}
        </TableCell>

        {/* Approval Actions Cell (for NEW status) */}
        <TableCell onClick={(e) => e.stopPropagation()}>
          {enrollment.enrollment_status === "NEW" ? (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onApprove(enrollment)}
                disabled={isApproving}
                className="text-green-600 hover:text-green-700"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onReject(enrollment)}
                disabled={isRejecting}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </TableCell>

        {/* Main Actions Cell */}
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onSaveEdit(enrollment)}
                  loading={isSaving}
                  className="text-green-600 hover:text-green-700"
                >
                  {!isSaving && <Save className="h-4 w-4" />}
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button variant="ghost" size="xs" onClick={onCancelEdit}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onStartEdit(enrollment)}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onViewProfile(enrollment.student_id)}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded Details Row */}
      {isExpanded && (
        <TableRow className="bg-muted/10">
          <TableCell colSpan={12} className="p-4 child-row">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Internal Course Details */}
              <div className="space-y-2">
                <p className="text-sm font-semibold">Additional Info</p>
                <Separator />
                <DetailField
                  label="Trainer"
                  value={enrollment.trainer || "-"}
                />
                <DetailField
                  label="Total Fees"
                  value={formatCurrency(Number(enrollment.total_fee))}
                />
                <DetailField
                  label="Pending Amount"
                  value={formatCurrency(Number(enrollment.pending_amount))}
                />
                <DetailField
                  label="Placement Status"
                  value={enrollment.placement_status}
                />
                {enrollment.company_name && (
                  <DetailField
                    label="Company"
                    value={enrollment.company_name}
                  />
                )}
                {enrollment.certificate_url && (
                  <DetailField label="Certificate" value="Available" />
                )}
              </div>

              {/* Installments Table */}
              <div className="md:col-span-2 space-y-2">
                <p className="text-sm font-semibold">Payment Installments</p>
                <Separator />
                {enrollment.installments &&
                enrollment.installments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">#</TableHead>
                        <TableHead className="text-xs">Amount</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Mode</TableHead>
                        <TableHead className="text-xs">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollment.installments.map((inst) => (
                        <InstallmentRow
                          key={inst.id}
                          installment={inst}
                          enrollmentId={enrollment.id}
                        />
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="py-2 text-sm text-muted-foreground italic">
                    No installments recorded for this student.
                  </p>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
});
