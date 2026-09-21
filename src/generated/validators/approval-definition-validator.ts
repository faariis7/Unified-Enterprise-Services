import { z } from 'zod';

/**
 * Zod schema for ApprovalDefinition validation
 */
export const ApprovalDefinitionSchema = z.object({
  id: z.string().uuid(),
  name1: z.string().min(1, { message: "Name is required" }),
  catalogItemCode: z.string().optional(),
  completionRuleKey: z.enum(['Any', 'All']),
  description: z.string().min(1, { message: "Description is required" }),
  escalationMinutes: z.number().int(),
  executionModeKey: z.enum(['Sequential', 'Parallel']),
  expirationMinutes: z.number().int(),
  reminderMinutes: z.number().int(),
  serviceCode: z.string().optional(),
  statusKey: z.enum(['Active', 'Inactive']),
  targetReference: z.string().optional(),
  targetTypeKey: z.enum(['CatalogItem', 'Request', 'Change', 'Generic']),
  version: z.number().int(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new ApprovalDefinition (omits system-generated ID)
 */
export const CreateApprovalDefinitionSchema = ApprovalDefinitionSchema.omit({ id: true });

/**
 * Schema for updating an existing ApprovalDefinition
 */
export const UpdateApprovalDefinitionSchema = ApprovalDefinitionSchema;

export type ApprovalDefinitionInput = z.infer<typeof ApprovalDefinitionSchema>;
export type CreateApprovalDefinitionInput = z.infer<typeof CreateApprovalDefinitionSchema>;
export type UpdateApprovalDefinitionInput = z.infer<typeof UpdateApprovalDefinitionSchema>;