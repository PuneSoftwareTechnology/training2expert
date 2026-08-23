import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Merge } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { buildTrainerLabels } from "@/utils/trainer";
import type { TrainerWithStats } from "@/types/trainer.types";

interface MergeTrainersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Trainers pre-selected on the list page — the records to fold together. */
  selected: TrainerWithStats[];
  onSubmit: (survivorId: string, loserIds: string[]) => void;
  isPending: boolean;
}

/**
 * Folds several trainer records into one.
 *
 * This is the cleanup step the backfill deliberately leaves to a human: a
 * script cannot know that "Rahul S" and "Rahul Sharma" are the same person, so
 * it creates both and someone decides here.
 */
export function MergeTrainersDialog({
  open,
  onOpenChange,
  selected,
  onSubmit,
  isPending,
}: MergeTrainersDialogProps) {
  const [survivorId, setSurvivorId] = useState<string>("");

  const labels = useMemo(() => buildTrainerLabels(selected), [selected]);

  // Default to whoever carries the most enrollments — the record most likely to
  // be the "real" one, and the one that moves the least data.
  useEffect(() => {
    if (!open || selected.length === 0) return;
    const busiest = [...selected].sort(
      (a, b) => b.enrollmentCount - a.enrollmentCount,
    )[0];
    setSurvivorId(busiest.id);
  }, [open, selected]);

  const losers = selected.filter((t) => t.id !== survivorId);
  const survivor = selected.find((t) => t.id === survivorId);

  const movingEnrollments = losers.reduce(
    (sum, t) => sum + t.enrollmentCount,
    0,
  );

  const mergedCourses = useMemo(() => {
    const all = new Set<string>();
    for (const t of selected) for (const c of t.courses ?? []) all.add(c);
    return [...all].sort((a, b) => a.localeCompare(b));
  }, [selected]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Merge Trainers</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Keep this trainer</Label>
            <Select value={survivorId} onValueChange={setSurvivorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select the record to keep" />
              </SelectTrigger>
              <SelectContent>
                {selected.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {labels.get(t.id) ?? t.name} ({t.enrollmentCount} enrollment
                    {t.enrollmentCount === 1 ? "" : "s"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 rounded-md border p-3 text-sm">
            <p className="font-medium">What will happen</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                {movingEnrollments} enrollment
                {movingEnrollments === 1 ? "" : "s"} and their payouts move to{" "}
                <span className="font-medium text-foreground">
                  {survivor ? (labels.get(survivor.id) ?? survivor.name) : "—"}
                </span>
                .
              </li>
              <li>
                Course tags are combined, so nothing any record was hired for is
                lost.
              </li>
              <li>
                {losers.length} trainer record
                {losers.length === 1 ? "" : "s"} will be deleted.
              </li>
            </ul>
            {mergedCourses.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {mergedCourses.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs">
                    {c}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Records being merged in</Label>
            <ScrollArea className="h-28 rounded-md border p-2">
              <div className="space-y-1 text-sm">
                {losers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Select at least two trainers to merge.
                  </p>
                ) : (
                  losers.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span>{labels.get(t.id) ?? t.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.enrollmentCount} enrollment
                        {t.enrollmentCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs">
              This cannot be undone. Merge only records that are genuinely the
              same person — separate people who happen to share a name must stay
              separate, or their payments end up on one row.
            </p>
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
              type="button"
              variant="destructive"
              loading={isPending}
              disabled={losers.length === 0 || !survivorId}
              onClick={() =>
                onSubmit(
                  survivorId,
                  losers.map((t) => t.id),
                )
              }
            >
              <Merge className="mr-2 h-4 w-4" />
              Merge {losers.length} into 1
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
