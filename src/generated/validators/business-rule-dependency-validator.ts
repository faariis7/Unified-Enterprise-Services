import { z } from 'zod';

/**
 * Zod schema for BusinessRuleDependency validation
 */
export const BusinessRuleDependencySchema = z.object({
  id: z.string().uuid(),
  displayLabel: z.string().min(1, { message: "Display Label is required" }),
  businessRuleVersion: z.object({ id: z.string().uuid(), snapshotLabel: z.string() }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created At is required" }),
  dependencyTypeKey: z.enum(['Field', 'Rule', 'Service', 'Workflow', 'Lifecycle', 'Approval', 'SLA', 'Report']),
  isDeleted: z.boolean(),
  referencedRecordIDOrKey: z.string().min(1, { message: "Referenced Record ID or Key is required" }),
  required: z.boolean(),
  statusKey: z.enum(['Active', 'Inactive']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new BusinessRuleDependency (omits system-generated ID)
 */
export const CreateBusinessRuleDependencySchema = BusinessRuleDependencySchema.omit({ id: true });

/**
 * Schema for updating an existing BusinessRuleDependency
 */
export const UpdateBusinessRuleDependencySchema = BusinessRuleDependencySchema;

export type BusinessRuleDependencyInput = z.infer<typeof BusinessRuleDependencySchema>;
export type CreateBusinessRuleDependencyInput = z.infer<typeof CreateBusinessRuleDependencySchema>;
export type UpdateBusinessRuleDependencyInput = z.infer<typeof UpdateBusinessRuleDependencySchema>;