import { z } from 'zod';

/**
 * Zod schema for RequestWorklog validation
 */
export const RequestWorklogSchema = z.object({
  id: z.string().uuid(),
  worklogName: z.string().min(1, { message: "WorklogName is required" }),
  duration: z.number(),
  notes: z.string().min(1, { message: "Notes is required" }),
  personId: z.object({ id: z.string().uuid(), displayName: z.string() }),
  requestId: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  workedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "WorkedAt is required" }),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestWorklog (omits system-generated ID)
 */
export const CreateRequestWorklogSchema = RequestWorklogSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestWorklog
 */
export const UpdateRequestWorklogSchema = RequestWorklogSchema;

export type RequestWorklogInput = z.infer<typeof RequestWorklogSchema>;
export type CreateRequestWorklogInput = z.infer<typeof CreateRequestWorklogSchema>;
export type UpdateRequestWorklogInput = z.infer<typeof UpdateRequestWorklogSchema>;