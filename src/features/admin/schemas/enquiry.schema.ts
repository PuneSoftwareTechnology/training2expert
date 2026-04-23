import { z } from "zod";

export const enquirySchema = z.object({
  enquiry_date: z.string().optional().or(z.literal("")),
  name: z.string().min(2, "Name is required"),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(z.string().email("Invalid email").optional()),
  course: z.string().optional().or(z.literal("")),
  institute: z.enum(["PST", "TCH"]).optional(),
  leadStatus: z.enum(["PROSPECTIVE", "NON_PROSPECTIVE", "ENROLLED"]).optional(),
  demoStatus: z.enum(["DONE", "PENDING"]).optional(),
  comment: z.string().optional().or(z.literal("")),
});

export type EnquiryFormValues = z.infer<typeof enquirySchema>;
