import { z } from 'zod';

/**
 * Zod schema for RequestStatusHistory validation
 */
export const RequestStatusHistorySchema = z.object({
  id: z.string().uuid(),
  requestStatusHistoryName: z.string().min(1, { message: "RequestStatusHistoryName is required" }),
  actorPersonId: z.object({ id: z.string().uuid(), displayName: z.string() }),
  changedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "ChangedAt is required" }),
  fieldName: z.string().min(1, { message: "FieldName is required" }),
  newStatusId: z.string().optional(),
  previousStatusId: z.string().optional(),
  requestId: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestStatusHistory (omits system-generated ID)
 */
export const CreateRequestStatusHistorySchema = RequestStatusHistorySchema.omit({ id: true });

/**
 * Schema for updating an existing RequestStatusHistory
 */
export const UpdateRequestStatusHistorySchema = RequestStatusHistorySchema;

export type RequestStatusHistoryInput = z.infer<typeof RequestStatusHistorySchema>;
export type CreateRequestStatusHistoryInput = z.infer<typeof CreateRequestStatusHistorySchema>;
export type UpdateRequestStatusHistoryInput = z.infer<typeof UpdateRequestStatusHistorySchema>;