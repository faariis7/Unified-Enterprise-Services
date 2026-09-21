import { z } from 'zod';

/**
 * Zod schema for FieldVisibilityRule validation
 */
export const FieldVisibilityRuleSchema = z.object({
  id: z.string().uuid(),
  ruleName: z.string().min(1, { message: "Rule Name is required" }),
  comparisonValue: z.string().optional(),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  dependentFieldDefinition: z.object({ id: z.string().uuid(), label: z.string() }).optional(),
  effectKey: z.enum(['Show', 'Hide', 'Require', 'ReadOnly']),
  fieldDefinition: z.object({ id: z.string().uuid(), label: z.string() }),
  isDeleted: z.boolean().optional(),
  operatorKey: z.enum(['Equals', 'NotEquals', 'Contains', 'IsEmpty', 'IsNotEmpty']),
  sortOrder: z.number().int().optional(),
  statusKey: z.enum(['Active', 'Inactive']),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new FieldVisibilityRule (omits system-generated ID)
 */
export const CreateFieldVisibilityRuleSchema = FieldVisibilityRuleSchema.omit({ id: true });

/**
 * Schema for updating an existing FieldVisibilityRule
 */
export const UpdateFieldVisibilityRuleSchema = FieldVisibilityRuleSchema;

export type FieldVisibilityRuleInput = z.infer<typeof FieldVisibilityRuleSchema>;
export type CreateFieldVisibilityRuleInput = z.infer<typeof CreateFieldVisibilityRuleSchema>;
export type UpdateFieldVisibilityRuleInput = z.infer<typeof UpdateFieldVisibilityRuleSchema>;