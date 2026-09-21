import { z } from 'zod';

/**
 * Zod schema for WorkspaceMembership validation
 */
export const WorkspaceMembershipSchema = z.object({
  id: z.string().uuid(),
  membershipLabel: z.string().min(1, { message: "Membership Label is required" }),
  active: z.enum(['Active', 'Inactive', 'Suspended']),
  addedBy: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "CreatedAt is required" }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  isDefaultWorkspace: z.boolean(),
  person: z.object({ id: z.string().uuid(), displayName: z.string() }),
  roleKey: z.enum(['Owner', 'Administrator', 'Manager', 'Agent', 'Approver', 'KnowledgePublisher', 'Auditor', 'Requester']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "StartDate is required" }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new WorkspaceMembership (omits system-generated ID)
 */
export const CreateWorkspaceMembershipSchema = WorkspaceMembershipSchema.omit({ id: true });

/**
 * Schema for updating an existing WorkspaceMembership
 */
export const UpdateWorkspaceMembershipSchema = WorkspaceMembershipSchema;

export type WorkspaceMembershipInput = z.infer<typeof WorkspaceMembershipSchema>;
export type CreateWorkspaceMembershipInput = z.infer<typeof CreateWorkspaceMembershipSchema>;
export type UpdateWorkspaceMembershipInput = z.infer<typeof UpdateWorkspaceMembershipSchema>;