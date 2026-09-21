import { z } from 'zod';

/**
 * Zod schema for FieldDependency validation
 */
export const FieldDependencySchema = z.object({
  id: z.string().uuid(),
  dependencyName: z.string().min(1, { message: "Dependency Name is required" }),
  dependencyTypeKey: z.enum(['Options', 'Value', 'Visibility', 'Requirement']),
  sourceFieldDefinition: z.object({ id: z.string().uuid(), label: z.string() }),
  statusKey: z.enum(['Active', 'Inactive']),
  targetFieldDefinition: z.object({ id: z.string().uuid(), label: z.string() }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new FieldDependency (omits system-generated ID)
 */
export const CreateFieldDependencySchema = FieldDependencySchema.omit({ id: true });

/**
 * Schema for updating an existing FieldDependency
 */
export const UpdateFieldDependencySchema = FieldDependencySchema;

export type FieldDependencyInput = z.infer<typeof FieldDependencySchema>;
export type CreateFieldDependencyInput = z.infer<typeof CreateFieldDependencySchema>;
export type UpdateFieldDependencyInput = z.infer<typeof UpdateFieldDependencySchema>;