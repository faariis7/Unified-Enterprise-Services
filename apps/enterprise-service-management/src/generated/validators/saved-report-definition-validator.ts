import { z } from 'zod';

/**
 * Zod schema for SavedReportDefinition validation
 */
export const SavedReportDefinitionSchema = z.object({
  id: z.string().uuid(),
  name1: z.string().min(1, { message: "Name is required" }),
  accessPermissionKey: z.string().min(1, { message: "Access Permission Key is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created At is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  isDeleted: z.boolean(),
  ownerPerson: z.object({ id: z.string().uuid(), displayName: z.string() }),
  serviceCode: z.string().optional(),
  sharingScopeKey: z.enum(['Private', 'Workspace', 'Service']),
  statusKey: z.enum(['Active', 'Archived']),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Updated At is required" }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new SavedReportDefinition (omits system-generated ID)
 */
export const CreateSavedReportDefinitionSchema = SavedReportDefinitionSchema.omit({ id: true });

/**
 * Schema for updating an existing SavedReportDefinition
 */
export const UpdateSavedReportDefinitionSchema = SavedReportDefinitionSchema;

export type SavedReportDefinitionInput = z.infer<typeof SavedReportDefinitionSchema>;
export type CreateSavedReportDefinitionInput = z.infer<typeof CreateSavedReportDefinitionSchema>;
export type UpdateSavedReportDefinitionInput = z.infer<typeof UpdateSavedReportDefinitionSchema>;