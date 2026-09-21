import { z } from 'zod';

/**
 * Zod schema for RequestHistory validation
 */
export const RequestHistorySchema = z.object({
  id: z.string().uuid(),
  changeType: z.string().min(1, { message: "Change Type is required" }),
  actorPersonID: z.object({ id: z.string().uuid(), displayName: z.string() }),
  changedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Changed At is required" }),
  fieldName: z.string().min(1, { message: "Field Name is required" }),
  newValue: z.string().optional(),
  oldValue: z.string().optional(),
  reason: z.string().optional(),
  requestID: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  source: z.string().min(1, { message: "Source is required" }),
  workspaceID: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestHistory (omits system-generated ID)
 */
export const CreateRequestHistorySchema = RequestHistorySchema.omit({ id: true });

/**
 * Schema for updating an existing RequestHistory
 */
export const UpdateRequestHistorySchema = RequestHistorySchema;

export type RequestHistoryInput = z.infer<typeof RequestHistorySchema>;
export type CreateRequestHistoryInput = z.infer<typeof CreateRequestHistorySchema>;
export type UpdateRequestHistoryInput = z.infer<typeof UpdateRequestHistorySchema>;