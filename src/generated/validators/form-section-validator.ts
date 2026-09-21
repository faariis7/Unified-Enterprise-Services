import { z } from 'zod';

/**
 * Zod schema for FormSection validation
 */
export const FormSectionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, { message: "Title is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  description: z.string().min(1, { message: "Description is required" }),
  formDefinition: z.object({ id: z.string().uuid(), name1: z.string() }),
  formVersionID: z.object({ id: z.string().uuid(), snapshotLabel: z.string() }),
  instructions: z.string().optional(),
  isDeleted: z.boolean().optional(),
  sortOrder: z.number().int(),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new FormSection (omits system-generated ID)
 */
export const CreateFormSectionSchema = FormSectionSchema.omit({ id: true });

/**
 * Schema for updating an existing FormSection
 */
export const UpdateFormSectionSchema = FormSectionSchema;

export type FormSectionInput = z.infer<typeof FormSectionSchema>;
export type CreateFormSectionInput = z.infer<typeof CreateFormSectionSchema>;
export type UpdateFormSectionInput = z.infer<typeof UpdateFormSectionSchema>;