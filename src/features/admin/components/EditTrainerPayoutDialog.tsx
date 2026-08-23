import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
} from "@/constants/trainer-payment-table";
import type {
  TrainerPayoutRow,
  TrainerPayoutUpdate,
} from "@/types/trainer.types";

/** "Auto" means store null and let the backend derive the status. */
const AUTO_STATUS = "__auto";
const NO_MODE = "__none";

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

  useEffect(() => {
    if (!open || !row) return;
    setFields(rowToFields(row));
    setTdsTouched({
      first: row.installment1Tds !== null,
      second: row.installment2Tds !== null,
    });
  }, [open, row]);

  const update = (key: keyof Fields, value: string) =>
    setFields((prev) => (prev ? { ...prev, [key]: value } : prev));

  /**
   * Entering an amount pre-fills TDS at the standard rate as a convenience.
   * What gets stored is always the rupee figure left in the box — never a rate —
   * so an override survives.
   */
  const updateAmount = (which: "first" | "second", value: string) => {
    const amountKey =
      which === "first" ? "installment1_amount" : "installment2_amount";
    const tdsKey = which === "first" ? "installment1_tds" : "installment2_tds";

    setFields((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [amountKey]: value };
      if (!tdsTouched[which]) {
        next[tdsKey] =
          value.trim() === ""
            ? ""
            : String(Math.round((num(value) * DEFAULT_TDS_PERCENT) / 100));
      }
      return next;
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

  const submit = () => {
    if (!row || !fields) return;
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

  if (!row || !fields || !computed) return null;

  const InstallmentBlock = ({
    which,
    label,
    share,
    settled,
  }: {
    which: "first" | "second";
    label: string;
    share: number;
    settled: number;
  }) => {
    const n = which === "first" ? "1" : "2";
    const amountKey = `installment${n}_amount` as keyof Fields;
    const dateKey = `installment${n}_date` as keyof Fields;
    const tdsKey = `installment${n}_tds` as keyof Fields;
    const modeKey = `installment${n}_mode` as keyof Fields;

    return (
      <div className="space-y-2 rounded-md border p-3">
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
              value={fields[amountKey]}
              onChange={(e) => updateAmount(which, e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Payment Date</Label>
            <Input
              type="date"
              value={fields[dateKey]}
              onChange={(e) => update(dateKey, e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">TDS Deducted</Label>
            <Input
              type="number"
              min={0}
              value={fields[tdsKey]}
              onChange={(e) => updateTds(which, e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Mode</Label>
            <Select
              value={fields[modeKey] || NO_MODE}
              onValueChange={(v) => update(modeKey, v === NO_MODE ? "" : v)}
            >
              <SelectTrigger>
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
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Settles {formatCurrency(settled)} of the fee (amount paid + TDS).
        </p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trainer Payment — {row.studentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
                {formatCurrency(computed.share2)}. Use 100 for a single payment.
              </p>
            </div>
          </div>

          <Separator />

          <InstallmentBlock
            which="first"
            label="1st Payment"
            share={computed.share1}
            settled={computed.settled1}
          />
          <InstallmentBlock
            which="second"
            label="2nd Payment"
            share={computed.share2}
            settled={computed.settled2}
          />

          <Separator />

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
