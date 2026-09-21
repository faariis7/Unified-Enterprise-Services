import { z } from 'zod';

/**
 * Zod schema for LifecycleDefinition validation
 */
export const LifecycleDefinitionSchema = z.object({
  id: z.string().uuid(),
  name1: z.string().min(1, { message: "Name is required" }),
  catalogItemCode: z.string().optional(),
  code: z.string().min(1, { message: "Code is required" }),
  default1: z.boolean(),
  requestTypeCode: z.string().min(1, { message: "Request Type Code is required" }),
  serviceCode: z.string().optional(),
  statusKey: z.enum(['Active', 'Inactive']),
  version: z.number().int(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new LifecycleDefinition (omits system-generated ID)
 */
export const CreateLifecycleDefinitionSchema = LifecycleDefinitionSchema.omit({ id: true });

/**
 * Schema for updating an existing LifecycleDefinition
 */
export const UpdateLifecycleDefinitionSchema = LifecycleDefinitionSchema;

export type LifecycleDefinitionInput = z.infer<typeof LifecycleDefinitionSchema>;
export type CreateLifecycleDefinitionInput = z.infer<typeof CreateLifecycleDefinitionSchema>;
export type UpdateLifecycleDefinitionInput = z.infer<typeof UpdateLifecycleDefinitionSchema>;