import { z } from "zod";

export const trainerSchema = z.object({
  name: z.string().trim().min(1, "Trainer name is required").max(150),
  /**
   * Courses the trainer is hired for — groups the enrollment dropdown only.
   * No zod .default() here: it would make the schema's input and output types
   * differ, which react-hook-form's resolver rejects.
   */
  courses: z.array(z.string()),
  /** Optional, and only worth filling in to tell two same-named trainers apart. */
  note: z
    .string()
    .trim()
    .max(200, "Keep the note short — it sits inside a dropdown")
    .optional(),

  // ─── Record-keeping fields ────────────────────────────────────────────────
  // All optional, and only length-checked. PAN and IFSC have well-known shapes,
  // but a wrong-looking value someone read off a document is still worth
  // storing — the form warns instead of blocking.
  panNumber: z.string().trim().max(20, "PAN is 10 characters").optional(),
  beneficiaryName: z.string().trim().max(150).optional(),
  bankName: z.string().trim().max(150).optional(),
  ifscCode: z.string().trim().max(20, "IFSC is 11 characters").optional(),
  accountNumber: z.string().trim().max(40).optional(),
  /**
   * Free text, not an amount: rates are agreed as "40% of course fees" or
   * "15k for Agentic AI, 12k for Python full stack" as often as a flat figure.
   */
  fees: z.string().trim().max(500, "Keep the fees under 500 characters").optional(),
  comment: z.string().trim().max(1000).optional(),

  isActive: z.boolean().optional(),
});

export type TrainerFormValues = z.infer<typeof trainerSchema>;

/** Shapes PAN/IFSC are conventionally written in — advisory, never enforced. */
export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/**
 * Turns the form's strings into the API payload: blank becomes null so the
 * table shows one consistent "—", and PAN/IFSC are upper-cased the way they are
 * printed on the documents they came from.
 */
export function toTrainerDetailPayload(values: TrainerFormValues) {
  const text = (v: string | undefined) => v?.trim() || null;
  const upper = (v: string | undefined) => v?.trim().toUpperCase() || null;

  return {
    panNumber: upper(values.panNumber),
    beneficiaryName: text(values.beneficiaryName),
    bankName: text(values.bankName),
    ifscCode: upper(values.ifscCode),
    accountNumber: text(values.accountNumber),
    fees: text(values.fees),
    comment: text(values.comment),
  };
}
