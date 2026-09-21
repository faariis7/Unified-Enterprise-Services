import { z } from 'zod';

/**
 * Zod schema for FieldOption validation
 */
export const FieldOptionSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1, { message: "Label is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  fieldDefinition: z.object({ id: z.string().uuid(), label: z.string() }),
  isDeleted: z.boolean().optional(),
  parentOption: z.object({ id: z.string().uuid(), label: z.string() }).optional(),
  sortOrder: z.number().int(),
  statusKey: z.enum(['Active', 'Inactive']),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  value: z.string().min(1, { message: "Value is required" }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new FieldOption (omits system-generated ID)
 */
export const CreateFieldOptionSchema = FieldOptionSchema.omit({ id: true });

/**
 * Schema for updating an existing FieldOption
 */
export const UpdateFieldOptionSchema = FieldOptionSchema;

export type FieldOptionInput = z.infer<typeof FieldOptionSchema>;
export type CreateFieldOptionInput = z.infer<typeof CreateFieldOptionSchema>;
export type UpdateFieldOptionInput = z.infer<typeof UpdateFieldOptionSchema>;