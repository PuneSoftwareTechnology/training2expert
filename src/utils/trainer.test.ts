import { describe, expect, it } from "vitest";

import {
  buildTrainerLabels,
  findSameNameTrainers,
  groupTrainersByCourse,
  normalizeTrainerName,
} from "./trainer";
import type { Trainer } from "@/types/trainer.types";

const trainer = (over: Partial<Trainer> & { id: string; name: string }): Trainer => ({
  code: `TRN-${over.id}`,
  courses: [],
  note: null,
  isActive: true,
  createdAt: "2026-01-01",
  ...over,
});

describe("normalizeTrainerName", () => {
  it("collapses whitespace and folds case", () => {
    expect(normalizeTrainerName("  Rahul   Sharma ")).toBe("rahul sharma");
    expect(normalizeTrainerName("RAHUL SHARMA")).toBe("rahul sharma");
  });

  it("does not try to equate different names", () => {
    expect(normalizeTrainerName("Rahul S")).not.toBe(
      normalizeTrainerName("Rahul Sharma"),
    );
  });
});

describe("buildTrainerLabels", () => {
  it("leaves a unique name undecorated", () => {
    const labels = buildTrainerLabels([
      trainer({ id: "1", name: "Priya Nair", courses: ["Java"] }),
    ]);
    expect(labels.get("1")).toBe("Priya Nair");
  });

  it("adds the code and courses only to names that repeat", () => {
    const labels = buildTrainerLabels([
      trainer({ id: "1", name: "Priya Nair" }),
      trainer({ id: "2", name: "Amit Verma", courses: ["Java"] }),
      trainer({ id: "3", name: "Amit Verma", courses: ["React", "Node"] }),
    ]);

    expect(labels.get("1")).toBe("Priya Nair");
    expect(labels.get("2")).toBe("Amit Verma · TRN-2 · Java");
    expect(labels.get("3")).toBe("Amit Verma · TRN-3 · React, Node");
  });

  it("treats spelling variants of one name as a collision", () => {
    const labels = buildTrainerLabels([
      trainer({ id: "1", name: "Amit  Verma" }),
      trainer({ id: "2", name: "amit verma" }),
    ]);
    expect(labels.get("1")).toContain("TRN-1");
    expect(labels.get("2")).toContain("TRN-2");
  });

  it("omits courses when they cannot break the tie, and uses the note instead", () => {
    const labels = buildTrainerLabels([
      trainer({ id: "1", name: "Amit Verma", courses: ["Java"], note: "ex-TCS" }),
      trainer({ id: "2", name: "Amit Verma", courses: ["Java"] }),
    ]);

    // Identical course lists add nothing, so they are left out.
    expect(labels.get("2")).toBe("Amit Verma · TRN-2");
    expect(labels.get("1")).toBe("Amit Verma · TRN-1 · ex-TCS");
  });
});

describe("groupTrainersByCourse", () => {
  const trainers = [
    trainer({ id: "1", name: "A", courses: ["Java"] }),
    trainer({ id: "2", name: "B", courses: ["React"] }),
    trainer({ id: "3", name: "C", courses: [] }),
  ];

  it("floats trainers hired for the course without dropping anyone", () => {
    const { matching, others } = groupTrainersByCourse(trainers, "React");
    expect(matching.map((t) => t.id)).toEqual(["2"]);
    // A Java trainer must stay selectable for a React course.
    expect(others.map((t) => t.id)).toEqual(["1", "3"]);
  });

  it("matches case-insensitively", () => {
    const { matching } = groupTrainersByCourse(trainers, "  java ");
    expect(matching.map((t) => t.id)).toEqual(["1"]);
  });

  it("keeps everyone in one group when no course is chosen", () => {
    const { matching, others } = groupTrainersByCourse(trainers, "");
    expect(matching).toHaveLength(0);
    expect(others).toHaveLength(3);
  });
});

describe("findSameNameTrainers", () => {
  const trainers = [
    trainer({ id: "1", name: "Rahul Sharma" }),
    trainer({ id: "2", name: "rahul  sharma" }),
    trainer({ id: "3", name: "Rahul S" }),
  ];

  it("finds spelling variants of the same name", () => {
    expect(findSameNameTrainers(trainers, " RAHUL SHARMA ").map((t) => t.id)).toEqual([
      "1",
      "2",
    ]);
  });

  it("does not guess that a shortened name is the same person", () => {
    expect(findSameNameTrainers(trainers, "Rahul S").map((t) => t.id)).toEqual([
      "3",
    ]);
  });

  it("returns nothing for a blank name", () => {
    expect(findSameNameTrainers(trainers, "   ")).toEqual([]);
  });
});
