import { z } from 'zod';

/**
 * Zod schema for FieldValidationRule validation
 */
export const FieldValidationRuleSchema = z.object({
  id: z.string().uuid(),
  errorMessage: z.string().min(1, { message: "Error Message is required" }),
  comparisonValue: z.string().min(1, { message: "Comparison Value is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  fieldDefinition: z.object({ id: z.string().uuid(), label: z.string() }),
  isDeleted: z.boolean().optional(),
  ruleTypeKey: z.enum(['MinimumLength', 'MaximumLength', 'MinimumValue', 'MaximumValue', 'Pattern', 'Email', 'Phone', 'URL']),
  sortOrder: z.number().int().optional(),
  statusKey: z.enum(['Active', 'Inactive']),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new FieldValidationRule (omits system-generated ID)
 */
export const CreateFieldValidationRuleSchema = FieldValidationRuleSchema.omit({ id: true });

/**
 * Schema for updating an existing FieldValidationRule
 */
export const UpdateFieldValidationRuleSchema = FieldValidationRuleSchema;

export type FieldValidationRuleInput = z.infer<typeof FieldValidationRuleSchema>;
export type CreateFieldValidationRuleInput = z.infer<typeof CreateFieldValidationRuleSchema>;
export type UpdateFieldValidationRuleInput = z.infer<typeof UpdateFieldValidationRuleSchema>;