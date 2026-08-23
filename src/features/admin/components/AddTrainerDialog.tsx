import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    defaultValues: { name: "", courses: [], note: "", isActive: true },
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
            isActive: editing.isActive,
          }
        : { name: "", courses: [], note: "", isActive: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const selectedCourses = form.watch("courses") ?? [];
  const nameValue = form.watch("name") ?? "";

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
      <DialogContent className="max-w-md">
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
