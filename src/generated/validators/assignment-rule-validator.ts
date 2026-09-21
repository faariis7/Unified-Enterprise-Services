import { z } from 'zod';

/**
 * Zod schema for AssignmentRule validation
 */
export const AssignmentRuleSchema = z.object({
  id: z.string().uuid(),
  name1: z.string().min(1, { message: "Name is required" }),
  catalogItemCode: z.string().optional(),
  departmentCode: z.string().optional(),
  destinationGroupCode: z.string().min(1, { message: "Destination Group Code is required" }),
  destinationPerson: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  priorityKey: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  serviceCode: z.string().optional(),
  siteCode: z.string().optional(),
  sortOrder: z.number().int(),
  statusKey: z.enum(['Active', 'Inactive']),
  stopProcessing: z.boolean(),
  triggerKey: z.enum(['Create', 'Update', 'StatusChange', 'Reply', 'Resolution']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new AssignmentRule (omits system-generated ID)
 */
export const CreateAssignmentRuleSchema = AssignmentRuleSchema.omit({ id: true });

/**
 * Schema for updating an existing AssignmentRule
 */
export const UpdateAssignmentRuleSchema = AssignmentRuleSchema;

export type AssignmentRuleInput = z.infer<typeof AssignmentRuleSchema>;
export type CreateAssignmentRuleInput = z.infer<typeof CreateAssignmentRuleSchema>;
export type UpdateAssignmentRuleInput = z.infer<typeof UpdateAssignmentRuleSchema>;