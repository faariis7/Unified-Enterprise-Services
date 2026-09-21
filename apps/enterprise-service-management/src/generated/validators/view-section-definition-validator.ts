import { z } from 'zod';

/**
 * Zod schema for ViewSectionDefinition validation
 */
export const ViewSectionDefinitionSchema = z.object({
  id: z.string().uuid(),
  sectionName: z.string().min(1, { message: "Section Name is required" }),
  rendererKeyKey: z.enum(['RequestSummary', 'RequestDetails', 'RequestActivity', 'RequestAttachments', 'RequestApprovals', 'RequestServiceTargets']),
  requiredPermission: z.string().optional(),
  sectionKey: z.string().min(1, { message: "Section Key is required" }),
  sortOrder: z.number().int(),
  statusKey: z.enum(['Active', 'Inactive']),
  viewDefinition: z.object({ id: z.string().uuid(), viewName: z.string() }),
});

/**
 * Schema for creating a new ViewSectionDefinition (omits system-generated ID)
 */
export const CreateViewSectionDefinitionSchema = ViewSectionDefinitionSchema.omit({ id: true });

/**
 * Schema for updating an existing ViewSectionDefinition
 */
export const UpdateViewSectionDefinitionSchema = ViewSectionDefinitionSchema;

export type ViewSectionDefinitionInput = z.infer<typeof ViewSectionDefinitionSchema>;
export type CreateViewSectionDefinitionInput = z.infer<typeof CreateViewSectionDefinitionSchema>;
export type UpdateViewSectionDefinitionInput = z.infer<typeof UpdateViewSectionDefinitionSchema>;