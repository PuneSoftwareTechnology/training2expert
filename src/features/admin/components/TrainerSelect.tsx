import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTrainerOptions } from "@/hooks/useTrainerOptions";

interface TrainerSelectProps {
  /** Trainer id, or "" for unassigned. */
  value: string;
  onChange: (trainerId: string) => void;
  /** Groups trainers hired for this course to the top. Never filters. */
  course?: string;
  disabled?: boolean;
  className?: string;
}

/** Sentinel for "no trainer" — Radix throws on a SelectItem with an empty value. */
export const NO_TRAINER = "__none";

/**
 * The trainer picker for the enrollment forms. Replaces the free-text input:
 * trainers are chosen by id so two people sharing a name stay distinguishable,
 * which the old text column could not do.
 *
 * Trainers hired for the selected course are grouped to the top, but everyone
 * stays selectable and nothing is preselected — a Java trainer may legitimately
 * be assigned a React batch, and quietly guessing the trainer on a screen that
 * decides who gets paid is worse than making someone pick.
 *
 * Adding a trainer is super-admin-only and lives on the Trainers page, so this
 * deliberately offers no inline create.
 */
export function TrainerSelect({
  value,
  onChange,
  course,
  disabled,
  className,
}: TrainerSelectProps) {
  const { labels, matching, others, isLoading } = useTrainerOptions(
    course,
    value || undefined,
  );

  const renderItem = (trainer: { id: string; name: string }) => (
    <SelectItem key={trainer.id} value={trainer.id}>
      {labels.get(trainer.id) ?? trainer.name}
    </SelectItem>
  );

  const hasNone = matching.length === 0 && others.length === 0;

  return (
    <Select
      value={value || NO_TRAINER}
      onValueChange={(v) => onChange(v === NO_TRAINER ? "" : v)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select trainer" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="__loading" disabled>
            Loading...
          </SelectItem>
        ) : hasNone ? (
          <SelectItem value="__empty" disabled>
            No trainers yet — a super admin adds them
          </SelectItem>
        ) : (
          <>
            <SelectItem value={NO_TRAINER}>
              <span className="text-muted-foreground">No trainer</span>
            </SelectItem>
            {matching.length > 0 && (
              <SelectGroup>
                <SelectLabel>Hired for {course}</SelectLabel>
                {matching.map(renderItem)}
              </SelectGroup>
            )}
            {others.length > 0 && (
              <SelectGroup>
                {matching.length > 0 && (
                  <SelectLabel>Other trainers</SelectLabel>
                )}
                {others.map(renderItem)}
              </SelectGroup>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}
