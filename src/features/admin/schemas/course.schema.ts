import { z } from "zod";

export const courseSchema = z.object({
  name: z.string().trim().min(1, "Course name is required").max(150),
  isActive: z.boolean().optional(),
});

export type CourseFormValues = z.infer<typeof courseSchema>;
