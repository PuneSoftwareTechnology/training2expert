import { z } from "zod";

export const enquirySchema = z.object({
  enquiry_date: z.string().min(1, "Date is required"),
  name: z.string().min(2, "Name is required"),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  course: z.string().optional(),
  institute: z.enum(["PST", "TCH"]),
  leadStatus: z.enum(["PROSPECTIVE", "NON_PROSPECTIVE", "ENROLLED"]),
  demoStatus: z.enum(["DONE", "PENDING"]),
  comment: z.string().optional().or(z.literal("")),
});

export type EnquiryFormValues = z.infer<typeof enquirySchema>;
