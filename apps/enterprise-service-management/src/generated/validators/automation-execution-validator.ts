import { z } from 'zod';

/**
 * Zod schema for AutomationExecution validation
 */
export const AutomationExecutionSchema = z.object({
  id: z.string().uuid(),
  correlationKey: z.string().min(1, { message: "Correlation Key is required" }),
  actorPerson: z.object({ id: z.string().uuid(), displayName: z.string() }),
  automationRule: z.object({ id: z.string().uuid(), name1: z.string() }).optional(),
  completedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Completed At is required" }),
  depth: z.number().int(),
  failureCode: z.string().optional(),
  failureMessage: z.string().optional(),
  request: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  source: z.string().min(1, { message: "Source is required" }),
  startedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Started At is required" }),
  statusKey: z.enum(['Running', 'Succeeded', 'Failed', 'Skipped', 'Blocked']),
  triggerKey: z.enum(['Create', 'Update', 'StatusChange', 'Assignment', 'Approval', 'TargetWarning', 'TargetBreach', 'Reply', 'Resolution', 'Schedule']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new AutomationExecution (omits system-generated ID)
 */
export const CreateAutomationExecutionSchema = AutomationExecutionSchema.omit({ id: true });

/**
 * Schema for updating an existing AutomationExecution
 */
export const UpdateAutomationExecutionSchema = AutomationExecutionSchema;

export type AutomationExecutionInput = z.infer<typeof AutomationExecutionSchema>;
export type CreateAutomationExecutionInput = z.infer<typeof CreateAutomationExecutionSchema>;
export type UpdateAutomationExecutionInput = z.infer<typeof UpdateAutomationExecutionSchema>;