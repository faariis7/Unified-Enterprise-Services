import { z } from 'zod';

/**
 * Zod schema for ViewDefinition validation
 */
export const ViewDefinitionSchema = z.object({
  id: z.string().uuid(),
  viewName: z.string().min(1, { message: "View Name is required" }),
  entityName: z.string().min(1, { message: "Entity Name is required" }),
  statusKey: z.enum(['Active', 'Inactive']),
  surfaceKey: z.enum(['Requester', 'Agent']),
  version: z.number().int(),
  viewKey: z.string().min(1, { message: "View Key is required" }),
});

/**
 * Schema for creating a new ViewDefinition (omits system-generated ID)
 */
export const CreateViewDefinitionSchema = ViewDefinitionSchema.omit({ id: true });

/**
 * Schema for updating an existing ViewDefinition
 */
export const UpdateViewDefinitionSchema = ViewDefinitionSchema;

export type ViewDefinitionInput = z.infer<typeof ViewDefinitionSchema>;
export type CreateViewDefinitionInput = z.infer<typeof CreateViewDefinitionSchema>;
export type UpdateViewDefinitionInput = z.infer<typeof UpdateViewDefinitionSchema>;