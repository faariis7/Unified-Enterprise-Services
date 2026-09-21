import { z } from 'zod';

/**
 * Zod schema for WorkspaceSettingOverride validation
 */
export const WorkspaceSettingOverrideSchema = z.object({
  id: z.string().uuid(),
  workspaceSettingOverrideName: z.string().min(1, { message: "Workspace Setting Override Name is required" }),
  active: z.boolean(),
  globalSetting: z.object({ id: z.string().uuid(), settingKey: z.string() }),
  overrideValue: z.string().min(1, { message: "Override Value is required" }),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Updated At is required" }),
  updatedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new WorkspaceSettingOverride (omits system-generated ID)
 */
export const CreateWorkspaceSettingOverrideSchema = WorkspaceSettingOverrideSchema.omit({ id: true });

/**
 * Schema for updating an existing WorkspaceSettingOverride
 */
export const UpdateWorkspaceSettingOverrideSchema = WorkspaceSettingOverrideSchema;

export type WorkspaceSettingOverrideInput = z.infer<typeof WorkspaceSettingOverrideSchema>;
export type CreateWorkspaceSettingOverrideInput = z.infer<typeof CreateWorkspaceSettingOverrideSchema>;
export type UpdateWorkspaceSettingOverrideInput = z.infer<typeof UpdateWorkspaceSettingOverrideSchema>;