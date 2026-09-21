import { z } from 'zod';

/**
 * Zod schema for FormDefinition validation
 */
export const FormDefinitionSchema = z.object({
  id: z.string().uuid(),
  name1: z.string().min(1, { message: "Name is required" }),
  currentVersionNumber: z.number().int(),
  description: z.string().min(1, { message: "Description is required" }),
  statusKey: z.enum(['Draft', 'Published', 'Retired']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new FormDefinition (omits system-generated ID)
 */
export const CreateFormDefinitionSchema = FormDefinitionSchema.omit({ id: true });

/**
 * Schema for updating an existing FormDefinition
 */
export const UpdateFormDefinitionSchema = FormDefinitionSchema;

export type FormDefinitionInput = z.infer<typeof FormDefinitionSchema>;
export type CreateFormDefinitionInput = z.infer<typeof CreateFormDefinitionSchema>;
export type UpdateFormDefinitionInput = z.infer<typeof UpdateFormDefinitionSchema>;