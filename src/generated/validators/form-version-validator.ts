import { z } from 'zod';

/**
 * Zod schema for FormVersion validation
 */
export const FormVersionSchema = z.object({
  id: z.string().uuid(),
  snapshotLabel: z.string().min(1, { message: "Snapshot Label is required" }),
  configurationSnapshot: z.string().optional(),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  formDefinition: z.object({ id: z.string().uuid(), name1: z.string() }),
  isDeleted: z.boolean().optional(),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  publishedBy: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  statusKey: z.enum(['Draft', 'Published', 'Retired']),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  versionNumber: z.number().int(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new FormVersion (omits system-generated ID)
 */
export const CreateFormVersionSchema = FormVersionSchema.omit({ id: true });

/**
 * Schema for updating an existing FormVersion
 */
export const UpdateFormVersionSchema = FormVersionSchema;

export type FormVersionInput = z.infer<typeof FormVersionSchema>;
export type CreateFormVersionInput = z.infer<typeof CreateFormVersionSchema>;
export type UpdateFormVersionInput = z.infer<typeof UpdateFormVersionSchema>;