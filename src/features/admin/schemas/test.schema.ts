import { z } from 'zod';

export const questionSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  options: z.array(z.string().min(1)).length(4, 'Must have exactly 4 options'),
  correctOptionIndex: z.coerce.number().min(0).max(3),
});

export const testSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  course: z.string().min(1, 'Course is required'),
  durationMinutes: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
  questions: z.array(questionSchema).min(1, 'At least one question required'),
});

export type TestFormValues = z.infer<typeof testSchema>;
