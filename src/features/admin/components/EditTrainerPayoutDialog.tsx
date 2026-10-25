import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

import { formatCurrency } from "@/utils/format";
import {
  DEFAULT_TDS_PERCENT,
  DEFAULT_SPLIT1_PERCENT,
  TRAINER_PAYMENT_STATUSES,
  TRAINER_PAYOUT_MODES,
  TRAINER_PAYOUT_MODE_LABELS,
} from "@/constants/trainer-payment-table";
import type {
  TrainerPayoutRow,
  TrainerPayoutUpdate,
} from "@/types/trainer.types";

/** "Auto" means store null and let the backend derive the status. */
const AUTO_STATUS = "__auto";
const NO_MODE = "__none";

/**
 * Each editable section gets its own light tint so the two installments never
 * get mistaken for each other while typing amounts into near-identical grids.
 */
const SECTION_TONES = {
  split:
    "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/25",
  first:
    "border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/25",
  second:
    "border-violet-200 bg-violet-50/60 dark:border-violet-900 dark:bg-violet-950/25",
  status:
    "border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/25",
} as const;

type SectionTone = keyof typeof SECTION_TONES;

interface Fields {
  training_fee: string;
  split1_percent: string;
  installment1_amount: string;
  installment1_date: string;
  installment1_tds: string;
  installment1_mode: string;
  installment2_amount: string;
  installment2_date: string;
  installment2_tds: string;
  installment2_mode: string;
  comment: string;
  payment_status: string;
}

const num = (v: string) => {
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * The amount typed in is what lands in the trainer's hands — the TDS was already
 * withheld from it. So the rate applies to the grossed-up figure, not to the net:
 * ₹5,400 net at 10% is ₹5,400 / 0.9 = ₹6,000 gross, ₹600 withheld.
 */
const tdsOnNet = (netPaid: number) =>
  Math.round((netPaid / (100 - DEFAULT_TDS_PERCENT)) * DEFAULT_TDS_PERCENT);

/** Empty string means "not recorded" and must be stored as null, not 0. */
const numOrNull = (v: string) => (v.trim() === "" ? null : num(v));

function rowToFields(row: TrainerPayoutRow): Fields {
  const str = (v: number | null) =>
    v === null || v === undefined ? "" : String(Number(v));
  return {
    training_fee: str(row.trainingFee) || "",
    split1_percent: String(Number(row.split1Percent ?? DEFAULT_SPLIT1_PERCENT)),
    installment1_amount: str(row.installment1Amount),
    installment1_date: row.installment1Date?.slice(0, 10) ?? "",
    installment1_tds: str(row.installment1Tds),
    installment1_mode: row.installment1Mode || "",
    installment2_amount: str(row.installment2Amount),
    installment2_date: row.installment2Date?.slice(0, 10) ?? "",
    installment2_tds: str(row.installment2Tds),
    installment2_mode: row.installment2Mode || "",
    comment: row.comment ?? "",
    payment_status: row.paymentStatusManual ? row.paymentStatus : AUTO_STATUS,
  };
}

interface InstallmentErrors {
  date?: string;
  mode?: string;
}

/**
 * A recorded payment has to say when it happened and which account it went
 * through, otherwise it cannot be reconciled against the bank later.
 */
function installmentErrors(
  amount: string,
  date: string,
  mode: string,
): InstallmentErrors {
  if (num(amount) <= 0) return {};
  return {
    date: date ? undefined : "Payment date is required",
    mode: mode ? undefined : "Select a payment mode",
  };
}

const hasErrors = (e: InstallmentErrors) => Boolean(e.date || e.mode);

interface InstallmentBlockProps {
  label: string;
  tone: SectionTone;
  share: number;
  settled: number;
  amount: string;
  date: string;
  tds: string;
  mode: string;
  errors: InstallmentErrors;
  onAmountChange: (value: string) => void;
  onAmountBlur: () => void;
  onDateChange: (value: string) => void;
  onTdsChange: (value: string) => void;
  onModeChange: (value: string) => void;
}

/**
 * Declared at module scope on purpose. Nesting it inside the dialog would make
 * it a fresh component type on every render, so React would tear the block down
 * and rebuild it after each keystroke — the inputs lose focus mid-number.
 */
function InstallmentBlock({
  label,
  tone,
  share,
  settled,
  amount,
  date,
  tds,
  mode,
  errors,
  onAmountChange,
  onAmountBlur,
  onDateChange,
  onTdsChange,
  onModeChange,
}: InstallmentBlockProps) {
  return (
    <div className={`space-y-2 rounded-md border p-3 ${SECTION_TONES[tone]}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">{label}</Label>
        <span className="text-xs text-muted-foreground">
          Due {formatCurrency(share)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Amount Paid</Label>
          <Input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            onBlur={onAmountBlur}
            placeholder="0"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Payment Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            aria-invalid={Boolean(errors.date)}
          />
          {errors.date && (
            <p className="text-xs text-destructive">{errors.date}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">TDS Deducted</Label>
          <Input
            type="number"
            min={0}
            value={tds}
            onChange={(e) => onTdsChange(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Mode</Label>
          <Select
            value={mode || NO_MODE}
            onValueChange={(v) => onModeChange(v === NO_MODE ? "" : v)}
          >
            <SelectTrigger aria-invalid={Boolean(errors.mode)}>
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_MODE}>
                <span className="text-muted-foreground">Not set</span>
              </SelectItem>
              {TRAINER_PAYOUT_MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
              {/* A mode saved before this list changed would otherwise show as
                  an empty trigger, and reopening the row would silently drop it. */}
              {mode && !TRAINER_PAYOUT_MODE_LABELS[mode] && (
                <SelectItem value={mode}>{mode}</SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.mode && (
            <p className="text-xs text-destructive">{errors.mode}</p>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Settles {formatCurrency(settled)} of the fee (amount paid + TDS).
      </p>
    </div>
  );
}

interface EditTrainerPayoutDialogProps {
  row: TrainerPayoutRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (enrollmentId: string, data: TrainerPayoutUpdate) => void;
  isPending: boolean;
}

/**
 * Editor for one tracker row.
 *
 * The two figures worth understanding while entering numbers here:
 *  - TDS counts as settled — it is withheld out of the gross owed, not charged
 *    on top, so ₹9,000 paid with ₹1,000 TDS discharges ₹10,000.
 *  - The share is a percentage, so an uneven split or a single full payment
 *    needs no special handling.
 */
export function EditTrainerPayoutDialog({
  row,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: EditTrainerPayoutDialogProps) {
  const [fields, setFields] = useState<Fields | null>(null);
  // Once TDS is edited by hand, the auto-fill stops touching it.
  const [tdsTouched, setTdsTouched] = useState({ first: false, second: false });
  // Errors stay hidden until the first save attempt, then track live edits.
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open || !row) return;
    setFields(rowToFields(row));
    setTdsTouched({
      first: row.installment1Tds !== null,
      second: row.installment2Tds !== null,
    });
    setShowErrors(false);
  }, [open, row]);

  const update = (key: keyof Fields, value: string) =>
    setFields((prev) => (prev ? { ...prev, [key]: value } : prev));

  const updateAmount = (which: "first" | "second", value: string) =>
    update(
      which === "first" ? "installment1_amount" : "installment2_amount",
      value,
    );

  /**
   * TDS is pre-filled once the amount is finished — on blur, not per keystroke,
   * so a half-typed "5" does not briefly rewrite the box while the rest of
   * "5400" is still coming. What gets stored is always the rupee figure left in
   * the box, never a rate, so an override survives.
   */
  const fillTdsFromAmount = (which: "first" | "second") => {
    if (tdsTouched[which]) return;
    const amountKey =
      which === "first" ? "installment1_amount" : "installment2_amount";
    const tdsKey = which === "first" ? "installment1_tds" : "installment2_tds";

    setFields((prev) => {
      if (!prev) return prev;
      const amount = prev[amountKey];
      return {
        ...prev,
        [tdsKey]: amount.trim() === "" ? "" : String(tdsOnNet(num(amount))),
      };
    });
  };

  const updateTds = (which: "first" | "second", value: string) => {
    setTdsTouched((prev) => ({ ...prev, [which]: true }));
    update(which === "first" ? "installment1_tds" : "installment2_tds", value);
  };

  const computed = useMemo(() => {
    if (!fields) return null;
    const fee = num(fields.training_fee);
    const pct = num(fields.split1_percent);
    const share1 = Math.round(((fee * pct) / 100) * 100) / 100;
    const settled1 =
      num(fields.installment1_amount) + num(fields.installment1_tds);
    const settled2 =
      num(fields.installment2_amount) + num(fields.installment2_tds);
    const settled = settled1 + settled2;
    const balance = fee - settled;

    const derived =
      fee === 0
        ? "NOT_SET"
        : settled <= 0
          ? "UNPAID"
          : settled >= fee
            ? "PAID"
            : "PARTIAL";

    return {
      share1,
      share2: Math.round((fee - share1) * 100) / 100,
      settled1,
      settled2,
      settled,
      balance,
      derived,
    };
  }, [fields]);

  const errors = useMemo(
    () =>
      fields
        ? {
            first: installmentErrors(
              fields.installment1_amount,
              fields.installment1_date,
              fields.installment1_mode,
            ),
            second: installmentErrors(
              fields.installment2_amount,
              fields.installment2_date,
              fields.installment2_mode,
            ),
          }
        : null,
    [fields],
  );

  const submit = () => {
    if (!row || !fields || !errors) return;
    if (hasErrors(errors.first) || hasErrors(errors.second)) {
      setShowErrors(true);
      return;
    }
    onSubmit(row.id, {
      training_fee: num(fields.training_fee),
      split1_percent: num(fields.split1_percent),
      installment1_amount: numOrNull(fields.installment1_amount),
      installment1_date: fields.installment1_date || null,
      installment1_tds: numOrNull(fields.installment1_tds),
      installment1_mode: fields.installment1_mode || null,
      installment2_amount: numOrNull(fields.installment2_amount),
      installment2_date: fields.installment2_date || null,
      installment2_tds: numOrNull(fields.installment2_tds),
      installment2_mode: fields.installment2_mode || null,
      comment: fields.comment.trim() || null,
      payment_status:
        fields.payment_status === AUTO_STATUS
          ? null
          : (fields.payment_status as TrainerPayoutUpdate["payment_status"]),
    });
  };

  if (!row || !fields || !computed || !errors) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Trainer Payment — {row.studentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 ">
          {/* Context: who is being paid, and whether the student has paid us */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-muted/50 p-3 text-sm">
            <span>
              <span className="text-muted-foreground">Trainer: </span>
              <span className="font-medium">{row.trainerName}</span>{" "}
              <span className="font-mono text-xs text-muted-foreground">
                {row.trainerCode}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground">Course: </span>
              {row.course}
            </span>
            <span>
              <span className="text-muted-foreground">Student pending: </span>
              <span
                className={
                  Number(row.pendingFee) > 0
                    ? "font-medium text-destructive"
                    : "font-medium text-green-600"
                }
              >
                {formatCurrency(Number(row.pendingFee))}
              </span>
            </span>
          </div>

          <div
            className={`space-y-2 rounded-md border p-3 ${SECTION_TONES.split}`}
          >
            <Label className="text-sm font-semibold">Fee &amp; Split</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Training Fees</Label>
                <Input
                  type="number"
                  min={0}
                  value={fields.training_fee}
                  onChange={(e) => update("training_fee", e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Total owed to the trainer for this student.
                </p>
              </div>
              <div className="space-y-1">
                <Label>First Payment Share (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={fields.split1_percent}
                  onChange={(e) => update("split1_percent", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(computed.share1)} then{" "}
                  {formatCurrency(computed.share2)}. Use 100 for a single
                  payment.
                </p>
              </div>
            </div>
          </div>

          <InstallmentBlock
            label="1st Payment"
            tone="first"
            share={computed.share1}
            settled={computed.settled1}
            amount={fields.installment1_amount}
            date={fields.installment1_date}
            tds={fields.installment1_tds}
            mode={fields.installment1_mode}
            errors={showErrors ? errors.first : {}}
            onAmountChange={(v) => updateAmount("first", v)}
            onAmountBlur={() => fillTdsFromAmount("first")}
            onDateChange={(v) => update("installment1_date", v)}
            onTdsChange={(v) => updateTds("first", v)}
            onModeChange={(v) => update("installment1_mode", v)}
          />
          <InstallmentBlock
            label="2nd Payment"
            tone="second"
            share={computed.share2}
            settled={computed.settled2}
            amount={fields.installment2_amount}
            date={fields.installment2_date}
            tds={fields.installment2_tds}
            mode={fields.installment2_mode}
            errors={showErrors ? errors.second : {}}
            onAmountChange={(v) => updateAmount("second", v)}
            onAmountBlur={() => fillTdsFromAmount("second")}
            onDateChange={(v) => update("installment2_date", v)}
            onTdsChange={(v) => updateTds("second", v)}
            onModeChange={(v) => update("installment2_mode", v)}
          />

          <div
            className={`space-y-2 rounded-md border p-3 ${SECTION_TONES.status}`}
          >
            <Label className="text-sm font-semibold">
              Status &amp; Balance
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Payment Status</Label>
                <Select
                  value={fields.payment_status}
                  onValueChange={(v) => update("payment_status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AUTO_STATUS}>
                      Automatic (from the amounts)
                    </SelectItem>
                    {TRAINER_PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fields.payment_status === AUTO_STATUS ? (
                  <p className="text-xs text-muted-foreground">
                    Currently reads as{" "}
                    <Badge variant="outline" className="text-[10px]">
                      {computed.derived}
                    </Badge>
                  </p>
                ) : (
                  <p className="flex items-start gap-1 text-xs text-amber-700">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" />
                    Overrides the amounts, which say {computed.derived}.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Balance to Pay</Label>
                <div
                  className={`rounded-md border px-3 py-2 text-lg font-semibold ${
                    computed.balance > 0
                      ? "text-destructive"
                      : computed.balance < 0
                        ? "text-orange-600"
                        : "text-green-600"
                  }`}
                >
                  {formatCurrency(computed.balance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Fee less {formatCurrency(computed.settled)} settled
                  {computed.balance < 0 && " — overpaid"}.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Comment</Label>
            <Textarea
              value={fields.comment}
              onChange={(e) => update("comment", e.target.value)}
              placeholder="Anything worth remembering about this payment"
              rows={2}
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
            <Button type="button" loading={isPending} onClick={submit}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
