import { z } from 'zod';

/**
 * Zod schema for ApprovalStage validation
 */
export const ApprovalStageSchema = z.object({
  id: z.string().uuid(),
  name1: z.string().min(1, { message: "Name is required" }),
  activationModeKey: z.enum(['Sequential', 'Parallel']),
  approvalDefinition: z.object({ id: z.string().uuid(), name1: z.string() }),
  completionRuleKey: z.enum(['Any', 'All']),
  escalationMinutes: z.number().int(),
  executionModeKey: z.enum(['Sequential', 'Parallel']),
  expirationMinutes: z.number().int(),
  minimumApprovals: z.number().int(),
  rejectionBehaviorKey: z.enum(['StopFlow', 'ContinueFlow']),
  stageNumber: z.number().int(),
  statusKey: z.enum(['Active', 'Inactive']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new ApprovalStage (omits system-generated ID)
 */
export const CreateApprovalStageSchema = ApprovalStageSchema.omit({ id: true });

/**
 * Schema for updating an existing ApprovalStage
 */
export const UpdateApprovalStageSchema = ApprovalStageSchema;

export type ApprovalStageInput = z.infer<typeof ApprovalStageSchema>;
export type CreateApprovalStageInput = z.infer<typeof CreateApprovalStageSchema>;
export type UpdateApprovalStageInput = z.infer<typeof UpdateApprovalStageSchema>;