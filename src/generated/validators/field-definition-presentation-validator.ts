import { z } from 'zod';

/**
 * Zod schema for FieldDefinitionPresentation validation
 */
export const FieldDefinitionPresentationSchema = z.object({
  id: z.string().uuid(),
  presentationName: z.string().min(1, { message: "Presentation Name is required" }),
  defaultValue: z.string().optional(),
  fieldDefinition: z.object({ id: z.string().uuid(), label: z.string() }),
  helpText: z.string().optional(),
  sortOrder: z.number().int(),
});

/**
 * Schema for creating a new FieldDefinitionPresentation (omits system-generated ID)
 */
export const CreateFieldDefinitionPresentationSchema = FieldDefinitionPresentationSchema.omit({ id: true });

/**
 * Schema for updating an existing FieldDefinitionPresentation
 */
export const UpdateFieldDefinitionPresentationSchema = FieldDefinitionPresentationSchema;

export type FieldDefinitionPresentationInput = z.infer<typeof FieldDefinitionPresentationSchema>;
export type CreateFieldDefinitionPresentationInput = z.infer<typeof CreateFieldDefinitionPresentationSchema>;
export type UpdateFieldDefinitionPresentationInput = z.infer<typeof UpdateFieldDefinitionPresentationSchema>;