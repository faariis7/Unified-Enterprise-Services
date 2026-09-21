import { z } from 'zod';

/**
 * Zod schema for Workspace validation
 */
export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  workspaceName: z.string().min(1, { message: "WorkspaceName is required" }),
  active: z.enum(['Active', 'Inactive', 'Suspended']),
  agentWorkspaceEnabled: z.boolean(),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "CreatedAt is required" }),
  createdBy: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  defaultCalendarId: z.string().optional(),
  defaultSiteId: z.string().optional(),
  defaultTimeZone: z.string().min(1, { message: "DefaultTimeZone is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  icon: z.string().min(1, { message: "Icon is required" }),
  ownerPersonId: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  primaryColor: z.string().min(1, { message: "PrimaryColor is required" }),
  requesterPortalEnabled: z.boolean(),
  requestNumberFormat: z.string().min(1, { message: "RequestNumberFormat is required" }),
  requestNumberPrefix: z.string().min(1, { message: "RequestNumberPrefix is required" }),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "UpdatedAt is required" }),
  updatedBy: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  workspaceKey: z.string().min(1, { message: "WorkspaceCode is required" }),
});

/**
 * Schema for creating a new Workspace (omits system-generated ID)
 */
export const CreateWorkspaceSchema = WorkspaceSchema.omit({ id: true });

/**
 * Schema for updating an existing Workspace
 */
export const UpdateWorkspaceSchema = WorkspaceSchema;

export type WorkspaceInput = z.infer<typeof WorkspaceSchema>;
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>;