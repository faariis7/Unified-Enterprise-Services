import { z } from 'zod';

/**
 * Zod schema for RequestTask validation
 */
export const RequestTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, { message: "Title is required" }),
  assignedPersonId: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  completedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  requestId: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  statusIdKey: z.enum(['NotStarted', 'InProgress', 'Completed', 'Blocked', 'Cancelled']),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestTask (omits system-generated ID)
 */
export const CreateRequestTaskSchema = RequestTaskSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestTask
 */
export const UpdateRequestTaskSchema = RequestTaskSchema;

export type RequestTaskInput = z.infer<typeof RequestTaskSchema>;
export type CreateRequestTaskInput = z.infer<typeof CreateRequestTaskSchema>;
export type UpdateRequestTaskInput = z.infer<typeof UpdateRequestTaskSchema>;