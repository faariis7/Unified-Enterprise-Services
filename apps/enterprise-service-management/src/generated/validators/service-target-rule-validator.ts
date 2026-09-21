import { z } from 'zod';

/**
 * Zod schema for ServiceTargetRule validation
 */
export const ServiceTargetRuleSchema = z.object({
  id: z.string().uuid(),
  ruleName: z.string().min(1, { message: "Rule Name is required" }),
  active: z.boolean(),
  catalogItemCode: z.string().optional(),
  fieldOperatorValueConditions: z.string().min(1, { message: "Field Operator Value Conditions is required" }),
  impact: z.string().optional(),
  priorityKey: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  requestTypeCode: z.string().optional(),
  serviceCode: z.string().optional(),
  serviceTargetPolicy: z.object({ id: z.string().uuid(), name1: z.string() }),
  sortOrder: z.number().int(),
  urgency: z.string().optional(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new ServiceTargetRule (omits system-generated ID)
 */
export const CreateServiceTargetRuleSchema = ServiceTargetRuleSchema.omit({ id: true });

/**
 * Schema for updating an existing ServiceTargetRule
 */
export const UpdateServiceTargetRuleSchema = ServiceTargetRuleSchema;

export type ServiceTargetRuleInput = z.infer<typeof ServiceTargetRuleSchema>;
export type CreateServiceTargetRuleInput = z.infer<typeof CreateServiceTargetRuleSchema>;
export type UpdateServiceTargetRuleInput = z.infer<typeof UpdateServiceTargetRuleSchema>;