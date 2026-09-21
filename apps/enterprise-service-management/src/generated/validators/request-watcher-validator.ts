import { z } from 'zod';

/**
 * Zod schema for RequestWatcher validation
 */
export const RequestWatcherSchema = z.object({
  id: z.string().uuid(),
  requestWatcherName: z.string().min(1, { message: "RequestWatcherName is required" }),
  addedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "CreatedAt is required" }),
  personId: z.object({ id: z.string().uuid(), displayName: z.string() }),
  requestId: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestWatcher (omits system-generated ID)
 */
export const CreateRequestWatcherSchema = RequestWatcherSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestWatcher
 */
export const UpdateRequestWatcherSchema = RequestWatcherSchema;

export type RequestWatcherInput = z.infer<typeof RequestWatcherSchema>;
export type CreateRequestWatcherInput = z.infer<typeof CreateRequestWatcherSchema>;
export type UpdateRequestWatcherInput = z.infer<typeof UpdateRequestWatcherSchema>;