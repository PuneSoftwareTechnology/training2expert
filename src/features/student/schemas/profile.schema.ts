import { z } from 'zod';

export const basicDetailsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  city: z.string().optional(),
  area: z.string().optional(),
});

export const educationSchema = z.object({
  graduation: z.string().optional(),
  graduationYear: z.coerce.number().min(1980).max(2030).optional(),
  postGraduation: z.string().optional(),
  pgYear: z.coerce.number().min(1980).max(2030).optional(),
  certifications: z.array(z.string()).default([]),
});

export const workExperienceSchema = z.object({
  employmentStatus: z.enum(['WORKING', 'NON_WORKING', 'FRESHER']),
  lastWorkedYear: z.coerce.number().min(1980).max(2030).optional(),
  itExperienceYears: z.coerce.number().min(0).max(50).default(0),
  itExperienceMonths: z.coerce.number().min(0).max(11).default(0),
  nonItExperienceYears: z.coerce.number().min(0).max(50).default(0),
  nonItExperienceMonths: z.coerce.number().min(0).max(11).default(0),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/\d/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type BasicDetailsFormValues = z.infer<typeof basicDetailsSchema>;
export type EducationFormValues = z.infer<typeof educationSchema>;
export type WorkExperienceFormValues = z.infer<typeof workExperienceSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
