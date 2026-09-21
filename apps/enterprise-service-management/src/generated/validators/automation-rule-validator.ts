import { z } from 'zod';

/**
 * Zod schema for AutomationRule validation
 */
export const AutomationRuleSchema = z.object({
  id: z.string().uuid(),
  name1: z.string().min(1, { message: "Name is required" }),
  catalogItemCode: z.string().optional(),
  cooldownMinutes: z.number().int(),
  description: z.string().min(1, { message: "Description is required" }),
  destinationStatus: z.string().optional(),
  maximumChainDepth: z.number().int(),
  maximumExecutionsPerRequest: z.number().int(),
  ruleOrder: z.number().int(),
  runAsPerson: z.object({ id: z.string().uuid(), displayName: z.string() }),
  serviceCode: z.string().optional(),
  sourceStatus: z.string().optional(),
  statusKey: z.enum(['Active', 'Inactive']),
  stopProcessing: z.boolean(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new AutomationRule (omits system-generated ID)
 */
export const CreateAutomationRuleSchema = AutomationRuleSchema.omit({ id: true });

/**
 * Schema for updating an existing AutomationRule
 */
export const UpdateAutomationRuleSchema = AutomationRuleSchema;

export type AutomationRuleInput = z.infer<typeof AutomationRuleSchema>;
export type CreateAutomationRuleInput = z.infer<typeof CreateAutomationRuleSchema>;
export type UpdateAutomationRuleInput = z.infer<typeof UpdateAutomationRuleSchema>;