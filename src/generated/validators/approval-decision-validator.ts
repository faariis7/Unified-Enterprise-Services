import { z } from 'zod';

/**
 * Zod schema for ApprovalDecision validation
 */
export const ApprovalDecisionSchema = z.object({
  id: z.string().uuid(),
  decisionName: z.string().min(1, { message: "Decision Name is required" }),
  actingFor: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  comments: z.string().optional(),
  decidedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Decided At is required" }),
  decidedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  decisionKey: z.enum(['Approved', 'Rejected', 'Abstained', 'Expired', 'Escalated']),
  requestApproval: z.object({ id: z.string().uuid(), approvalName: z.string() }),
  source: z.string().min(1, { message: "Source is required" }),
  targetRecordID: z.string().min(1, { message: "Target Record ID is required" }),
  targetTypeKey: z.enum(['Request', 'Change', 'Generic']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new ApprovalDecision (omits system-generated ID)
 */
export const CreateApprovalDecisionSchema = ApprovalDecisionSchema.omit({ id: true });

/**
 * Schema for updating an existing ApprovalDecision
 */
export const UpdateApprovalDecisionSchema = ApprovalDecisionSchema;

export type ApprovalDecisionInput = z.infer<typeof ApprovalDecisionSchema>;
export type CreateApprovalDecisionInput = z.infer<typeof CreateApprovalDecisionSchema>;
export type UpdateApprovalDecisionInput = z.infer<typeof UpdateApprovalDecisionSchema>;