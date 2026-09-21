import { z } from 'zod';

/**
 * Zod schema for ViewActionDefinition validation
 */
export const ViewActionDefinitionSchema = z.object({
  id: z.string().uuid(),
  actionName: z.string().min(1, { message: "Action Name is required" }),
  actionKey: z.string().min(1, { message: "Action Key is required" }),
  handlerKeyKey: z.enum(['AddComment', 'AddAttachment', 'EditRequest', 'TransitionRequest']),
  placementKey: z.enum(['Header', 'Section']),
  requiredPermission: z.string().optional(),
  sectionKey: z.string().optional(),
  sortOrder: z.number().int(),
  statusKey: z.enum(['Active', 'Inactive']),
  viewDefinition: z.object({ id: z.string().uuid(), viewName: z.string() }),
});

/**
 * Schema for creating a new ViewActionDefinition (omits system-generated ID)
 */
export const CreateViewActionDefinitionSchema = ViewActionDefinitionSchema.omit({ id: true });

/**
 * Schema for updating an existing ViewActionDefinition
 */
export const UpdateViewActionDefinitionSchema = ViewActionDefinitionSchema;

export type ViewActionDefinitionInput = z.infer<typeof ViewActionDefinitionSchema>;
export type CreateViewActionDefinitionInput = z.infer<typeof CreateViewActionDefinitionSchema>;
export type UpdateViewActionDefinitionInput = z.infer<typeof UpdateViewActionDefinitionSchema>;