import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { trainerService } from "@/services/trainer.service";
import { buildTrainerLabels, groupTrainersByCourse } from "@/utils/trainer";
import type { Trainer } from "@/types/trainer.types";

export const TRAINER_OPTIONS_QUERY_KEY = ["admin", "trainers"];

/**
 * Active trainers for the enrollment form's dropdown, mirroring
 * useCourseOptions. Two differences that matter:
 *
 *  - Options are objects keyed by id, not names. Two trainers can share a name,
 *    so the name is only ever a label.
 *  - `currentTrainerId` is kept in the list even when that trainer has been
 *    deactivated, so editing an older enrollment cannot silently drop its
 *    trainer (the same guard useCourseOptions applies to course names).
 *
 * `course` only *groups* the list — trainers hired for other courses stay
 * selectable, because a Java trainer may well be assigned a React batch.
 */
export function useTrainerOptions(course?: string, currentTrainerId?: string) {
  const { data, isLoading } = useQuery({
    queryKey: TRAINER_OPTIONS_QUERY_KEY,
    queryFn: () => trainerService.getTrainers({ isActive: true }),
  });

  // An inactive trainer still on an existing enrollment has to stay pickable,
  // or saving an unrelated edit would blank the trainer field.
  const { data: current } = useQuery({
    queryKey: [...TRAINER_OPTIONS_QUERY_KEY, "current", currentTrainerId],
    queryFn: () => trainerService.getTrainers({ isActive: false }),
    enabled:
      !!currentTrainerId &&
      !!data &&
      !data.some((t) => t.id === currentTrainerId),
  });

  const trainers = useMemo<Trainer[]>(() => {
    const active = data ?? [];
    if (!currentTrainerId || active.some((t) => t.id === currentTrainerId)) {
      return active;
    }
    const missing = (current ?? []).find((t) => t.id === currentTrainerId);
    return missing ? [...active, missing] : active;
  }, [data, current, currentTrainerId]);

  const labels = useMemo(() => buildTrainerLabels(trainers), [trainers]);

  const { matching, others } = useMemo(
    () => groupTrainersByCourse(trainers, course),
    [trainers, course],
  );

  return { trainers, labels, matching, others, isLoading };
}
