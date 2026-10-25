import { describe, expect, it } from "vitest";

import {
  toTrainerDetailPayload,
  trainerSchema,
  type TrainerFormValues,
} from "./trainer.schema";

const values = (over: Partial<TrainerFormValues> = {}): TrainerFormValues => ({
  name: "Rahul Sharma",
  courses: [],
  ...over,
});

describe("toTrainerDetailPayload", () => {
  it("sends null, not empty string, for fields left blank", () => {
    expect(toTrainerDetailPayload(values())).toEqual({
      panNumber: null,
      beneficiaryName: null,
      bankName: null,
      ifscCode: null,
      accountNumber: null,
      fees: null,
      comment: null,
    });
  });

  it("upper-cases PAN and IFSC but leaves names alone", () => {
    const payload = toTrainerDetailPayload(
      values({
        panNumber: " abcde1234f ",
        ifscCode: "hdfc0001234",
        beneficiaryName: "Rahul Sharma",
      }),
    );
    expect(payload.panNumber).toBe("ABCDE1234F");
    expect(payload.ifscCode).toBe("HDFC0001234");
    expect(payload.beneficiaryName).toBe("Rahul Sharma");
  });

  it("keeps a leading zero on the account number", () => {
    expect(toTrainerDetailPayload(values({ accountNumber: "0012345678" }))
      .accountNumber).toBe("0012345678");
  });

  it("keeps fees as free text, and blank as null", () => {
    expect(
      toTrainerDetailPayload(values({ fees: " 40% of course fees " })).fees,
    ).toBe("40% of course fees");
    expect(toTrainerDetailPayload(values({ fees: "0" })).fees).toBe("0");
    expect(toTrainerDetailPayload(values({ fees: "" })).fees).toBeNull();
    expect(toTrainerDetailPayload(values({ fees: undefined })).fees).toBeNull();
  });
});

describe("trainerSchema fees", () => {
  const parse = (fees: string) =>
    trainerSchema.safeParse({ name: "A", courses: [], fees });

  it("accepts a blank fee — it is optional", () => {
    expect(parse("").success).toBe(true);
  });

  it("accepts fees written as text", () => {
    expect(parse("40% of course fees").success).toBe(true);
    expect(
      parse("15k for Agentic AI, 12K for Python full stack, 10k for DSA python")
        .success,
    ).toBe(true);
  });

  it("does not reject an oddly shaped PAN — the form only warns", () => {
    expect(
      trainerSchema.safeParse({ name: "A", courses: [], panNumber: "NOTAPAN" })
        .success,
    ).toBe(true);
  });
});
