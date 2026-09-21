import { z } from 'zod';

/**
 * Zod schema for MetadataRecord validation
 */
export const MetadataRecordSchema = z.object({
  id: z.string().uuid(),
  recordName: z.string().min(1, { message: "Record Name is required" }),
  active: z.boolean(),
  configurationJSON: z.string().min(1, { message: "Configuration JSON is required" }),
  configurationKey: z.string().min(1, { message: "Configuration Key is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created At is required" }),
  createdBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  deletedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  deletedBy: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  entityRecordID: z.string().min(1, { message: "Entity Record ID is required" }),
  entityTypeKey: z.enum(['ServiceCategory', 'Service', 'FormDefinition', 'FormVersion', 'FormSection', 'FieldDefinition', 'FieldOption', 'ValidationRule', 'VisibilityRule', 'Request', 'RequestFieldValue', 'RequestAttachment', 'StatusDefinition', 'RequestAuditEvent']),
  isDeleted: z.boolean(),
  sortOrder: z.number().int(),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Updated At is required" }),
  updatedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
});

/**
 * Schema for creating a new MetadataRecord (omits system-generated ID)
 */
export const CreateMetadataRecordSchema = MetadataRecordSchema.omit({ id: true });

/**
 * Schema for updating an existing MetadataRecord
 */
export const UpdateMetadataRecordSchema = MetadataRecordSchema;

export type MetadataRecordInput = z.infer<typeof MetadataRecordSchema>;
export type CreateMetadataRecordInput = z.infer<typeof CreateMetadataRecordSchema>;
export type UpdateMetadataRecordInput = z.infer<typeof UpdateMetadataRecordSchema>;