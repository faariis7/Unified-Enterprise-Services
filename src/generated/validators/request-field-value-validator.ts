import { z } from 'zod';

/**
 * Zod schema for RequestFieldValue validation
 */
export const RequestFieldValueSchema = z.object({
  id: z.string().uuid(),
  fieldLabel: z.string().min(1, { message: "FieldLabel is required" }),
  booleanValue: z.boolean().optional(),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  dateValue: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  displayValue: z.string().optional(),
  fieldDefinitionId: z.string().min(1, { message: "FieldDefinitionId is required" }),
  formVersion: z.object({ id: z.string().uuid(), snapshotLabel: z.string() }),
  isDeleted: z.boolean().optional(),
  numberValue: z.number().optional(),
  requestId: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  stableFieldKey: z.string().min(1, { message: "Stable Field Key is required" }),
  structuredValue: z.string().optional(),
  textValue: z.string().optional(),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "UpdatedAt is required" }),
  updatedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  value: z.string().min(1, { message: "Value is required" }),
  valueTypeKey: z.enum(['Text', 'Number', 'Currency', 'Date', 'DateTime', 'Boolean', 'SingleChoice', 'MultipleChoice', 'Person', 'Lookup', 'File', 'Structured']).optional(),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestFieldValue (omits system-generated ID)
 */
export const CreateRequestFieldValueSchema = RequestFieldValueSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestFieldValue
 */
export const UpdateRequestFieldValueSchema = RequestFieldValueSchema;

export type RequestFieldValueInput = z.infer<typeof RequestFieldValueSchema>;
export type CreateRequestFieldValueInput = z.infer<typeof CreateRequestFieldValueSchema>;
export type UpdateRequestFieldValueInput = z.infer<typeof UpdateRequestFieldValueSchema>;