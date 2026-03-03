import { z } from "zod";

export const qrSchema = z.object({
  bank_name: z.string().min(2, "Bank name is required"),
  branch: z.string().optional(),
  upi_id: z
    .string()
    .min(3, "UPI ID is required")
    .regex(/^[\w.-]+@[\w.-]+$/, "Invalid UPI ID (e.g. name@bank)"),
  account_number: z
    .string()
    .min(9, "Account number must be at least 9 digits")
    .max(18, "Account number must be at most 18 digits")
    .regex(/^\d+$/, "Account number must contain only digits"),
  ifsc_code: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code (e.g. HDFC0001234)"),
  is_active: z.boolean(),
});

export type QrFormValues = z.infer<typeof qrSchema>;
