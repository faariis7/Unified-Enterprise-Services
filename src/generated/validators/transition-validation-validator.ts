import { z } from 'zod';

/**
 * Zod schema for TransitionValidation validation
 */
export const TransitionValidationSchema = z.object({
  id: z.string().uuid(),
  errorMessage: z.string().min(1, { message: "Error Message is required" }),
  expectedValue: z.string().optional(),
  fieldCode: z.string().optional(),
  sortOrder: z.number().int(),
  statusKey: z.enum(['Active', 'Inactive']),
  statusTransitionID: z.object({ id: z.string().uuid(), transitionName: z.string() }),
  validationTypeKey: z.enum(['FieldRequired', 'ExpectedValue', 'CompletedTasks', 'ApprovalsComplete', 'ResolutionRequired', 'MandatoryComment']),
  workspaceID: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new TransitionValidation (omits system-generated ID)
 */
export const CreateTransitionValidationSchema = TransitionValidationSchema.omit({ id: true });

/**
 * Schema for updating an existing TransitionValidation
 */
export const UpdateTransitionValidationSchema = TransitionValidationSchema;

export type TransitionValidationInput = z.infer<typeof TransitionValidationSchema>;
export type CreateTransitionValidationInput = z.infer<typeof CreateTransitionValidationSchema>;
export type UpdateTransitionValidationInput = z.infer<typeof UpdateTransitionValidationSchema>;