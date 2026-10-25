import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useCourseOptions } from "@/hooks/useCourseOptions";
import { findSameNameTrainers } from "@/utils/trainer";
import {
  IFSC_PATTERN,
  PAN_PATTERN,
  trainerSchema,
  type TrainerFormValues,
} from "../schemas/trainer.schema";
import type { Trainer } from "@/types/trainer.types";

interface AddTrainerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Trainer | null;
  /** The full trainer list, used to spot a duplicate name before submitting. */
  existingTrainers: Trainer[];
  onSubmit: (values: TrainerFormValues, confirmDuplicate: boolean) => void;
  isPending: boolean;
}

/**
 * Every field blank rather than absent: react-hook-form keeps an uncontrolled
 * input's old text when a reset omits its key, which would leak one trainer's
 * bank details into the next one added.
 */
const BLANK: TrainerFormValues = {
  name: "",
  courses: [],
  note: "",
  panNumber: "",
  beneficiaryName: "",
  bankName: "",
  ifscCode: "",
  accountNumber: "",
  fees: "",
  comment: "",
  isActive: true,
};

export function AddTrainerDialog({
  open,
  onOpenChange,
  editing,
  existingTrainers,
  onSubmit,
  isPending,
}: AddTrainerDialogProps) {
  const { options: courseOptions } = useCourseOptions("ENROLLMENT");
  const [pendingDuplicate, setPendingDuplicate] = useState<Trainer[] | null>(
    null,
  );

  const form = useForm<TrainerFormValues>({
    resolver: zodResolver(trainerSchema),
    defaultValues: BLANK,
  });

  useEffect(() => {
    if (!open) return;
    setPendingDuplicate(null);
    form.reset(
      editing
        ? {
            name: editing.name,
            courses: editing.courses ?? [],
            note: editing.note ?? "",
            panNumber: editing.panNumber ?? "",
            beneficiaryName: editing.beneficiaryName ?? "",
            bankName: editing.bankName ?? "",
            ifscCode: editing.ifscCode ?? "",
            accountNumber: editing.accountNumber ?? "",
            fees: editing.fees ?? "",
            comment: editing.comment ?? "",
            isActive: editing.isActive,
          }
        : BLANK,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const selectedCourses = form.watch("courses") ?? [];
  const nameValue = form.watch("name") ?? "";

  // A hint, not a validation error: these are copied off documents, and a value
  // that does not match the usual shape is still worth recording. Saving is
  // never blocked on them.
  const panValue = (form.watch("panNumber") ?? "").trim();
  const ifscValue = (form.watch("ifscCode") ?? "").trim();
  const panLooksOff = panValue !== "" && !PAN_PATTERN.test(panValue.toUpperCase());
  const ifscLooksOff =
    ifscValue !== "" && !IFSC_PATTERN.test(ifscValue.toUpperCase());

  // Courses already saved on this trainer that are no longer in the master list
  // must stay visible, or editing an older trainer would silently drop them.
  const allCourses = useMemo(() => {
    const merged = new Set(courseOptions);
    for (const c of selectedCourses) merged.add(c);
    return [...merged].sort((a, b) => a.localeCompare(b));
  }, [courseOptions, selectedCourses]);

  const toggleCourse = (course: string) => {
    const next = selectedCourses.includes(course)
      ? selectedCourses.filter((c) => c !== course)
      : [...selectedCourses, course];
    form.setValue("courses", next, { shouldDirty: true });
  };

  const submit = (values: TrainerFormValues) => {
    // Two real people can share a name, so a clash is a question and not an
    // error. Most clashes are a re-entry of someone who already exists, and
    // silently creating a second record splits their payments across two rows
    // nobody notices.
    const clashes = editing
      ? []
      : findSameNameTrainers(existingTrainers, values.name);

    if (clashes.length > 0 && !pendingDuplicate) {
      setPendingDuplicate(clashes);
      return;
    }

    onSubmit(values, clashes.length > 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Trainer" : "Add Trainer"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(submit)(e);
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <Label>Trainer Name *</Label>
            <Input {...form.register("name")} placeholder="e.g. Rahul Sharma" />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
            {editing && (
              <p className="text-xs text-muted-foreground">
                Code {editing.code} — renaming also updates the trainer name
                shown on their enrollments.
              </p>
            )}
          </div>

          {pendingDuplicate && (
            <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium">
                    A trainer named "{nameValue.trim()}" already exists.
                  </p>
                  <ul className="space-y-0.5 text-xs text-muted-foreground">
                    {pendingDuplicate.map((t) => (
                      <li key={t.id}>
                        {t.code}
                        {t.courses.length > 0 && ` · ${t.courses.join(", ")}`}
                        {t.note && ` · ${t.note}`}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs">
                    If this is the same person, cancel and edit them instead.
                    Submit again only if this is a different person — they will
                    get their own code, and a note helps tell them apart.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label>Hired For</Label>
            <p className="text-xs text-muted-foreground">
              Groups this trainer to the top of the enrollment dropdown for
              these courses. It never restricts them — they can still be
              assigned any course.
            </p>
            {allCourses.length === 0 ? (
              <p className="rounded-md border p-3 text-xs text-muted-foreground">
                No enrollment courses yet. Add them from Course Management.
              </p>
            ) : (
              <ScrollArea className="h-40 rounded-md border p-2">
                <div className="space-y-1.5">
                  {allCourses.map((course) => (
                    <label
                      key={course}
                      className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted"
                    >
                      <Checkbox
                        checked={selectedCourses.includes(course)}
                        onCheckedChange={() => toggleCourse(course)}
                      />
                      {course}
                    </label>
                  ))}
                </div>
              </ScrollArea>
            )}
            {selectedCourses.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedCourses.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs">
                    {c}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label>Note</Label>
            <Input
              {...form.register("note")}
              placeholder="Only needed to tell two same-name trainers apart"
            />
            {form.formState.errors.note && (
              <p className="text-xs text-destructive">
                {form.formState.errors.note.message}
              </p>
            )}
          </div>

          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/30">
            <div>
              <Label className="text-sm font-medium">For our records</Label>
              <p className="text-xs text-muted-foreground">
                Kept on the trainer for reference only — none of it appears on
                enrollments, receipts or reports, and the fee here is not the
                payout figure (that is per student, on Trainer Payments).
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>PAN Number</Label>
                <Input
                  {...form.register("panNumber")}
                  placeholder="ABCDE1234F"
                  className="font-mono uppercase"
                />
                {form.formState.errors.panNumber ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.panNumber.message}
                  </p>
                ) : (
                  panLooksOff && (
                    <p className="text-xs text-amber-600">
                      Not the usual 5 letters, 4 digits, 1 letter — saving it
                      anyway.
                    </p>
                  )
                )}
              </div>

              <div className="space-y-1">
                <Label>Fees</Label>
                <Input
                  {...form.register("fees")}
                  placeholder="e.g. 40% of course fees"
                />
                {form.formState.errors.fees && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.fees.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 rounded-md border bg-background p-3">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bank Details
              </Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Beneficiary Name</Label>
                  <Input
                    {...form.register("beneficiaryName")}
                    placeholder="Name exactly as on the account"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Bank Name</Label>
                  <Input
                    {...form.register("bankName")}
                    placeholder="e.g. HDFC Bank"
                  />
                </div>
                <div className="space-y-1">
                  <Label>IFSC Code</Label>
                  <Input
                    {...form.register("ifscCode")}
                    placeholder="HDFC0001234"
                    className="font-mono uppercase"
                  />
                  {form.formState.errors.ifscCode ? (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.ifscCode.message}
                    </p>
                  ) : (
                    ifscLooksOff && (
                      <p className="text-xs text-amber-600">
                        Not the usual 11 characters — saving it anyway.
                      </p>
                    )
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Account Number</Label>
                  {/* Not type="number": account numbers carry leading zeros
                      and are identifiers, never arithmetic. */}
                  <Input
                    {...form.register("accountNumber")}
                    inputMode="numeric"
                    placeholder="Account number"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Comment</Label>
              <Textarea
                {...form.register("comment")}
                rows={2}
                placeholder="Anything worth remembering about this trainer"
              />
              {form.formState.errors.comment && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.comment.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-sm font-medium">Active</Label>
              <p className="text-xs text-muted-foreground">
                Inactive trainers stay on their existing enrollments but drop
                out of the dropdown
              </p>
            </div>
            <Switch
              checked={form.watch("isActive") ?? true}
              onCheckedChange={(v) => form.setValue("isActive", v)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isPending}
              variant={pendingDuplicate ? "destructive" : "default"}
            >
              {pendingDuplicate
                ? "Create as a separate trainer"
                : editing
                  ? "Update"
                  : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
