import { z } from 'zod';

/**
 * Zod schema for ContractActivity validation
 */
export const ContractActivitySchema = z.object({
  id: z.string().uuid(),
  summary: z.string().min(1, { message: "Summary is required" }),
  activityTypeKey: z.enum(['Created', 'Updated', 'StatusChanged', 'RenewalAction', 'ObligationAction', 'DocumentAction']),
  actorPerson: z.object({ id: z.string().uuid(), displayName: z.string() }),
  contract: z.object({ id: z.string().uuid(), title: z.string() }),
  details: z.string().min(1, { message: "Details is required" }),
  fieldName: z.string().optional(),
  newValue: z.string().optional(),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Occurred At is required" }),
  previousValue: z.string().optional(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new ContractActivity (omits system-generated ID)
 */
export const CreateContractActivitySchema = ContractActivitySchema.omit({ id: true });

/**
 * Schema for updating an existing ContractActivity
 */
export const UpdateContractActivitySchema = ContractActivitySchema;

export type ContractActivityInput = z.infer<typeof ContractActivitySchema>;
export type CreateContractActivityInput = z.infer<typeof CreateContractActivitySchema>;
export type UpdateContractActivityInput = z.infer<typeof UpdateContractActivitySchema>;