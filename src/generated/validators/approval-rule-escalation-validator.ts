import { z } from 'zod';

/**
 * Zod schema for ApprovalRuleEscalation validation
 */
export const ApprovalRuleEscalationSchema = z.object({
  id: z.string().uuid(),
  escalationName: z.string().min(1, { message: "Escalation Name is required" }),
  approvalRule: z.object({ id: z.string().uuid(), ruleName: z.string() }),
  escalationApproverTypeKey: z.enum(['Manager', 'Person', 'Role', 'Group']).optional(),
  escalationGroupCode: z.string().optional(),
  escalationPerson: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  escalationRole: z.object({ id: z.string().uuid(), roleName: z.string() }).optional(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new ApprovalRuleEscalation (omits system-generated ID)
 */
export const CreateApprovalRuleEscalationSchema = ApprovalRuleEscalationSchema.omit({ id: true });

/**
 * Schema for updating an existing ApprovalRuleEscalation
 */
export const UpdateApprovalRuleEscalationSchema = ApprovalRuleEscalationSchema;

export type ApprovalRuleEscalationInput = z.infer<typeof ApprovalRuleEscalationSchema>;
export type CreateApprovalRuleEscalationInput = z.infer<typeof CreateApprovalRuleEscalationSchema>;
export type UpdateApprovalRuleEscalationInput = z.infer<typeof UpdateApprovalRuleEscalationSchema>;