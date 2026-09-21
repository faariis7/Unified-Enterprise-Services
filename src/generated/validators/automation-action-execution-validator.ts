import { z } from 'zod';

/**
 * Zod schema for AutomationActionExecution validation
 */
export const AutomationActionExecutionSchema = z.object({
  id: z.string().uuid(),
  idempotencyKey: z.string().min(1, { message: "Idempotency Key is required" }),
  automationAction: z.object({ id: z.string().uuid(), actionName: z.string() }).optional(),
  automationExecution: z.object({ id: z.string().uuid(), correlationKey: z.string() }),
  details: z.string().min(1, { message: "Details is required" }),
  executedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Executed At is required" }),
  request: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  statusKey: z.enum(['Succeeded', 'Failed', 'Skipped', 'Blocked']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new AutomationActionExecution (omits system-generated ID)
 */
export const CreateAutomationActionExecutionSchema = AutomationActionExecutionSchema.omit({ id: true });

/**
 * Schema for updating an existing AutomationActionExecution
 */
export const UpdateAutomationActionExecutionSchema = AutomationActionExecutionSchema;

export type AutomationActionExecutionInput = z.infer<typeof AutomationActionExecutionSchema>;
export type CreateAutomationActionExecutionInput = z.infer<typeof CreateAutomationActionExecutionSchema>;
export type UpdateAutomationActionExecutionInput = z.infer<typeof UpdateAutomationActionExecutionSchema>;