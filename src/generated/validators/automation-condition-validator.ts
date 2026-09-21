import { z } from 'zod';

/**
 * Zod schema for AutomationCondition validation
 */
export const AutomationConditionSchema = z.object({
  id: z.string().uuid(),
  conditionName: z.string().min(1, { message: "Condition Name is required" }),
  active: z.boolean(),
  automationRule: z.object({ id: z.string().uuid(), name1: z.string() }),
  comparisonValue: z.string().min(1, { message: "Comparison Value is required" }),
  conditionGroup: z.number().int(),
  conditionOrder: z.number().int(),
  fieldName: z.string().min(1, { message: "Field Name is required" }),
  groupLogicKey: z.enum(['AND', 'OR']),
  operatorKey: z.enum(['Equals', 'NotEquals', 'GreaterThan', 'GreaterThanOrEquals', 'LessThan', 'LessThanOrEquals', 'Contains', 'IsEmpty', 'IsNotEmpty']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new AutomationCondition (omits system-generated ID)
 */
export const CreateAutomationConditionSchema = AutomationConditionSchema.omit({ id: true });

/**
 * Schema for updating an existing AutomationCondition
 */
export const UpdateAutomationConditionSchema = AutomationConditionSchema;

export type AutomationConditionInput = z.infer<typeof AutomationConditionSchema>;
export type CreateAutomationConditionInput = z.infer<typeof CreateAutomationConditionSchema>;
export type UpdateAutomationConditionInput = z.infer<typeof UpdateAutomationConditionSchema>;