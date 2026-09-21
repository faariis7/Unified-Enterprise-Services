import { z } from 'zod';

/**
 * Zod schema for CatalogItemTaskTemplate validation
 */
export const CatalogItemTaskTemplateSchema = z.object({
  id: z.string().uuid(),
  taskTitle: z.string().min(1, { message: "Task Title is required" }),
  assignmentGroupCode: z.string().min(1, { message: "Assignment Group Code is required" }),
  catalogItem: z.object({ id: z.string().uuid(), itemName: z.string() }),
  description: z.string().min(1, { message: "Description is required" }),
  isRequired: z.boolean(),
  sortOrder: z.number().int(),
  statusKey: z.enum(['Active', 'Inactive']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new CatalogItemTaskTemplate (omits system-generated ID)
 */
export const CreateCatalogItemTaskTemplateSchema = CatalogItemTaskTemplateSchema.omit({ id: true });

/**
 * Schema for updating an existing CatalogItemTaskTemplate
 */
export const UpdateCatalogItemTaskTemplateSchema = CatalogItemTaskTemplateSchema;

export type CatalogItemTaskTemplateInput = z.infer<typeof CatalogItemTaskTemplateSchema>;
export type CreateCatalogItemTaskTemplateInput = z.infer<typeof CreateCatalogItemTaskTemplateSchema>;
export type UpdateCatalogItemTaskTemplateInput = z.infer<typeof UpdateCatalogItemTaskTemplateSchema>;