import { z } from 'zod';

/**
 * Zod schema for AutomationLog validation
 */
export const AutomationLogSchema = z.object({
  id: z.string().uuid(),
  logName: z.string().min(1, { message: "Log Name is required" }),
  actionSummary: z.string().min(1, { message: "Action Summary is required" }),
  automationExecution: z.object({ id: z.string().uuid(), correlationKey: z.string() }),
  automationRule: z.object({ id: z.string().uuid(), name1: z.string() }),
  automationTrigger: z.object({ id: z.string().uuid(), triggerName: z.string() }),
  completedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Completed At is required" }),
  conditionSummary: z.string().min(1, { message: "Condition Summary is required" }),
  correlationKey: z.string().min(1, { message: "Correlation Key is required" }),
  depth: z.number().int(),
  loopPreventionReason: z.string().optional(),
  outcomeKey: z.enum(['Succeeded', 'Skipped', 'Blocked', 'Failed']),
  request: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  startedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Started At is required" }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new AutomationLog (omits system-generated ID)
 */
export const CreateAutomationLogSchema = AutomationLogSchema.omit({ id: true });

/**
 * Schema for updating an existing AutomationLog
 */
export const UpdateAutomationLogSchema = AutomationLogSchema;

export type AutomationLogInput = z.infer<typeof AutomationLogSchema>;
export type CreateAutomationLogInput = z.infer<typeof CreateAutomationLogSchema>;
export type UpdateAutomationLogInput = z.infer<typeof UpdateAutomationLogSchema>;