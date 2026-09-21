import { z } from 'zod';

/**
 * Zod schema for BusinessRuleVersion validation
 */
export const BusinessRuleVersionSchema = z.object({
  id: z.string().uuid(),
  snapshotLabel: z.string().min(1, { message: "Snapshot Label is required" }),
  businessRuleDefinition: z.object({ id: z.string().uuid(), name1: z.string() }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created At is required" }),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  immutableConditionExpression: z.string().min(1, { message: "Immutable Condition Expression is required" }),
  immutableOutcomeConfiguration: z.string().min(1, { message: "Immutable Outcome Configuration is required" }),
  isDeleted: z.boolean(),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  publishedBy: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  statusKey: z.enum(['Draft', 'Published', 'Retired']),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Updated At is required" }),
  versionNumber: z.number().int(),
});

/**
 * Schema for creating a new BusinessRuleVersion (omits system-generated ID)
 */
export const CreateBusinessRuleVersionSchema = BusinessRuleVersionSchema.omit({ id: true });

/**
 * Schema for updating an existing BusinessRuleVersion
 */
export const UpdateBusinessRuleVersionSchema = BusinessRuleVersionSchema;

export type BusinessRuleVersionInput = z.infer<typeof BusinessRuleVersionSchema>;
export type CreateBusinessRuleVersionInput = z.infer<typeof CreateBusinessRuleVersionSchema>;
export type UpdateBusinessRuleVersionInput = z.infer<typeof UpdateBusinessRuleVersionSchema>;