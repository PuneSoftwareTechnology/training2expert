import type { Trainer } from "@/types/trainer.types";

/** trim + collapse internal whitespace + fold case — matches the backend's key. */
export function normalizeTrainerName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

interface LabelledTrainer {
  id: string;
  code: string;
  name: string;
  courses?: string[];
  note?: string | null;
}

/**
 * Labels a whole trainer list at once, decorating **only the names that repeat**.
 *
 * Stamping every row with its code and courses is noise when almost every name
 * is unique, and noise is what stops people reading the one row that matters.
 * So the label escalates only as far as it needs to for the name to be
 * unambiguous:
 *
 *   Priya Nair                            unique name, left clean
 *   Amit Verma · TRN-004 · Java
 *   Amit Verma · TRN-011 · React, Node
 *   Amit Verma · TRN-019 · Java · ex-TCS  note breaks a course tie
 *
 * The same map feeds the enrollment dropdown, the tracker's trainer column, the
 * Trainers page and the CSV export, so a trainer reads identically in the
 * dropdown you picked them from and the payment row you are about to pay.
 */
export function buildTrainerLabels(
  trainers: readonly LabelledTrainer[],
): Map<string, string> {
  const byName = new Map<string, LabelledTrainer[]>();
  for (const trainer of trainers) {
    const key = normalizeTrainerName(trainer.name);
    const bucket = byName.get(key);
    if (bucket) bucket.push(trainer);
    else byName.set(key, [trainer]);
  }

  const labels = new Map<string, string>();
  for (const bucket of byName.values()) {
    if (bucket.length === 1) {
      labels.set(bucket[0].id, bucket[0].name);
      continue;
    }

    // The code alone already disambiguates; courses are what a human actually
    // recognises, and the note only shows up when someone bothered to write one.
    const coursesDiffer =
      new Set(bucket.map((t) => (t.courses ?? []).join("|"))).size > 1;

    for (const trainer of bucket) {
      const parts = [trainer.name, trainer.code];
      const courses = trainer.courses ?? [];
      if (coursesDiffer && courses.length > 0) parts.push(courses.join(", "));
      if (trainer.note) parts.push(trainer.note);
      labels.set(trainer.id, parts.join(" · "));
    }
  }

  return labels;
}

/** One trainer's label, falling back to the bare name for an unknown id. */
export function trainerLabel(
  labels: Map<string, string>,
  id: string | null | undefined,
  fallbackName?: string | null,
): string {
  if (!id) return fallbackName || "—";
  return labels.get(id) ?? fallbackName ?? "—";
}

/**
 * Splits trainers into those hired for `course` and everyone else.
 *
 * The tag is a hint, not a fence: a trainer who knows React but was hired for
 * Java can still be assigned a React course, so nothing is filtered out — the
 * likely people are just floated to the top of a long list.
 */
export function groupTrainersByCourse<T extends { courses?: string[] }>(
  trainers: readonly T[],
  course?: string,
): { matching: T[]; others: T[] } {
  if (!course?.trim()) return { matching: [], others: [...trainers] };

  const target = course.trim().toLowerCase();
  const matching: T[] = [];
  const others: T[] = [];
  for (const trainer of trainers) {
    const hiredFor = (trainer.courses ?? []).some(
      (c) => c.trim().toLowerCase() === target,
    );
    (hiredFor ? matching : others).push(trainer);
  }
  return { matching, others };
}

/** Names already taken, so the create form can warn before adding a duplicate. */
export function findSameNameTrainers(
  trainers: readonly Trainer[],
  name: string,
): Trainer[] {
  const key = normalizeTrainerName(name);
  if (!key) return [];
  return trainers.filter((t) => normalizeTrainerName(t.name) === key);
}
