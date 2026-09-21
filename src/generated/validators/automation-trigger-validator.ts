import { z } from 'zod';

/**
 * Zod schema for AutomationTrigger validation
 */
export const AutomationTriggerSchema = z.object({
  id: z.string().uuid(),
  triggerName: z.string().min(1, { message: "Trigger Name is required" }),
  active: z.boolean(),
  automationRule: z.object({ id: z.string().uuid(), name1: z.string() }),
  eventFilters: z.string().min(1, { message: "Event Filters is required" }),
  scheduleExpression: z.string().optional(),
  triggerTypeKey: z.enum(['RequestCreated', 'RequestUpdated', 'StatusChanged', 'AssignmentChanged', 'ApprovalCompleted', 'TargetWarning', 'TargetBreached', 'CommentAdded', 'Scheduled']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new AutomationTrigger (omits system-generated ID)
 */
export const CreateAutomationTriggerSchema = AutomationTriggerSchema.omit({ id: true });

/**
 * Schema for updating an existing AutomationTrigger
 */
export const UpdateAutomationTriggerSchema = AutomationTriggerSchema;

export type AutomationTriggerInput = z.infer<typeof AutomationTriggerSchema>;
export type CreateAutomationTriggerInput = z.infer<typeof CreateAutomationTriggerSchema>;
export type UpdateAutomationTriggerInput = z.infer<typeof UpdateAutomationTriggerSchema>;