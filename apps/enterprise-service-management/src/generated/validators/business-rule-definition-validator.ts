import { z } from 'zod';

/**
 * Zod schema for BusinessRuleDefinition validation
 */
export const BusinessRuleDefinitionSchema = z.object({
  id: z.string().uuid(),
  name1: z.string().min(1, { message: "Name is required" }),
  allowLocalOverrides: z.boolean(),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created At is required" }),
  currentPublishedVersion: z.object({ id: z.string().uuid(), snapshotLabel: z.string() }).optional(),
  description: z.string().min(1, { message: "Description is required" }),
  isDeleted: z.boolean(),
  ownerPerson: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  ruleTypeKey: z.enum(['Validation', 'Eligibility', 'Assignment', 'Approval', 'Workflow', 'SLA']),
  stableRuleKey: z.string().min(1, { message: "Stable Rule Key is required" }),
  statusKey: z.enum(['Draft', 'Published', 'Retired']),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Updated At is required" }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new BusinessRuleDefinition (omits system-generated ID)
 */
export const CreateBusinessRuleDefinitionSchema = BusinessRuleDefinitionSchema.omit({ id: true });

/**
 * Schema for updating an existing BusinessRuleDefinition
 */
export const UpdateBusinessRuleDefinitionSchema = BusinessRuleDefinitionSchema;

export type BusinessRuleDefinitionInput = z.infer<typeof BusinessRuleDefinitionSchema>;
export type CreateBusinessRuleDefinitionInput = z.infer<typeof CreateBusinessRuleDefinitionSchema>;
export type UpdateBusinessRuleDefinitionInput = z.infer<typeof UpdateBusinessRuleDefinitionSchema>;