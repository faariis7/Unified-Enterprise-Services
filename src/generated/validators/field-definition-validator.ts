import { z } from 'zod';

/**
 * Zod schema for FieldDefinition validation
 */
export const FieldDefinitionSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1, { message: "Label is required" }),
  agentOnly: z.boolean(),
  configuration: z.string().optional(),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  defaultValue: z.string().optional(),
  fieldCode: z.string().min(1, { message: "Field Code is required" }),
  fieldTypeKey: z.enum(['Text', 'MultiLineText', 'Number', 'Date', 'DateAndTime', 'YesOrNo', 'SingleChoice', 'MultipleChoice', 'Person', 'Department', 'Site', 'Asset', 'Attachment', 'Email', 'Phone', 'URL', 'Information', 'Currency', 'RichText', 'BusinessUnit', 'Lookup', 'CascadingChoice', 'DisplayOnly']),
  formDefinition: z.object({ id: z.string().uuid(), name1: z.string() }),
  formSection: z.object({ id: z.string().uuid(), title: z.string() }),
  formVersionID: z.object({ id: z.string().uuid(), snapshotLabel: z.string() }),
  helpText: z.string().optional(),
  isDeleted: z.boolean().optional(),
  placeholder: z.string().optional(),
  readOnly1: z.boolean(),
  reportable: z.boolean().optional(),
  requesterVisible: z.boolean(),
  required: z.boolean(),
  searchable: z.boolean().optional(),
  sensitive: z.boolean(),
  sortOrder: z.number().int().optional(),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  visibilityRoleKey: z.string().optional(),
  widthKey: z.enum(['Full', 'Half', 'Third', 'TwoThirds']).optional(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new FieldDefinition (omits system-generated ID)
 */
export const CreateFieldDefinitionSchema = FieldDefinitionSchema.omit({ id: true });

/**
 * Schema for updating an existing FieldDefinition
 */
export const UpdateFieldDefinitionSchema = FieldDefinitionSchema;

export type FieldDefinitionInput = z.infer<typeof FieldDefinitionSchema>;
export type CreateFieldDefinitionInput = z.infer<typeof CreateFieldDefinitionSchema>;
export type UpdateFieldDefinitionInput = z.infer<typeof UpdateFieldDefinitionSchema>;