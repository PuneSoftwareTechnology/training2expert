import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INSTITUTES,
  ENROLLMENT_STATUSES,
  COMPLETION_STATUSES,
  PLACEMENT_STATUSES,
  PAYMENT_MODES,
} from "@/constants/courses";
import type {
  Institute,
  EnrollmentStatus,
  CompletionStatus,
  PlacementStatus,
} from "@/types/common.types";
import type { Enrollment } from "@/types/admin.types";

/** Convert an ISO timestamp or date string to YYYY-MM-DD for <input type="date"> */
function toDateInputValue(val: string | null | undefined): string {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

interface EditFields {
  name: string;
  email: string;
  phone: string;
  enrollment_status: EnrollmentStatus;
  institute: string;
  course: string;
  batch: string;
  trainer: string;
  start_date: string;
  end_date: string;
  completion_status: CompletionStatus;
  total_fee: number;
  installment1_amount: number;
  installment1_date: string;
  installment1_mode: string;
  installment2_amount: number;
  installment2_date: string;
  installment2_mode: string;
  installment3_amount: number;
  installment3_date: string;
  installment3_mode: string;
  placement_status: PlacementStatus;
  company_name: string;
  certificate_url: string;
}

function enrollmentToFields(e: Enrollment): EditFields {
  return {
    name: e.name || "",
    email: e.email || "",
    phone: e.phone || "",
    enrollment_status: e.enrollment_status || "NEW",
    institute: e.institute || "PST",
    course: e.course || "",
    batch: e.batch || "",
    trainer: e.trainer || "",
    start_date: toDateInputValue(e.start_date),
    end_date: toDateInputValue(e.end_date),
    completion_status: e.completion_status || "IN_PROGRESS",
    total_fee: Number(e.total_fee) || 0,
    installment1_amount: Number(e.installment1_amount) || 0,
    installment1_date: toDateInputValue(e.installment1_date),
    installment1_mode: e.installment1_mode || "",
    installment2_amount: Number(e.installment2_amount) || 0,
    installment2_date: toDateInputValue(e.installment2_date),
    installment2_mode: e.installment2_mode || "",
    installment3_amount: Number(e.installment3_amount) || 0,
    installment3_date: toDateInputValue(e.installment3_date),
    installment3_mode: e.installment3_mode || "",
    placement_status: e.placement_status || "NOT_PLACED",
    company_name: e.company_name || "",
    certificate_url: e.certificate_url || "",
  };
}

interface EditEnrollmentDialogProps {
  enrollment: Enrollment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: Partial<Enrollment>) => void;
  isPending: boolean;
}

export function EditEnrollmentDialog({
  enrollment,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: EditEnrollmentDialogProps) {
  const [fields, setFields] = useState<EditFields>(() =>
    enrollment ? enrollmentToFields(enrollment) : enrollmentToFields({} as Enrollment),
  );

  useEffect(() => {
    if (enrollment && open) {
      setFields(enrollmentToFields(enrollment));
    }
  }, [enrollment, open]);

  const updateField = useCallback(
    <K extends keyof EditFields>(key: K, value: EditFields[K]) => {
      setFields((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSubmit = () => {
    if (!enrollment) return;
    onSubmit(enrollment.id, fields as unknown as Partial<Enrollment>);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Enrollment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Basic Info</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={fields.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={fields.email}
                  onChange={(e) =>
                    updateField("email", e.target.value.toLowerCase())
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input
                  value={fields.phone}
                  maxLength={10}
                  onChange={(e) =>
                    updateField("phone", e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Enrollment Status</Label>
                <Select
                  value={fields.enrollment_status}
                  onValueChange={(v) => updateField("enrollment_status", v as EnrollmentStatus)}
                >
                  <SelectTrigger>
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
              </div>
              <div className="space-y-1">
                <Label>Institute</Label>
                <Select
                  value={fields.institute}
                  onValueChange={(v) => updateField("institute", v as Institute)}
                >
                  <SelectTrigger>
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
              </div>
            </div>
          </div>

          {/* Course Details */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Course Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Course</Label>
                <Input
                  value={fields.course}
                  onChange={(e) => updateField("course", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Batch</Label>
                <Input
                  value={fields.batch}
                  onChange={(e) => updateField("batch", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Trainer</Label>
                <Input
                  value={fields.trainer}
                  onChange={(e) => updateField("trainer", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Completion Status</Label>
                <Select
                  value={fields.completion_status}
                  onValueChange={(v) => updateField("completion_status", v as CompletionStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLETION_STATUSES.filter((s) => s.value !== "IN_PROGRESS").map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={fields.start_date}
                  onChange={(e) => updateField("start_date", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={fields.end_date}
                  onChange={(e) => updateField("end_date", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Payment</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Total Fee</Label>
                <Input
                  type="number"
                  value={fields.total_fee || ""}
                  onChange={(e) =>
                    updateField("total_fee", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            {/* Installments */}
            {[1, 2, 3].map((n) => {
              const amountKey = `installment${n}_amount` as keyof EditFields;
              const dateKey = `installment${n}_date` as keyof EditFields;
              const modeKey = `installment${n}_mode` as keyof EditFields;
              return (
                <div key={n} className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Installment {n}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={(fields[amountKey] as number) || ""}
                        onChange={(e) =>
                          updateField(amountKey, (parseFloat(e.target.value) || 0) as never)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={(fields[dateKey] as string) || ""}
                        onChange={(e) =>
                          updateField(dateKey, e.target.value as never)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Mode</Label>
                      <Select
                        value={(fields[modeKey] as string) || "NONE"}
                        onValueChange={(v) =>
                          updateField(modeKey, (v === "NONE" ? "" : v) as never)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">-</SelectItem>
                          {PAYMENT_MODES.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Placement */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Placement</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Placement Status</Label>
                <Select
                  value={fields.placement_status}
                  onValueChange={(v) => updateField("placement_status", v as PlacementStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLACEMENT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Company Name</Label>
                <Input
                  value={fields.company_name}
                  onChange={(e) => updateField("company_name", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Certificate */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Certificate</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <Label>Certificate URL</Label>
                <Input
                  value={fields.certificate_url}
                  onChange={(e) => updateField("certificate_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
