import { describe, expect, it } from "vitest";

import {
  FINANCIAL_MONTHS,
  financialYearLabel,
  financialYearRange,
  financialYearStart,
} from "./trainer-payment-table";

describe("financialYearStart", () => {
  it("starts a new financial year in April", () => {
    expect(financialYearStart(new Date("2026-04-01"))).toBe(2026);
    expect(financialYearStart(new Date("2026-12-31"))).toBe(2026);
  });

  it("counts Jan-Mar as the previous financial year", () => {
    expect(financialYearStart(new Date("2026-03-31"))).toBe(2025);
    expect(financialYearStart(new Date("2027-01-15"))).toBe(2026);
  });
});

describe("financialYearLabel", () => {
  it("renders the Indian FY form", () => {
    expect(financialYearLabel(2026)).toBe("26-27");
    expect(financialYearLabel(2025)).toBe("25-26");
  });

  it("pads across the century boundary", () => {
    expect(financialYearLabel(2099)).toBe("99-00");
  });
});

describe("financialYearRange", () => {
  it("spans April to March when no month is given", () => {
    expect(financialYearRange(2026)).toEqual({
      from: "2026-04-01",
      to: "2027-03-31",
    });
  });

  it("keeps Apr-Dec in the starting calendar year", () => {
    expect(financialYearRange(2026, 4)).toEqual({
      from: "2026-04-01",
      to: "2026-04-30",
    });
    expect(financialYearRange(2026, 12)).toEqual({
      from: "2026-12-01",
      to: "2026-12-31",
    });
  });

  it("rolls Jan-Mar into the following calendar year", () => {
    expect(financialYearRange(2026, 1)).toEqual({
      from: "2027-01-01",
      to: "2027-01-31",
    });
    expect(financialYearRange(2026, 3)).toEqual({
      from: "2027-03-01",
      to: "2027-03-31",
    });
  });

  it("gets February right in a leap year", () => {
    // FY 2027-28 puts February in 2028, which is a leap year.
    expect(financialYearRange(2027, 2)).toEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    });
    expect(financialYearRange(2026, 2)).toEqual({
      from: "2027-02-01",
      to: "2027-02-28",
    });
  });

  it("covers every month of the financial year without gaps", () => {
    const ranges = FINANCIAL_MONTHS.map((m) =>
      financialYearRange(2026, m.month),
    );
    expect(ranges).toHaveLength(12);
    expect(ranges[0].from).toBe("2026-04-01");
    expect(ranges[11].to).toBe("2027-03-31");

    // Each month must start the day after the previous one ends.
    for (let i = 1; i < ranges.length; i++) {
      const prevEnd = new Date(`${ranges[i - 1].to}T00:00:00Z`);
      const nextStart = new Date(`${ranges[i].from}T00:00:00Z`);
      expect(nextStart.getTime() - prevEnd.getTime()).toBe(86_400_000);
    }
  });
});
