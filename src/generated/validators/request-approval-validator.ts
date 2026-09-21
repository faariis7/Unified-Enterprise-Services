import { z } from 'zod';

/**
 * Zod schema for RequestApproval validation
 */
export const RequestApprovalSchema = z.object({
  id: z.string().uuid(),
  approvalName: z.string().min(1, { message: "ApprovalName is required" }),
  approvalDefinition: z.object({ id: z.string().uuid(), name1: z.string() }).optional(),
  approverGroupCode: z.string().optional(),
  approverPersonId: z.object({ id: z.string().uuid(), displayName: z.string() }),
  approverRole: z.object({ id: z.string().uuid(), roleName: z.string() }).optional(),
  approverTypeKey: z.enum(['Manager', 'Person', 'Role', 'Group']),
  comments: z.string().min(1, { message: "Comments is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "CreatedAt is required" }),
  decidedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "DecidedAt is required" }),
  delegatedFromPerson: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  requestId: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  stageNumber: z.number().int(),
  statusKey: z.enum(['Waiting', 'Pending', 'Approved', 'Rejected', 'Expired', 'Escalated', 'Cancelled']),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestApproval (omits system-generated ID)
 */
export const CreateRequestApprovalSchema = RequestApprovalSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestApproval
 */
export const UpdateRequestApprovalSchema = RequestApprovalSchema;

export type RequestApprovalInput = z.infer<typeof RequestApprovalSchema>;
export type CreateRequestApprovalInput = z.infer<typeof CreateRequestApprovalSchema>;
export type UpdateRequestApprovalInput = z.infer<typeof UpdateRequestApprovalSchema>;