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
  isActive: z.boolean().optional(),
});

export type TrainerFormValues = z.infer<typeof trainerSchema>;
