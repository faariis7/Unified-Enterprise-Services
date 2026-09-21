import { z } from 'zod';

/**
 * Zod schema for ServiceTargetPolicy validation
 */
export const ServiceTargetPolicySchema = z.object({
  id: z.string().uuid(),
  name1: z.string().min(1, { message: "Name is required" }),
  active: z.boolean(),
  breachActionsKeys: z.array(z.enum(['NotifyAssignee', 'NotifyManager', 'EscalateAssignment', 'CreateActivity', 'StartAutomation'])),
  businessCalendar: z.object({ id: z.string().uuid(), name1: z.string() }),
  description: z.string().min(1, { message: "Description is required" }),
  durationMinutes: z.number().int(),
  effectiveDates: z.string().min(1, { message: "Effective Dates is required" }),
  pauseBehaviorKey: z.enum(['PauseOnConfiguredStatuses', 'NeverPause', 'ManualPause']),
  startEventKey: z.enum(['RequestCreated', 'RequestAssigned', 'WorkStarted', 'ApprovalStarted', 'CustomEvent']),
  stopEventKey: z.enum(['FirstResponse', 'RequestResolved', 'RequestClosed', 'FulfillmentCompleted', 'ApprovalCompleted', 'CustomEvent']),
  targetTypeKey: z.enum(['Response', 'Resolution', 'Fulfillment', 'Approval', 'Custom']),
  version: z.number().int(),
  warningThresholdPercent: z.number().int(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new ServiceTargetPolicy (omits system-generated ID)
 */
export const CreateServiceTargetPolicySchema = ServiceTargetPolicySchema.omit({ id: true });

/**
 * Schema for updating an existing ServiceTargetPolicy
 */
export const UpdateServiceTargetPolicySchema = ServiceTargetPolicySchema;

export type ServiceTargetPolicyInput = z.infer<typeof ServiceTargetPolicySchema>;
export type CreateServiceTargetPolicyInput = z.infer<typeof CreateServiceTargetPolicySchema>;
export type UpdateServiceTargetPolicyInput = z.infer<typeof UpdateServiceTargetPolicySchema>;