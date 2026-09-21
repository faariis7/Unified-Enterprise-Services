import { z } from 'zod';

/**
 * Zod schema for DashboardDefinition validation
 */
export const DashboardDefinitionSchema = z.object({
  id: z.string().uuid(),
  name1: z.string().min(1, { message: "Name is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created At is required" }),
  isDeleted: z.boolean(),
  layoutJSON: z.string().min(1, { message: "Layout JSON is required" }),
  ownerPerson: z.object({ id: z.string().uuid(), displayName: z.string() }),
  sharingScopeKey: z.enum(['Private', 'Workspace', 'Service']),
  statusKey: z.enum(['Active', 'Archived']),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Updated At is required" }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new DashboardDefinition (omits system-generated ID)
 */
export const CreateDashboardDefinitionSchema = DashboardDefinitionSchema.omit({ id: true });

/**
 * Schema for updating an existing DashboardDefinition
 */
export const UpdateDashboardDefinitionSchema = DashboardDefinitionSchema;

export type DashboardDefinitionInput = z.infer<typeof DashboardDefinitionSchema>;
export type CreateDashboardDefinitionInput = z.infer<typeof CreateDashboardDefinitionSchema>;
export type UpdateDashboardDefinitionInput = z.infer<typeof UpdateDashboardDefinitionSchema>;