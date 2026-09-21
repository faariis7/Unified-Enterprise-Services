import { z } from 'zod';

/**
 * Zod schema for BusinessRuleUsage validation
 */
export const BusinessRuleUsageSchema = z.object({
  id: z.string().uuid(),
  consumerLabel: z.string().min(1, { message: "Consumer Label is required" }),
  businessRuleVersion: z.object({ id: z.string().uuid(), snapshotLabel: z.string() }),
  consumerRecordID: z.string().min(1, { message: "Consumer Record ID is required" }),
  consumerTypeKey: z.enum(['Service', 'FormVersion', 'FieldDefinition', 'Workflow', 'Lifecycle', 'Approval', 'SLA', 'Report']),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created At is required" }),
  isDeleted: z.boolean(),
  statusKey: z.enum(['Active', 'Inactive']),
  usageContext: z.string().min(1, { message: "Usage Context is required" }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new BusinessRuleUsage (omits system-generated ID)
 */
export const CreateBusinessRuleUsageSchema = BusinessRuleUsageSchema.omit({ id: true });

/**
 * Schema for updating an existing BusinessRuleUsage
 */
export const UpdateBusinessRuleUsageSchema = BusinessRuleUsageSchema;

export type BusinessRuleUsageInput = z.infer<typeof BusinessRuleUsageSchema>;
export type CreateBusinessRuleUsageInput = z.infer<typeof CreateBusinessRuleUsageSchema>;
export type UpdateBusinessRuleUsageInput = z.infer<typeof UpdateBusinessRuleUsageSchema>;