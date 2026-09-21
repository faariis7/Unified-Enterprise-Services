import { z } from 'zod';

/**
 * Zod schema for ApprovalRule validation
 */
export const ApprovalRuleSchema = z.object({
  id: z.string().uuid(),
  ruleName: z.string().min(1, { message: "Rule Name is required" }),
  approvalStage: z.object({ id: z.string().uuid(), name1: z.string() }),
  approverTypeKey: z.enum(['Manager', 'Person', 'Role', 'Group']),
  conditionExpression: z.string().optional(),
  delegationAllowed: z.boolean(),
  escalationGroupCode: z.string().optional(),
  groupCode: z.string().optional(),
  minimumApprovals: z.number().int(),
  person: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  rejectionBehaviorKey: z.enum(['StopFlow', 'ContinueStage']),
  role: z.object({ id: z.string().uuid(), roleName: z.string() }).optional(),
  ruleOrder: z.number().int(),
  statusKey: z.enum(['Active', 'Inactive']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new ApprovalRule (omits system-generated ID)
 */
export const CreateApprovalRuleSchema = ApprovalRuleSchema.omit({ id: true });

/**
 * Schema for updating an existing ApprovalRule
 */
export const UpdateApprovalRuleSchema = ApprovalRuleSchema;

export type ApprovalRuleInput = z.infer<typeof ApprovalRuleSchema>;
export type CreateApprovalRuleInput = z.infer<typeof CreateApprovalRuleSchema>;
export type UpdateApprovalRuleInput = z.infer<typeof UpdateApprovalRuleSchema>;