import { z } from 'zod';

/**
 * Zod schema for BusinessRuleOverride validation
 */
export const BusinessRuleOverrideSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, { message: "Reason is required" }),
  businessRuleDefinition: z.object({ id: z.string().uuid(), name1: z.string() }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created At is required" }),
  createdBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  formVersion: z.object({ id: z.string().uuid(), snapshotLabel: z.string() }).optional(),
  isDeleted: z.boolean(),
  localOverrideModeKey: z.enum(['Inherit', 'Extend', 'Replace', 'Disable']),
  overrideCondition: z.string().optional(),
  overrideConfiguration: z.string().optional(),
  service: z.object({ id: z.string().uuid(), serviceName: z.string() }).optional(),
  statusKey: z.enum(['Active', 'Inactive']),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Updated At is required" }),
  updatedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new BusinessRuleOverride (omits system-generated ID)
 */
export const CreateBusinessRuleOverrideSchema = BusinessRuleOverrideSchema.omit({ id: true });

/**
 * Schema for updating an existing BusinessRuleOverride
 */
export const UpdateBusinessRuleOverrideSchema = BusinessRuleOverrideSchema;

export type BusinessRuleOverrideInput = z.infer<typeof BusinessRuleOverrideSchema>;
export type CreateBusinessRuleOverrideInput = z.infer<typeof CreateBusinessRuleOverrideSchema>;
export type UpdateBusinessRuleOverrideInput = z.infer<typeof UpdateBusinessRuleOverrideSchema>;