import { z } from 'zod';

/**
 * Zod schema for WorkspaceRoleAssignment validation
 */
export const WorkspaceRoleAssignmentSchema = z.object({
  id: z.string().uuid(),
  workspaceRoleAssignmentName: z.string().min(1, { message: "Workspace Role Assignment Name is required" }),
  assignedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "CreatedAt is required" }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  personId: z.object({ id: z.string().uuid(), displayName: z.string() }),
  roleId: z.object({ id: z.string().uuid(), roleName: z.string() }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "StartDate is required" }),
  statusKey: z.enum(['Active', 'Inactive', 'Suspended']),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new WorkspaceRoleAssignment (omits system-generated ID)
 */
export const CreateWorkspaceRoleAssignmentSchema = WorkspaceRoleAssignmentSchema.omit({ id: true });

/**
 * Schema for updating an existing WorkspaceRoleAssignment
 */
export const UpdateWorkspaceRoleAssignmentSchema = WorkspaceRoleAssignmentSchema;

export type WorkspaceRoleAssignmentInput = z.infer<typeof WorkspaceRoleAssignmentSchema>;
export type CreateWorkspaceRoleAssignmentInput = z.infer<typeof CreateWorkspaceRoleAssignmentSchema>;
export type UpdateWorkspaceRoleAssignmentInput = z.infer<typeof UpdateWorkspaceRoleAssignmentSchema>;