import { z } from 'zod';

/**
 * Zod schema for WorkspaceModule validation
 */
export const WorkspaceModuleSchema = z.object({
  id: z.string().uuid(),
  workspaceModuleName: z.string().min(1, { message: "WorkspaceModuleName is required" }),
  configurationStatusKey: z.enum(['Configured', 'Draft', 'Disabled']),
  displayNameOverride: z.string().optional(),
  enabled: z.boolean(),
  enabledAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  enabledBy: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  moduleDefinition: z.object({ id: z.string().uuid(), moduleName: z.string() }),
  sortOrder: z.number().int().optional(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new WorkspaceModule (omits system-generated ID)
 */
export const CreateWorkspaceModuleSchema = WorkspaceModuleSchema.omit({ id: true });

/**
 * Schema for updating an existing WorkspaceModule
 */
export const UpdateWorkspaceModuleSchema = WorkspaceModuleSchema;

export type WorkspaceModuleInput = z.infer<typeof WorkspaceModuleSchema>;
export type CreateWorkspaceModuleInput = z.infer<typeof CreateWorkspaceModuleSchema>;
export type UpdateWorkspaceModuleInput = z.infer<typeof UpdateWorkspaceModuleSchema>;