import { z } from 'zod';

/**
 * Zod schema for LifecycleTransitionRequiredField validation
 */
export const LifecycleTransitionRequiredFieldSchema = z.object({
  id: z.string().uuid(),
  fieldLabel: z.string().min(1, { message: "Field Label is required" }),
  fieldName: z.string().min(1, { message: "Field Name is required" }),
  statusKey: z.enum(['Active', 'Inactive']),
  transition: z.object({ id: z.string().uuid(), transitionName: z.string() }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new LifecycleTransitionRequiredField (omits system-generated ID)
 */
export const CreateLifecycleTransitionRequiredFieldSchema = LifecycleTransitionRequiredFieldSchema.omit({ id: true });

/**
 * Schema for updating an existing LifecycleTransitionRequiredField
 */
export const UpdateLifecycleTransitionRequiredFieldSchema = LifecycleTransitionRequiredFieldSchema;

export type LifecycleTransitionRequiredFieldInput = z.infer<typeof LifecycleTransitionRequiredFieldSchema>;
export type CreateLifecycleTransitionRequiredFieldInput = z.infer<typeof CreateLifecycleTransitionRequiredFieldSchema>;
export type UpdateLifecycleTransitionRequiredFieldInput = z.infer<typeof UpdateLifecycleTransitionRequiredFieldSchema>;