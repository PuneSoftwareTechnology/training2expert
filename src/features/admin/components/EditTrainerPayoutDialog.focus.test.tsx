// @vitest-environment jsdom
import { useState } from "react";
import { describe, expect, it, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";

import { EditTrainerPayoutDialog } from "./EditTrainerPayoutDialog";
import type { TrainerPayoutRow } from "@/types/trainer.types";

const row: TrainerPayoutRow = {
  id: "enr-1",
  payoutId: null,
  enrollmentDate: "2026-08-01",
  studentName: "Sheetal Deshmukh",
  course: "FI S4 HANA",
  batch: null,
  institute: "TECHVAA",
  totalFee: 50000,
  pendingFee: 15000,
  completionStatus: "ONGOING" as TrainerPayoutRow["completionStatus"],
  trainerId: "trn-1",
  trainerCode: "TRN-005",
  trainerName: "Rakesh",
  trainerCourses: [],
  trainerNote: null,
  trainingFee: 12000,
  split1Percent: 50,
  split1Fee: 6000,
  installment1Amount: null,
  installment1Date: null,
  installment1Tds: null,
  installment1Mode: null,
  split2Fee: 6000,
  installment2Amount: null,
  installment2Date: null,
  installment2Tds: null,
  installment2Mode: null,
  balanceToPay: 12000,
  comment: null,
  paymentStatus: "UNPAID",
  paymentStatusManual: false,
};

const noop = () => {};

/** Types digit by digit, asserting the box keeps focus and its own DOM node. */
function typeDigits(input: HTMLInputElement, digits: string) {
  input.focus();
  let sofar = "";
  for (const d of digits) {
    sofar += d;
    fireEvent.change(input, { target: { value: sofar } });
    expect(
      document.activeElement,
      `lost focus after typing "${sofar}"`,
    ).toBe(input);
  }
}

/** Number boxes in DOM order: fee, share%, 1st amount, 1st TDS, 2nd amount, 2nd TDS. */
function numberInputs() {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>('input[type="number"]'),
  );
}

function open() {
  render(
    <EditTrainerPayoutDialog
      row={row}
      open
      onOpenChange={noop}
      onSubmit={noop}
      isPending={false}
    />,
  );
}

afterEach(cleanup);

describe("EditTrainerPayoutDialog number entry", () => {
  it("keeps focus while typing a multi-digit Amount Paid", () => {
    open();
    const amount = numberInputs()[2];
    typeDigits(amount, "5400");
    expect(amount.value).toBe("5400");
  });

  it("keeps focus while typing a multi-digit TDS", () => {
    open();
    const tds = numberInputs()[3];
    typeDigits(tds, "600");
    expect(tds.value).toBe("600");
  });

  // The page around the dialog re-renders on its own (react-query refetches,
  // mutation flags). That must not disturb a half-typed number either.
  it("keeps focus when the parent re-renders mid-number", () => {
    function Parent() {
      const [, force] = useState(0);
      return (
        <>
          <button onClick={() => force((n) => n + 1)}>rerender</button>
          <EditTrainerPayoutDialog
            row={row}
            open
            onOpenChange={noop}
            onSubmit={noop}
            isPending={false}
          />
        </>
      );
    }
    render(<Parent />);
    const amount = numberInputs()[2];
    amount.focus();
    fireEvent.change(amount, { target: { value: "54" } });
    fireEvent.click(document.querySelector("button")!);
    expect(document.activeElement).toBe(amount);
    fireEvent.change(amount, { target: { value: "5400" } });
    expect(document.activeElement).toBe(amount);
    expect(amount.value).toBe("5400");
  });

  it("keeps focus while typing Training Fees", () => {
    open();
    const fee = numberInputs()[0];
    typeDigits(fee, "12000");
    expect(fee.value).toBe("12000");
  });
});
