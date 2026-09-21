import { z } from 'zod';

/**
 * Zod schema for AutomationAction validation
 */
export const AutomationActionSchema = z.object({
  id: z.string().uuid(),
  actionName: z.string().min(1, { message: "Action Name is required" }),
  actionTypeKey: z.enum(['Assign', 'UpdateField', 'ChangeStatus', 'CreateTask', 'StartApproval', 'SendNotification', 'AddComment', 'CallWebhook', 'SetTarget', 'Escalate']),
  approvalDefinition: z.object({ id: z.string().uuid(), name1: z.string() }).optional(),
  automationRule: z.object({ id: z.string().uuid(), name1: z.string() }),
  configuredValue: z.string().optional(),
  notificationMessage: z.string().optional(),
  sortOrder: z.number().int(),
  statusKey: z.enum(['Active', 'Inactive']),
  targetField: z.string().optional(),
  taskTitle: z.string().optional(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new AutomationAction (omits system-generated ID)
 */
export const CreateAutomationActionSchema = AutomationActionSchema.omit({ id: true });

/**
 * Schema for updating an existing AutomationAction
 */
export const UpdateAutomationActionSchema = AutomationActionSchema;

export type AutomationActionInput = z.infer<typeof AutomationActionSchema>;
export type CreateAutomationActionInput = z.infer<typeof CreateAutomationActionSchema>;
export type UpdateAutomationActionInput = z.infer<typeof UpdateAutomationActionSchema>;