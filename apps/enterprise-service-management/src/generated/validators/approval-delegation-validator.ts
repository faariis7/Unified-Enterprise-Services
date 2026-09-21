import { z } from 'zod';

/**
 * Zod schema for ApprovalDelegation validation
 */
export const ApprovalDelegationSchema = z.object({
  id: z.string().uuid(),
  delegationName: z.string().min(1, { message: "Delegation Name is required" }),
  approvalDefinition: z.object({ id: z.string().uuid(), name1: z.string() }).optional(),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created At is required" }),
  delegatePerson: z.object({ id: z.string().uuid(), displayName: z.string() }),
  delegatorPerson: z.object({ id: z.string().uuid(), displayName: z.string() }),
  endAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "End At is required" }),
  reason: z.string().optional(),
  scopeReference: z.string().optional(),
  scopeTypeKey: z.enum(['AllApprovals', 'Definition', 'Group']),
  startAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Start At is required" }),
  statusKey: z.enum(['Active', 'Inactive']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new ApprovalDelegation (omits system-generated ID)
 */
export const CreateApprovalDelegationSchema = ApprovalDelegationSchema.omit({ id: true });

/**
 * Schema for updating an existing ApprovalDelegation
 */
export const UpdateApprovalDelegationSchema = ApprovalDelegationSchema;

export type ApprovalDelegationInput = z.infer<typeof ApprovalDelegationSchema>;
export type CreateApprovalDelegationInput = z.infer<typeof CreateApprovalDelegationSchema>;
export type UpdateApprovalDelegationInput = z.infer<typeof UpdateApprovalDelegationSchema>;