import { z } from 'zod';

/**
 * Zod schema for RequestAttachment validation
 */
export const RequestAttachmentSchema = z.object({
  id: z.string().uuid(),
  fileName: z.string().min(1, { message: "FileName is required" }),
  contentType: z.string().min(1, { message: "ContentType is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "CreatedAt is required" }),
  fieldDefinition: z.object({ id: z.string().uuid(), label: z.string() }).optional(),
  fileSizeBytes: z.number().int(),
  isDeleted: z.boolean().optional(),
  requestId: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  stableFieldKey: z.string().optional(),
  uploadedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestAttachment (omits system-generated ID)
 */
export const CreateRequestAttachmentSchema = RequestAttachmentSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestAttachment
 */
export const UpdateRequestAttachmentSchema = RequestAttachmentSchema;

export type RequestAttachmentInput = z.infer<typeof RequestAttachmentSchema>;
export type CreateRequestAttachmentInput = z.infer<typeof CreateRequestAttachmentSchema>;
export type UpdateRequestAttachmentInput = z.infer<typeof UpdateRequestAttachmentSchema>;